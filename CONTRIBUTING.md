# Updating the dashboard

The dashboard is designed to be updated in small, reviewable snapshots.

## Before editing

1. Pick the cadence: weekly, monthly, or quarterly.
2. Record the observation period and retrieval date.
3. Link the primary public source.
4. State whether the evidence is directional, measured, or estimated.
5. Note what would change your interpretation.

## Data conventions

Keep the rendered snapshot concise. Use data/metrics.json for the current view and preserve larger raw extracts outside the static site or in a dated archive. Never imply that a placeholder is an observed value; label early entries as baseline, pending, or illustrative.

## Pull requests

Use one PR per update cycle when possible. The PR description should include:

- what changed;
- source links and retrieval dates;
- whether the change affects the macro signal, company capture, or thesis breakers;
- any new uncertainty or data-quality caveat.
