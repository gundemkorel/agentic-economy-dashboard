# Agentic Economy Research Project

This repository is an investment-research system centered on a simple question:

> Which scarce, billable resources see rising consumption as machines take more actions—and where are those economics not yet reflected in consensus?

The static dashboard is one component of the system, not a stock-price page or an AI-keyword screen. Its primary focus is Wave 2: models interacting with digital systems through traffic, APIs, context retrieval, security checks, identity, observability, communication, and control planes.

The project separately tracks:

1. Wave-2 Pulse — machine activity, enterprise adoption/control, and AI mediation.
2. Company Capture — whether candidates convert the activity into revenue quality and cash flow.
3. Expectations Gap — operating evidence versus Street estimates and valuation.
4. Thesis Breakers — evidence that should reduce conviction.

Read the full [thesis](docs/THESIS.md), [methodology](docs/METHODOLOGY.md), [source guide](docs/DATA_SOURCES.md), and [update playbook](docs/UPDATE_PLAYBOOK.md).

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

The Radar adapter requires `CLOUDFLARE_RADAR_API_TOKEN` locally or as a GitHub Actions secret. No token is committed, and only the derived, source-attributed observation is published. Its first metric is a normalized AI-bot traffic proxy, not a raw request count or an estimate of all agentic activity.

Keep raw pulls separate from the curated snapshot used by the site. Every derived metric should remain traceable to a public source URL, period, retrieval date, methodology, and observed/estimated label.

## GitHub Pages

The repository includes GitHub Actions workflows for Pages deployment plus weekly MCP Registry and Cloudflare Radar refreshes. Successful refreshes trigger a Pages redeployment. Enable Pages with GitHub Actions as the source in repository settings. The expected public URL is:

https://gundemkorel.github.io/agentic-economy-dashboard/
