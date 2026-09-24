# Update Playbook

## Weekly

1. Review automated MCP Registry output and confirm the raw snapshot committed.
2. Review the automated Cloudflare Radar observation and confirm the API's current/prior 30-day comparison, normalization, and caveat remain valid.
3. Update the signal-maturity state only when a metric has a new comparable observation. Do not call a trend before three comparable observations.
4. Review the triangulation ledger when sources differ in direction, period, sample, or definition; add an explanation instead of averaging them.
5. Log material network, agent-platform, identity, security, gateway, and company-capture developments in `data/manual/evidence-log.json` as dated notes.
6. Record new contrary evidence alongside confirming evidence; preserve the original entry rather than rewriting history.
7. Review the Eulerpool snapshot's retrieval date, coverage, annual fiscal periods, quote timing, and any unavailable fields. Confirm the visible `Data by Eulerpool` attribution remains present. If the snapshot fiscal date differs from the configured company fiscal year-end, leave the dashboard's “do not compare” read in place rather than forcing a gap conclusion.

## Monthly

1. Review MCP ecosystem breadth and changes in integrations.
2. Review Fastly, Zscaler, and Anthropic materials when a new report or dataset appears. Add a source-linked point to `data/manual/enterprise-adoption-observations.json` only when its period and definition are reproducible.
3. Update AI-mediation proxies only when definitions are sufficiently clear. Keep qualitative statements qualitative.

## Quarterly

1. Update the company research queue after earnings and filings.
2. Add company-reported KPIs and preserve the fiscal period and GAAP/non-GAAP definition.
3. Refresh consensus and valuation only from the selected consistent provider.
4. Do not upgrade a Gap Readiness state unless fiscal-period alignment, accounting convention, two point-in-time consensus observations, and valuation history are all documented.
5. Update every relevant thesis-breaker test with current status, a source/date, and an explicit downgrade action.
6. Review the Akamai scenario lab inputs after earnings. Keep company-reported values, attributed current market context, and project assumptions in separate fields; do not backfill vendor market data into the repository.
7. Reconfirm that this remains a personal, non-commercial dashboard and that Eulerpool's public-attribution condition remains satisfied. If the scope or terms change, remove the Eulerpool secret and redeploy immediately.
8. If FMP is ever activated as a fallback, reconfirm that its written agreement still covers public Pages display, downloadable normalized data, requested endpoints, attribution, and retention. If it does not, run the FMP removal workflow immediately.
9. Reassess whether evidence changed the macro thesis, company capture, or a thesis breaker.

## Pull request checklist

- Primary source linked
- Period and retrieval date recorded
- Data type labeled
- Definition and methodology documented
- Impact on thesis stated
- Counterargument noted
