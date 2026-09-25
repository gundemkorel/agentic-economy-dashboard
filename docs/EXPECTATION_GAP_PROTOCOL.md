# Expectation-gap evidence protocol

## Decision question

Did market forecasts and valuation already absorb the *incremental owner cash per share* from a specific agentic mechanism? For AKAM's September 24, 2026 Anthropic announcement, the first test is whether forecasts for the relevant fiscal periods changed by enough to reflect the new revenue **and** front-loaded investment. A price reaction or higher revenue forecast alone is not an expectation gap.

## Minimum AKAM event pair

Record a same-provider observation immediately **before** the September 24 announcement and one after analysts have had time to revise, for the same FY2027, FY2028, and FY2029 fiscal period ends. Preserve retrieval timestamp, source/provider, contributor count if available, currency, accounting convention, and whether the number is a provider estimate or company guidance. Compare revenue, operating profit, capital spending, cash flow from operations, free cash flow, and diluted share count where the provider actually supplies them. A missing metric stays missing; do not calculate analyst FCF from incompatible fields and call it consensus.

Join each estimate vintage to an appropriately dated, rights-cleared price and share-count/enterprise-value bridge. Then test the change in expected *per-share* cash economics and contemporaneous valuation. Separate the deal's announced conditional commitment from realized revenue, cash flow, and warrant vesting. Use a second post-event observation to distinguish an immediate headline reaction from a sustained estimate revision. The September-quarter 10-Q and later results should be compared with these forecasts, but cannot retroactively substitute for the pre-event vintage.

The same protocol applies to TWLO's paid-agent mechanism, anchored to a dated company disclosure rather than a stock-chart turning point. There is no stock-selection conclusion if the paid unit, cash conversion, or estimate vintage is absent.

## Source fit as of September 25, 2026

| Source | What it can establish now | Missing permission or data | Decision |
| --- | --- | --- | --- |
| [Akamai IR and SEC filing](https://www.sec.gov/Archives/edgar/data/1086222/000119312526401048/d288154d8k.htm) | Event time, management plan, conditional terms, later actuals | Street consensus before and after event | Use for the company side only |
| [Eulerpool API plans](https://eulerpool.com/financial-data-api/pricing) | Approved attributed *current* snapshot, with limited free estimates | This project's permission does not cover a retained vendor archive; Eulerpool lists point-in-time backtesting data under Enterprise | Keep current context only; do not infer revision history |
| [FMP's estimate-drift guide](https://site.financialmodelingprep.com/de/education/calendar/build-an-earnings-revision-pressure-signal-estimate-drift-monitor) | Describes current consensus and how to record new time-stamped observations | Its stable estimates endpoint is not a versioned prior-vintage feed; existing account access and public-history rights are not confirmed | Do not backfill from today's endpoint |
| [FactSet PIT Consensus](https://insight.factset.com/resources/at-a-glance-factset-estimates-point-in-time-consensus) | A purpose-built historical consensus product exists | Licensed access and redistribution terms not established for this project | Evaluate only if a serious cash-return case justifies the cost |

FMP's [FAQ](https://site.financialmodelingprep.com/de/faqs?code=statements) refers to requesting a historical “as-of” snapshot, but its public estimate-drift guide says the stable endpoint reflects current state. Treat the precise product, entitlement, and rights for an as-of series as **unverified**, not available by default.

## No-look-ahead rule

Never relabel a fiscal-period estimate as a prior *observation date*. For example, an FY2028 estimate returned today is not evidence of what analysts expected on September 23, 2026. Do not publish or retain vendor values beyond the explicitly approved terms. Until a permissible matched vintage pair exists, show “gap unproven” and prioritize the company cash-return test.
