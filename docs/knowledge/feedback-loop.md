# Feedback Loop

Use this loop for every non-trivial change:

1. Hypothesis
- Define expected behavior and acceptance criteria.

2. Run
- Start harness (`harness:up`) and execute smoke + SLA + e2e checks.

3. Observe
- Inspect API output, tests, and logs in Grafana/Loki/Prometheus.
- Validate p95 latency and error-rate SLA results from `harness:sla`.

4. Fix
- Implement minimal correction and rerun smoke + SLA + e2e.

5. Record
- Capture decisions and risks in `PLANS.md`.
