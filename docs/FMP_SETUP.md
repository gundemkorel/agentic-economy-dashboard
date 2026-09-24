# FMP public-display integration

Financial Modeling Prep (FMP) is the selected source for the Expectations Gap page's compact market-expectations snapshot. It is intentionally inactive until the account and written rights cover the exact public use below.

## Scope that must be approved

Before enabling the workflow, obtain written confirmation from FMP that the agreement covers all of the following:

- Displaying FMP-derived consensus, quote, price-target, and mechanically derived valuation fields on the public GitHub Pages site.
- Serving the normalized JSON snapshot at a public Pages URL, where it is downloadable by visitors and may be cached by third parties.
- The selected API endpoints, request frequency (once per Pages deployment, including weekdays at 22:17 UTC and source-triggered redeployments), the four-symbol watchlist, permitted attribution, and the current-snapshot retention period.
- Any required copyright, attribution, disclaimer, access-control, or take-down language.

This matters even if the audience is currently small. FMP's published terms prohibit data display without a specific agreement and require deletion at termination. Read its [terms](https://site.financialmodelingprep.com/terms-of-service) and [pricing/licensing notice](https://site.financialmodelingprep.com/developer/docs/pricing) alongside the signed agreement; the signed agreement controls.

## Activate after agreement completion

1. Create or upgrade the FMP account, complete the appropriate written public-display agreement, and confirm that the issued API key is entitled to the quote, annual analyst-estimates, and price-target-consensus endpoints. Do not paste the API key into chat, a source file, an issue, or a commit.
2. In the GitHub repository, open **Settings → Secrets and variables → Actions → Secrets** and create a repository secret named `FMP_API_KEY` with the FMP key.
3. In the same area, open **Variables** and create `FMP_PUBLIC_DISPLAY_APPROVED` with the exact value `true`. Set it only after the written agreement covers the scope above.
4. Open **Actions → Deploy dashboard to GitHub Pages → Run workflow**. The deployment requests only the current Expectations Gap tickers: AKAM, ESTC, DT, and FFIV.
5. Review the live `data/processed/fmp-market-expectations.json` served by Pages, verify fiscal periods and displayed conventions, and confirm the dashboard deployment. The scheduled cadence is weekdays at 22:17 UTC after the first successful run.

The workflow creates a normalized current snapshot only in the ephemeral build workspace and includes it in the deployed Pages artifact. It intentionally does **not** commit API keys, raw FMP responses, normalized FMP data, or a vendor-data history to the public repository. The output shows its retrieval date and annual-estimate fiscal period; it never turns management guidance into consensus or declares a valuation gap automatically. If endpoint access is unavailable, the dashboard deploys without FMP values rather than failing the rest of the site.

## If rights lapse or the agreement ends

Immediately set `FMP_PUBLIC_DISPLAY_APPROVED` away from `true`, remove or rotate the API key, and run **Actions → Deploy dashboard to GitHub Pages → Run workflow**. The new deployment omits the public FMP JSON; it was never added to the public repository. Follow any additional deletion, artifact-retention, or certification requirement in the written agreement and GitHub's platform controls.

## Endpoint map

| Dashboard field | FMP endpoint | Treatment |
| --- | --- | --- |
| Annual revenue and EPS consensus | [Financial Estimates API](https://site.financialmodelingprep.com/developer/docs/stable/financial-estimates) | Nearest current or future annual estimate; fiscal period shown |
| Current price input | FMP stable quote endpoint | Current snapshot only |
| Price-target range and consensus | [Price Target Consensus API](https://site.financialmodelingprep.com/developer/docs/stable/price-target-consensus) | Optional if available under the selected plan |
| Forward P/E and target upside | Dashboard calculation | Mechanical, labeled derived; not an investment recommendation |
