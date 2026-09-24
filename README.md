# Agentic Economy Dashboard

The Agentic Economy Dashboard is a lightweight, static research instrument for tracking evidence behind the Wave 2 thesis:

> As one human intent creates more machine actions, infrastructure consumption should compound before consensus models fully reflect it.

The dashboard keeps six questions separate:

1. Machine Activity — are autonomous systems doing more things?
2. Enterprise Adoption & Control — are deployments governed deeply enough to change demand?
3. Company Capture — which businesses monetize the activity?
4. Market Expectations — what is already in estimates and multiples?
5. Expectation Gap — where could evidence be moving faster than consensus?
6. Thesis Breakers — what would falsify the thesis?

## Run locally

This is a dependency-free site. Serve the repository root with any static server, then open the local URL. For example, run: python3 -m http.server 8000

## Update rhythm

- Weekly: fast proxies such as Radar, registry activity, releases, and incident notes.
- Monthly: adoption, governance, security, and usage disclosures.
- Quarterly: earnings, filings, guidance, estimates, valuation, and company capture.

The UI reads from data/metrics.json and data/sources.json. Replace observations in those files; do not hard-code new data into app.js. Each observation should carry a date, source, direction, confidence, and a short note in future ingestion work.

## Planned ingestion adapters

The structure is intentionally ready for adapters that can be added later under scripts/ or a separate data pipeline:

- Cloudflare Radar
- Fastly
- Akamai
- Zscaler
- Anthropic Economic Index
- MCP Registry
- Company investor-relations pages, earnings releases, and SEC filings

Keep raw pulls separate from the curated snapshot used by the site. Every derived metric should remain traceable to a public source URL and retrieval date.

## GitHub Pages

The repository includes a GitHub Actions workflow at .github/workflows/pages.yml. Enable Pages with GitHub Actions as the source in repository settings. The expected public URL is:

https://gundemkorel.github.io/agentic-economy-dashboard/
