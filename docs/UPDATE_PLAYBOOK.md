# Update Playbook

## Weekly

1. Review automated MCP Registry output and confirm the raw snapshot committed.
2. Review the automated Cloudflare Radar observation and confirm the API's current/prior 30-day comparison, normalization, and caveat remain valid.
3. Update the signal-maturity state only when a metric has a new comparable observation. Do not call a trend before three comparable observations.
   - Confirm the generated observation register kept the new point eligible only when its source definition and minimum spacing rule were met. A weekly Cloudflare collection does not become a separate trend point until its 30-day comparison window is sufficiently separated.
4. Review the triangulation ledger when sources differ in direction, period, sample, or definition; add an explanation instead of averaging them.
5. Log material network, agent-platform, identity, security, gateway, and company-capture developments in `data/manual/evidence-log.json` as dated notes.
6. Record new contrary evidence alongside confirming evidence; preserve the original entry rather than rewriting history.
7. Treat a material contract, customer commitment, or product announcement as a separate dated event—not as revenue. Log the announced amount, timing, capacity / funding obligations, and dilution terms when disclosed; leave revenue, margin, cash return, and expectation-gap fields unresolved until reported.
8. Review the Eulerpool snapshot's retrieval date, coverage, annual fiscal periods, quote timing, and any unavailable fields. Confirm the visible `Data by Eulerpool` attribution remains present. If the snapshot fiscal date differs from the configured company fiscal year-end, leave the dashboard's “do not compare” read in place rather than forcing a gap conclusion.

## Monthly

1. Review MCP ecosystem breadth and changes in integrations.
2. Review Fastly, Zscaler, and Anthropic materials when a new report or dataset appears. Add a source-linked point to `data/manual/enterprise-adoption-observations.json` only when its period and definition are reproducible.
3. Update AI-mediation proxies only when definitions are sufficiently clear. Keep qualitative statements qualitative.

## Quarterly

1. Update the core and secondary company research queues after earnings and filings. Keep the benchmark shelf separate unless a documented promotion decision is made.
2. Append a new record to data/manual/company-capture-history.json before replacing current company-card KPIs or secondary-company baselines. Preserve the fiscal period, report date, GAAP/non-GAAP definition, source, capture read, and counterpoint.
3. Refresh consensus and valuation only from the selected consistent provider.
4. Do not upgrade a Gap Readiness state unless fiscal-period alignment, accounting convention, two point-in-time consensus observations, and valuation history are all documented.
5. Update every relevant thesis-breaker test with current status, a source/date, and an explicit downgrade action.
6. Review the Akamai scenario lab inputs after earnings. Keep company-reported values, attributed current market context, and project assumptions in separate fields; do not backfill vendor market data into the repository.
   - Complete the Akamai Q3 scorecard from the release, filing, and management commentary; append its company-capture history before revising scenario assumptions.
   - Do not mechanically fold a material contract into the scenario assumptions until its revenue-recognition schedule, unit economics, capex / funding path, and warrant or share-count treatment are disclosed.
7. Complete each newly reported Elastic, Dynatrace, and F5 scorecard from the earnings release, filing, and management commentary. Update `data/manual/company-earnings-scorecards.json` only after appending the prior-period history record; label each check as upgraded, unresolved, or contrary rather than inferring an overall score.
8. Reconfirm that this remains a personal, non-commercial dashboard and that Eulerpool's public-attribution condition remains satisfied. If the scope or terms change, remove the Eulerpool secret and redeploy immediately.
9. If FMP is ever activated as a fallback, reconfirm that its written agreement still covers public Pages display, downloadable normalized data, requested endpoints, attribution, and retention. If it does not, run the FMP removal workflow immediately.
10. Reassess whether evidence changed the macro thesis, company capture, or a thesis breaker.
11. Update `data/manual/secondary-company-research.json` and the matching `companies/` research note together for ZS, TWLO, FSLY, OKTA, NET, DDOG, or PANW. Keep each secondary candidate's one-question card concise; preserve the detailed evidence and counterargument in the structured data and note.

## Pull request checklist

- Primary source linked
- Period and retrieval date recorded
- Data type labeled
- Definition and methodology documented
- Impact on thesis stated
- Counterargument noted
