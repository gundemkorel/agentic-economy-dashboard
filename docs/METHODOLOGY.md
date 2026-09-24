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
5. Gap Readiness: compare the first four layers; do not call an expectation gap without enough clean history.
6. Thesis Breakers: define and review contrary evidence explicitly.

## Research decision gates

The dashboard uses a sequence rather than a composite score:

1. Macro trend: at least three comparable observations before classifying acceleration, stability, or deceleration.
2. Causal mechanism: name the billable unit, agentic trigger, price architecture, incremental cost, proof threshold, time to impact, and company-specific risk.
3. Company capture: require dated reported revenue-quality, margin, retention, or cash-flow evidence; product relevance is not capture.
4. Expectation alignment: require fiscal alignment, accounting convention, at least two point-in-time consensus observations, and valuation history.
5. Scenario model: keep reported facts, consensus, and our own assumptions structurally separate. Scenarios expose required economics; they do not create price targets.

No company is called investable merely because it advances through an early gate.

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

The current Eulerpool adapter publishes a single current, daily static snapshot for the small Gap Readiness watchlist. It must retain the visible `Data by Eulerpool` attribution beside each derived field. Free-plan quote inputs can be delayed or end-of-day, so the dashboard treats them as dated inputs rather than live prices. It stores no raw response or public vendor-data history.

Annual EPS convention and fiscal period are provider-supplied fields, not automatically comparable to company guidance. The dashboard checks the snapshot's fiscal-date ending against the company fiscal year-end configured for each ticker and refuses a guide-versus-consensus read when they differ. A current snapshot alone cannot establish estimate-revision direction or valuation history. Forward P/E is current market context; price targets are supplemental context and are not used to establish a gap score or investment conclusion.

## Source interpretation

No one provider represents the entire internet or enterprise economy. Cloudflare, Fastly, Akamai, and Zscaler are complementary samples. A disagreement may be a clue rather than noise.

All bot activity is not agent activity. AI crawlers, AI fetchers, generic automation, and action-oriented agent activity must remain distinct whenever the source permits it.

Cloudflare's initial AI-bot observation is particularly constrained: it is a `MIN0_MAX` normalized index, calculated as a current 30-day mean and compared to the preceding 30-day control in the same query. It supports a directional network-activity read; it does not support statements about raw request volume, total agent activity, or long-run values across separately normalized requests.

## History

The initial backfill target is January 2026 to the current date where legitimate source history exists. Sparse, date-stamped time series are preferable to synthetic monthly data.

The rolling evidence log is complementary to the time series. It records material confirmations, counter-evidence, and unresolved observations without collapsing them into an early composite score.

The observation register is the operational control for this rule. It records raw observation count, eligible observation count, cadence, minimum time separation, comparability condition, permitted decision use, and prohibited inference for each track. A source reaches “ready for analyst trend review” only after its stated eligible-point threshold; that status does not itself label a trend. Cloudflare’s normalized 30-day current/control windows require 30-day-separated observations for this purpose, even though the pipeline collects monitoring points weekly.

Company capture uses a separate earnings sequence. A company needs at least two time-separated, definition-consistent reported periods before repeated revenue-quality, margin, retention, or cash-flow evidence can be reviewed as a capture pattern. Preserve prior records in data/manual/company-capture-history.json; do not overwrite a baseline with the next quarter.

## Candidate tiers and promotion

The core queue contains companies with an established causal map and dated capture research. Secondary candidates receive the same primary-source baseline and earnings sequence, but they have not earned a core seat. They must show at least two comparable reported periods and a commercial outcome—such as paid adoption, pricing, attach, usage-to-revenue, retention, margin, or cash conversion—linked to the named mechanism. A product launch or broad AI commentary is not sufficient.

Benchmarks are deliberate comparison points rather than candidates. They can inform the competitive map, the quality bar, or the risk of platform consolidation, but are not assigned a scenario model or expectation-gap view unless they are formally promoted through the same gates.

## Thesis-breaker discipline

Every breaker must identify a measurable test, current status, cadence, and downgrade action. Separate macro failure (Wave 2 does not develop) from monetization failure (the activity is real but bundled, commoditized, or internalized) and company failure (another supplier captures the economics).

## Definitions

The working definitions for Wave 1–3, agentic activity, AI bots, AI fetchers, AI mediation, revenue elasticity, action intensity, expectation gap, and scenario assumptions live in [DEFINITIONS.md](DEFINITIONS.md).
