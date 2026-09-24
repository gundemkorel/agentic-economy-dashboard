# Data Sources

## Registry

The machine-readable source registry is config/sources.json. It contains source URLs, supported metrics, cadence, access method, automation state, data type, and interpretation caveats.

## Automated source

The MCP Registry ingest script reads the public registry endpoint, stores a dated raw response under data/raw/mcp-registry, and writes a normalized point to data/processed. It measures registered server records, which is a supply proxy only.

## Token-backed source

Cloudflare Radar is the first network telemetry adapter. It uses a `CLOUDFLARE_RADAR_API_TOKEN` GitHub Actions secret, which is never committed or exposed in the static site. The adapter requests current and prior 30-day AI-bot HTTP time series in one call and publishes their comparable mean-index change. Cloudflare returns `MIN0_MAX`-normalized data for this endpoint, so the dashboard does not call it raw request volume or a complete agentic-activity measure.

## Manual sources

Fastly, Akamai, Zscaler, Anthropic, company investor relations, and filings should initially be added through reviewed manual observations. Every manual observation must include a primary source URL, period, retrieval date, and methodological caveat.

## Market expectations

No price, valuation, or consensus data are currently published. A future provider must support consistent retrieval dates, fiscal-year conventions, and definition labels. Do not add figures merely to fill a dashboard.
