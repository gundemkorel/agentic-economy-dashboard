# Data Sources

## Registry

The machine-readable source registry is config/sources.json. It contains source URLs, supported metrics, cadence, access method, automation state, data type, and interpretation caveats.

## Automated source

The MCP Registry ingest script reads the public registry endpoint, stores a dated raw response under data/raw/mcp-registry, and writes a normalized point to data/processed. It measures registered server records, which is a supply proxy only.

## Token-backed source

Cloudflare Radar is the first network telemetry adapter. It uses a `CLOUDFLARE_RADAR_API_TOKEN` GitHub Actions secret, which is never committed or exposed in the static site. The adapter requests current and prior 30-day AI-bot HTTP time series in one call and publishes their comparable mean-index change. Cloudflare returns `MIN0_MAX`-normalized data for this endpoint, so the dashboard does not call it raw request volume or a complete agentic-activity measure.

## Manual sources

Fastly, Akamai, Zscaler, Anthropic, company investor relations, and filings should initially be added through reviewed manual observations. Every manual observation must include a primary source URL, period, retrieval date, and methodological caveat.

The first reviewed enterprise-adoption baseline lives in `data/manual/enterprise-adoption-observations.json`. It records a Zscaler network-sample observation plus two Anthropic product-usage observations. The Zscaler report covers calendar 2025; the Anthropic report covers an April–June 2026 sample. Neither source is a census of enterprises, agents, or AI activity, so values must retain their source-specific definitions rather than being combined into a synthetic index.

The same file now includes a Fastly network baseline. Its report covers January–May 2026 through a fixed cohort of Fastly customers and separates source-defined AI crawlers from fetchers. The dashboard records the May fetcher share and the report's stated January–May request-growth context. It does not interpret fetchers as confirmed autonomous actions or aggregate Fastly's sample with Cloudflare's normalized index.

The same manual-observation file also includes an Akamai commerce-specific observation: Akamai reported that 47.9% of traffic across its network in the commerce vertical consisted of AI bots as of December 2025. This is deliberately labeled as an industry-specific network and security proxy. It can include crawler, scraping, fraud, and other nonproductive traffic, so it must not be read as the share of commerce completed by agents or as a global agentic-activity measure.

`data/manual/evidence-log.json` is a separate, rolling record of material developments. Each entry states whether it is confirming, contrary, mixed, or measurement-only and links directly to its source. Do not turn a qualitative source statement into a numerical observation.

## Market expectations

The Expectations Gap page includes company-issued guidance from the same primary earnings sources used for Company Capture. That is operating context, not analyst consensus or a valuation input. Eulerpool is the primary source for a compact current snapshot of annual consensus, delayed/EOD quote inputs, and price-target context. It is constrained to the owner-confirmed personal, non-commercial daily static snapshot and displays the required [Data by Eulerpool](https://eulerpool.com/) attribution next to every rendered Eulerpool-derived field.

When enabled, `scripts/ingest-eulerpool-market-data.mjs` requests annual analyst estimates, quote data, and price-target consensus for the current Expectations Gap tickers. It creates only `data/processed/eulerpool-market-expectations.json` in the Pages build workspace: a compact current normalized snapshot with retrieval date, fiscal-period label, source attribution, and clearly marked mechanical calculations. The file is served by the approved Pages deployment but is ignored by Git, so raw Eulerpool responses, normalized Eulerpool data, and an Eulerpool history are not committed to the public repository. See [Eulerpool personal-use setup](EULERPOOL_SETUP.md) before changing the integration boundary.

Financial Modeling Prep remains a gated fallback. Its workflow cannot display data unless the required public-display agreement is complete, the `FMP_API_KEY` Actions secret exists, and the `FMP_PUBLIC_DISPLAY_APPROVED=true` Actions variable explicitly opens the gate. See [FMP public-display setup](FMP_SETUP.md) before activating it.

The visible connection map in `config/market-data-providers.json` still does not authorize the other providers. Do not add figures merely to fill a dashboard.
