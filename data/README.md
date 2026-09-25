# Data layer

metrics.json is the small, human-reviewable snapshot rendered by the site. sources.json is the source register used by the appendix.

When automated ingestion is added, keep this boundary:

public source -> raw dated pull -> normalized observation -> reviewed snapshot -> static site

Cloudflare Radar is a deliberate exception to any temptation to label all values as volumes: its AI-bot endpoint returns `MIN0_MAX`-normalized values. The derived observation keeps the returned normalization, request windows, and prior-window comparison, and it must not be compared as a raw-value series across separate retrievals.

`data/processed/eulerpool-market-expectations-<build>.json` is created only by the Eulerpool personal-use workflow. It is a current, normalized display snapshot—not a raw pull and not a historical archive. The file is ignored by Git and is created inside the Pages build workspace, so it is served by the approved deployment without being committed to public repository history. Do not create or commit it manually; use the protected workflow, preserve the `Data by Eulerpool` attribution, and follow `docs/EULERPOOL_SETUP.md`.

`data/processed/fmp-market-expectations.json` remains an inactive, gated fallback. Do not create or commit it manually; use the protected workflow and follow `docs/FMP_SETUP.md` if its agreement is ever completed.

`data/manual/research-gates.json` records the defined research sequence and each core company’s current gate, rather than assigning a composite investment score. `data/manual/triangulation.json` keeps non-comparable source samples side by side. `data/manual/akam-scenario-lab.json` contains only company-reported baseline values and the project’s stated assumptions; it never stores current vendor market data.

The observation policy declares each series’ minimum spacing, eligible-observation threshold, comparability condition, permitted decision use, and prohibited inference. The generated observation register joins that policy to automated history, reviewed manual evidence, and the company-capture archive. It may say a series is ready for analyst trend review, but it never assigns a trend direction automatically.

Company baselines belong in data/manual/company-capture-history.json and are appended after each relevant earnings release. Preserve old records before updating current company cards; a single quarter remains a baseline, not a capture trend. Core companies and secondary candidates have separate but identical evidence standards; benchmarks are intentionally excluded from this sequence.

`data/manual/secondary-company-research.json` powers the Research Queue page. It holds the reported baseline, one causal question, commercial tests, counterarguments, primary-source links, and promotion protocol for each secondary candidate. It also holds the smaller benchmark shelf. Update this file and the corresponding `companies/` note together after a relevant earnings release; do not turn a benchmark into a candidate without recording why its role changed.

`data/manual/agentic-economics-map.json` powers the Economic Map page. Its `priorityTests` summarize the three current proof gaps in `docs/WORKLOG.md`; update them only from dated evidence. Update the work-unit examples and resource layers when an architecture actually changes; update a company only from a dated primary source. Keep paid units, cash-flow baselines, list or hypothetical prices, assumed incremental cash conversion, missing proof, thesis breakers, and expectations status in separate fields. The page derives illustrative 5% materiality thresholds from the numeric fields. Run `node scripts/validate-economic-map.mjs` after every edit. It contains no licensed market-data snapshots or consensus history.

The AKAM deal-hurdle data file powers the minimum cash-recovery screen. Only the disclosed conditional commitment and management-estimated capex are company inputs; retention rates and extra capex are hypothetical. Keep it reconciled with the Economic Map's AKAM project amounts and run the deal-hurdle validator after every edit. No provider consensus or current market quote belongs in this file.

Recommended observation fields for future adapters:

~~~json
{
  "metricId": "machine_requests",
  "period": "2026-09",
  "value": 0,
  "unit": "index",
  "direction": "up|flat|down|pending",
  "confidence": "high|medium|low|baseline",
  "source": "https://example.com/primary-source",
  "retrievedAt": "2026-09-23",
  "note": "Short interpretation and caveat."
}
~~~
