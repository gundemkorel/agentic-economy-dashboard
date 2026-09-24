# Methodology

## Two research tracks

Track A asks whether Wave 2 is accelerating through macro and industry evidence. Track B asks who captures the economics. Keeping them separate allows three honest outcomes:

- macro thesis correct and company thesis correct;
- macro thesis correct and company thesis wrong;
- macro thesis wrong.

## Evidence layers

1. Machine Activity: request volumes, bot/human mix, AI bot classification, action-oriented versus crawler activity, APIs, and tool activity.
2. Enterprise Adoption & Control: automation composition, enterprise AI transactions, AI data transfer, policy, identity, and security controls.
3. Company Capture: a small number of thesis-relevant company KPIs.
4. Market Expectations: estimate revisions, valuation, and stock performance with a consistent source and fiscal convention.
5. Expectation Gap: compare the first four layers; do not produce a numerical gap score without enough clean history.
6. Thesis Breakers: define and review contrary evidence explicitly.

## Data distinctions

Every entry must be one of:

- observed data;
- company-reported data;
- analyst consensus;
- our scenario assumption;
- qualitative judgment.

These are never mixed without labels. Each observation must retain metric name, category, value, unit, period, source, retrieval date, methodology, and notes.

Qualitative product or company disclosures are valid evidence when no reproducible scalar is available, but they must remain visibly qualitative. A report describing a growing pattern is not permission to invent a growth rate.

## Market-expectation snapshot boundary

The current Eulerpool adapter publishes a single current, daily static snapshot for the small Expectations Gap watchlist. It must retain the visible `Data by Eulerpool` attribution beside each derived field. Free-plan quote inputs can be delayed or end-of-day, so the dashboard treats them as dated inputs rather than live prices. It stores no raw response or public vendor-data history.

Annual EPS convention and fiscal period are provider-supplied fields, not automatically comparable to company guidance. Forward P/E and target upside are mechanical calculations only. They do not create a gap score or an investment conclusion.

## Source interpretation

No one provider represents the entire internet or enterprise economy. Cloudflare, Fastly, Akamai, and Zscaler are complementary samples. A disagreement may be a clue rather than noise.

All bot activity is not agent activity. AI crawlers, AI fetchers, generic automation, and action-oriented agent activity must remain distinct whenever the source permits it.

Cloudflare's initial AI-bot observation is particularly constrained: it is a `MIN0_MAX` normalized index, calculated as a current 30-day mean and compared to the preceding 30-day control in the same query. It supports a directional network-activity read; it does not support statements about raw request volume, total agent activity, or long-run values across separately normalized requests.

## History

The initial backfill target is January 2026 to the current date where legitimate source history exists. Sparse, date-stamped time series are preferable to synthetic monthly data.

The rolling evidence log is complementary to the time series. It records material confirmations, counter-evidence, and unresolved observations without collapsing them into an early composite score.
