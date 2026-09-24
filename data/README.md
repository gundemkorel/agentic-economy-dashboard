# Data layer

metrics.json is the small, human-reviewable snapshot rendered by the site. sources.json is the source register used by the appendix.

When automated ingestion is added, keep this boundary:

public source -> raw dated pull -> normalized observation -> reviewed snapshot -> static site

Cloudflare Radar is a deliberate exception to any temptation to label all values as volumes: its AI-bot endpoint returns `MIN0_MAX`-normalized values. The derived observation keeps the returned normalization, request windows, and prior-window comparison, and it must not be compared as a raw-value series across separate retrievals.

`data/processed/eulerpool-market-expectations-<build>.json` is created only by the Eulerpool personal-use workflow. It is a current, normalized display snapshot—not a raw pull and not a historical archive. The file is ignored by Git and is created inside the Pages build workspace, so it is served by the approved deployment without being committed to public repository history. Do not create or commit it manually; use the protected workflow, preserve the `Data by Eulerpool` attribution, and follow `docs/EULERPOOL_SETUP.md`.

`data/processed/fmp-market-expectations.json` remains an inactive, gated fallback. Do not create or commit it manually; use the protected workflow and follow `docs/FMP_SETUP.md` if its agreement is ever completed.

`data/manual/research-gates.json` records the defined research sequence and each core company’s current gate, rather than assigning a composite investment score. `data/manual/triangulation.json` keeps non-comparable source samples side by side. `data/manual/akam-scenario-lab.json` contains only company-reported baseline values and the project’s stated assumptions; it never stores current vendor market data.

The observation policy declares each series’ minimum spacing, eligible-observation threshold, comparability condition, permitted decision use, and prohibited inference. The generated observation register joins that policy to automated history, reviewed manual evidence, and the company-capture archive. It may say a series is ready for analyst trend review, but it never assigns a trend direction automatically.

Company baselines belong in data/manual/company-capture-history.json and are appended after each relevant earnings release. Preserve old records before updating current company cards; a single quarter remains a baseline, not a capture trend.

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
