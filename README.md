# Agentic Economy Research Project

This repository is an investment-research system centered on a simple question:

> Which scarce, billable resources see rising consumption as machines take more actions—and where are those economics not yet reflected in consensus?

The static dashboard is one component of the system, not a stock-price page or an AI-keyword screen. Its primary focus is Wave 2: models interacting with digital systems through traffic, APIs, context retrieval, security checks, identity, observability, communication, and control planes.

The project separately tracks:

1. Wave-2 Pulse — machine activity, enterprise adoption/control, and AI mediation.
2. Company Capture — whether candidates convert the activity into revenue quality and cash flow.
3. Gap Readiness — whether operating evidence, fiscal-aligned estimates, and valuation history are sufficient for an expectation-gap call.
4. Thesis Breakers — evidence that should reduce conviction.
5. Decision Gates & Scenario Labs — the research sequence and explicitly labelled company-assumption models.
6. Next Earnings — compact company-capture scorecards that turn the next reported periods into a few explicit tests.
7. Observation History — the baseline count, comparability rules, collection cadence, and missing proof behind every future conclusion.

Read the full [thesis](docs/THESIS.md), [definitions](docs/DEFINITIONS.md), [methodology](docs/METHODOLOGY.md), [source guide](docs/DATA_SOURCES.md), [update playbook](docs/UPDATE_PLAYBOOK.md), [Eulerpool personal-use setup](docs/EULERPOOL_SETUP.md), and [FMP public-display setup](docs/FMP_SETUP.md).

## Run locally

This is a dependency-free site. Serve the repository root with any static server, then open the local URL. For example, run: python3 -m http.server 8000

## Update rhythm

- Weekly: fast proxies such as Radar, registry activity, releases, and incident notes.
- Monthly: adoption, governance, security, and usage disclosures.
- Quarterly: earnings, filings, guidance, estimates, valuation, and company capture.

The user interface reads from structured data under data/ and configuration under config/. Replace observations in data files; do not hard-code research data into app.js.

## Planned ingestion adapters

The structure has explicit raw, processed, manual, configuration, scripts, documentation, and company-research layers:

- data/raw/ — immutable dated raw snapshots, where practical
- data/processed/ — normalized observations used by the site
- data/manual/ — reviewed research queues and manual observations
- config/ — source registry and watchlist configuration
- scripts/ — ingestion and normalization adapters
- docs/ — durable research methodology
- companies/ — individual company research files

The first functioning paths are:

public registry → scripts/ingest-mcp-registry.mjs → dated raw snapshot → normalized observation → dashboard card

Cloudflare Radar → scripts/ingest-cloudflare-radar.mjs → dated raw snapshot → normalized observation → dashboard card

The observation-register build then reads the automated and reviewed histories, counts only time-separated compatible points, and produces data/processed/observation-register.json. It does not calculate a trend direction; reaching a threshold only makes a series ready for analyst review. The public [History page](history.html) exposes that distinction, including company-capture sequences and the market-data retention boundary.

Reviewed public report → data/manual/enterprise-adoption-observations.json → dashboard card

Material confirming, contrary, and unresolved developments belong in data/manual/evidence-log.json. The Thesis Breakers page renders this as a rolling 90-day log; update it without rewriting older entries.

The first independent network baseline is a reviewed Fastly report. It keeps the source's crawler/fetcher definitions intact and records its fixed-cohort methodology; it is not treated as a measure of all agentic traffic.

Dashboard data requests use a no-store cache policy, so weekly or manual source refreshes are visible on the next page refresh rather than being hidden behind a browser's stale JSON cache.

The Radar adapter requires `CLOUDFLARE_RADAR_API_TOKEN` locally or as a GitHub Actions secret. No token is committed, and only the derived, source-attributed observation is published. Its first metric is a normalized AI-bot traffic proxy, not a raw request count or an estimate of all agentic activity.

Keep raw pulls separate from the curated snapshot used by the site. Every derived metric should remain traceable to a public source URL, period, retrieval date, methodology, and observed/estimated label.

The Gap Readiness page uses Eulerpool for a compact current daily snapshot of consensus and delayed/EOD quote inputs. It requires the protected `EULERPOOL_API_KEY` Actions secret and preserves a visible `Data by Eulerpool` link beside each Eulerpool-derived field. The owner has confirmed the dashboard's personal, non-commercial daily static-snapshot use with the provider. The workflow creates only a current normalized snapshot in the deployed Pages artifact—no raw response, public repository snapshot, or vendor-data archive. A current snapshot is market context, not a revision-history series or an expectation-gap conclusion. See the [activation and removal steps](docs/EULERPOOL_SETUP.md). Financial Modeling Prep remains a separately gated fallback.

The Akamai scenario lab reads company-issued reported baselines and applies transparent project assumptions. When a current attributed market snapshot is available, it uses that price only at render time for a simplified reverse-expectations bridge; it does not store vendor price history or present a target price.

The same Akamai page now includes a pre-release Q3 earnings scorecard. It compares Q3 results with the Q2 reported baseline and company-issued guide, tests CIS conversion, paid agent-control monetization, delivery trends, cash returns, and contract-fulfillment risk, then records an evidence upgrade, watch, or downgrade without treating any outcome as an expectation-gap call.

The [Next Earnings page](earnings.html) applies the same decision discipline in a deliberately compact form for Elastic, Dynatrace, and F5: one central question, company-issued guidance, three expandable decision checks, and official-source links. Its structured data lives in `data/manual/company-earnings-scorecards.json`, so a quarterly update does not require rewriting the interface.

## GitHub Pages

The repository includes GitHub Actions workflows for Pages deployment plus weekly MCP Registry and Cloudflare Radar refreshes. Successful refreshes trigger a Pages redeployment. Enable Pages with GitHub Actions as the source in repository settings. The expected public URL is:

https://gundemkorel.github.io/agentic-economy-dashboard/
