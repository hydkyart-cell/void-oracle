# KYART LOOP v0.1

## Purpose

KYART LOOP is a controlled feedback loop for improving VANTA through
observation, diagnosis, hypothesis, implementation, verification, measurement,
and recorded learning.

The system must improve from evidence, not from arbitrary signal generation.

## Cycle

1. OBSERVE
   - Connection state
   - Data freshness
   - Candle count
   - WebSocket state
   - Analyzer state
   - Score
   - Margin
   - Drift
   - Regime
   - MTF alignment
   - Signal gates
   - Runtime errors

2. DIAGNOSE
   - Identify the actual failure or bottleneck.
   - Separate data failures from analyzer failures.
   - Separate legitimate gating from implementation bugs.

3. HYPOTHESIZE
   - Form one falsifiable hypothesis.
   - Define the expected observable result.

4. CHANGE
   - Make the smallest reversible implementation change.
   - Never weaken risk or signal gates merely to increase signal frequency.

5. VERIFY
   - Run deterministic checks.
   - Verify no unrelated functionality regressed.

6. MEASURE
   - Compare behavior before and after the change.
   - Record quantitative evidence where possible.

7. LEARN
   - Record what worked, failed, or remains uncertain.

8. NEXT CYCLE
   - Select the highest-value unresolved issue.

## Safety Rules

- Never modify master directly.
- Prefer feature branches.
- Never manufacture signals by arbitrarily lowering quality gates.
- Never treat SCANNING as proof of a live connection.
- Never treat cached data as live data.
- Never promote experimental trading logic to live execution without explicit review.
- Preserve reversible changes and recovery points.
- Every cycle must leave an auditable record.

## Success Criteria

A cycle is successful only when:

- The original problem is clearly defined.
- A hypothesis was tested.
- The implementation is verifiable.
- The result is measured.
- The learning is recorded.
- The next action is explicit.
