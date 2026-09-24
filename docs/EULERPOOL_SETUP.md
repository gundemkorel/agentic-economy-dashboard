# Eulerpool personal-use snapshot

Eulerpool is the current primary source for the compact Expectations Gap snapshot. The owner has confirmed with Eulerpool that a non-monetized personal GitHub Pages dashboard with a daily static snapshot qualifies under its free-tier public-attribution term.

This document records the dashboard's implementation boundaries. Eulerpool's current terms and the provider's confirmation control if they differ.

## Approved implementation boundary

- Keep the dashboard personal and non-commercial. Do not sell access, syndicate the output, or use it in a monetized product without obtaining the appropriate rights.
- Publish only one current normalized snapshot through the GitHub Pages build. Do not commit raw API responses, API keys, or an Eulerpool data archive to the repository.
- Keep the required `Data by Eulerpool` link visible beside every displayed Eulerpool-derived consensus or valuation field, as well as in the source notes.
- Treat free-plan quote fields as end-of-day or delayed. The dashboard must never represent them as live market data.
- Keep company-issued guidance, provider consensus, mechanically derived ratios, and the project's own judgment separate.

## GitHub Actions setup

1. In the GitHub repository, go to **Settings → Secrets and variables → Actions → Secrets**.
2. Create a repository secret named `EULERPOOL_API_KEY`. Do not paste its value into chat, code, an issue, or a commit.
3. Run **Actions → Deploy dashboard to GitHub Pages → Run workflow**, or push a change to `main`.
4. On the live Expectations Gap page, verify all four tickers, the retrieval date, the fiscal-period labels, and the visible [Data by Eulerpool](https://eulerpool.com/) links.

The pipeline requests the current watchlist (AKAM, ESTC, DT, and FFIV) once per deployment and creates `data/processed/eulerpool-market-expectations.json` only inside the Pages build workspace. The file is ignored by Git: it is served in the deployment artifact but never committed to the public repository. The daily scheduled deployment runs at 22:17 UTC.

## What is displayed

The normalized snapshot can include annual revenue and EPS consensus, a delayed/EOD quote input, price-target context, and two mechanical calculations: quote price divided by positive provider-supplied consensus EPS, and price-target upside relative to the quote. Neither calculation is an investment recommendation. The provider's EPS convention is not assumed to match company-reported GAAP or non-GAAP guidance, so every ticker still requires a fiscal-period and convention review before an expectation-gap conclusion.

## Pause or remove the feed

If the project becomes commercial, public-use terms change, or the provider asks for removal:

1. Delete or rotate the `EULERPOOL_API_KEY` repository secret.
2. Run the Pages deployment again. A fresh build without the secret omits the Eulerpool snapshot from the public artifact.
3. Confirm the live Expectations Gap page no longer loads the current snapshot, and follow any further deletion or notice instruction from Eulerpool.

## Endpoint map

| Dashboard field | Eulerpool endpoint | Treatment |
| --- | --- | --- |
| Annual revenue and EPS consensus | [Equity estimates](https://eulerpool.com/developers/api/equity/estimates) | Current or forward annual record when the provider identifies one; fiscal period shown |
| Current price input | [Last quote](https://eulerpool.com/developers/api/market/last/quote) | Delayed/EOD on the free plan; current snapshot only |
| Price-target range and consensus | [Price-target consensus](https://eulerpool.com/developers/api/equity/price-target-consensus) | Optional when returned by the account and endpoint |
| Forward P/E and target upside | Dashboard calculation | Mechanical, labeled derived; not an investment recommendation |
