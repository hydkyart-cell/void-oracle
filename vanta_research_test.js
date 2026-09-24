const fs=require("fs");
const vm=require("vm");

const html=fs.readFileSync("public/index.html","utf8");
const js=html.match(/<script\b[^>]*>([\s\S]*?)<\/script>/i)?.[1];

if(!js)throw new Error("No script block found");

const wanted=[
  "tr","ema","rsi","atr","macd","adx","bbands","vwap","pivotPoints",
  "fibLevels","volA","obFind","structure","isDiscount","absorption",
  "swings","analyze","researchPlan","researchNetR","runResearch"
];

const lines=js.split("\n");
const blocks=[];

for(const name of wanted){
  const re=new RegExp(`function ${name}\\s*\\(`);
  const start=lines.findIndex(x=>re.test(x));
  if(start<0)throw new Error(`Missing ${name}`);

  let depth=0;
  let started=false;
  let end=start;

  for(let i=start;i<lines.length;i++){
    for(const ch of lines[i]){
      if(ch==="{"){depth++;started=true}
      else if(ch==="}")depth--;
    }
    if(started&&depth===0){
      end=i;
      break;
    }
  }

  blocks.push(lines.slice(start,end+1).join("\n"));
}

const context={
  console,
  CFG:{
    emaFast:20,emaMed:50,emaSlow:200,rsi:14,atr:14,adx:14,
    bb:20,lookback:14,minScore:72,minMargin:12,rr:2,
    obLook:50,obImp:4,obMinDisp:1.0,obMaxDist:1.2,
    volLook:20,volMin:1.2,driftMax:0.4,comm:0.04
  },
  RESEARCH_CFG:{rr:2,spread:0,slippage:0,commissionPct:0.04},
  $:()=>({value:""}),
  Math,
  Date,
  Number,
  Array,
  Object,
  Set
};

vm.createContext(context);
vm.runInContext(blocks.join("\n"),context);

async function fetchHistory(sym,tf,bars){
  const ivl={
    "1m":60000,"5m":300000,"15m":900000,
    "1h":3600000,"4h":14400000
  }[tf];

  const out=[];
  let end=Date.now();

  while(out.length<bars){
    const limit=Math.min(1000,bars-out.length);
    const url=`https://api.binance.com/api/v3/klines?symbol=${sym}&interval=${tf}&limit=${limit}&endTime=${end}`;

    const r=await fetch(url);
    if(!r.ok)throw new Error(`Binance ${r.status}`);

    const rows=await r.json();
    if(!rows.length)break;

    for(const k of rows){
      if(+k[6]<Date.now()-1000){
        out.push({
          t:+k[0],o:+k[1],h:+k[2],
          l:+k[3],c:+k[4],v:+k[5]
        });
      }
    }

    const first=+rows[0][0];
    if(!Number.isFinite(first)||rows.length<limit)break;
    end=first-ivl;
  }

  const seen=new Set();

  return out.sort((a,b)=>a.t-b.t)
    .filter(x=>!seen.has(x.t)&&seen.add(x.t))
    .slice(-bars);
}

(async()=>{
  const c=await fetchHistory("BTCUSDT","15m",2000);

  let signals=0;
  let longs=0;
  let shorts=0;
  let maxLS=0;
  let maxSS=0;
  let maxMargin=0;
  let nearGate=0;

  for(let i=200;i<c.length;i++){
    const a=context.analyze(c.slice(0,i+1));
    if(!a)continue;

    maxLS=Math.max(maxLS,a.ls||0);
    maxSS=Math.max(maxSS,a.ss||0);
    maxMargin=Math.max(maxMargin,a.margin||0);

    if((a.ls||0)>=60 || (a.ss||0)>=60)nearGate++;

    if(a.dir){
      signals++;
      if(a.dir==="LONG")longs++;
      if(a.dir==="SHORT")shorts++;
    }
  }

  const z=c;
  const close=z.map(x=>x.c);
  const ii=z.length-1;

  const diag={
    ema20:context.ema(close,20)[ii],
    ema50:context.ema(close,50)[ii],
    ema200:context.ema(close,200)[ii],
    rsi:context.rsi(close,14)[ii],
    atr:context.atr(z,14)[ii],
    macdHist:context.macd(close).h[ii],
    adx:context.adx(z,14).adx[ii],
    bbUpper:context.bbands(close)[ii]?.upper
  };

  const result=context.runResearch(c);

  console.log(JSON.stringify({
    candles:c.length,
    first:c[0]?.t,
    last:c[c.length-1]?.t,
    signals,
    longs,
    shorts,
    maxLS,
    maxSS,
    maxMargin,
    nearGate,
    indicatorDiagnostic:diag,
    result:{
      count:result?.count,
      wins:result?.wins,
      losses:result?.losses,
      be:result?.be,
      winRate:result?.winRate,
      expectancy:result?.expectancy,
      profitFactor:result?.profitFactor,
      maxDrawdown:result?.maxDrawdown
    }
  },null,2));
})();
