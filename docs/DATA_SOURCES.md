# Data Sources

## Registry

The machine-readable source registry is config/sources.json. It contains source URLs, supported metrics, cadence, access method, automation state, data type, and interpretation caveats.

## Automated source

The MCP Registry ingest script reads the public registry endpoint, stores a dated raw response under data/raw/mcp-registry, and writes a normalized point to data/processed. It measures registered server records, which is a supply proxy only.

## Token-backed source

Cloudflare Radar is planned as the first network telemetry adapter. Current Cloudflare documentation requires a Radar API token. The repository contains no token and the live site shows no Cloudflare measurement until that token is supplied as a GitHub Actions secret.

## Manual sources

Fastly, Akamai, Zscaler, Anthropic, company investor relations, and filings should initially be added through reviewed manual observations. Every manual observation must include a primary source URL, period, retrieval date, and methodological caveat.

## Market expectations

No price, valuation, or consensus data are currently published. A future provider must support consistent retrieval dates, fiscal-year conventions, and definition labels. Do not add figures merely to fill a dashboard.
