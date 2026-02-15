# Feedback Loop

Use this loop for every non-trivial change:

1. Hypothesis
- Define expected behavior and acceptance criteria.

2. Run
- Start harness (`harness:up`) and execute targeted checks.

3. Observe
- Inspect API output, tests, and logs in Grafana/Loki/Prometheus.

4. Fix
- Implement minimal correction and rerun smoke + checks.

5. Record
- Capture decisions and risks in `PLANS.md`.
