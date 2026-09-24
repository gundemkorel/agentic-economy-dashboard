# Data layer

metrics.json is the small, human-reviewable snapshot rendered by the site. sources.json is the source register used by the appendix.

When automated ingestion is added, keep this boundary:

public source -> raw dated pull -> normalized observation -> reviewed snapshot -> static site

Cloudflare Radar is a deliberate exception to any temptation to label all values as volumes: its AI-bot endpoint returns `MIN0_MAX`-normalized values. The derived observation keeps the returned normalization, request windows, and prior-window comparison, and it must not be compared as a raw-value series across separate retrievals.

Recommended observation fields for future adapters:

~~~json
{
  "metricId": "machine_requests",
  "period": "2026-09",
  "value": 0,
  "unit": "index",
  "direction": "up|flat|down|pending",
  "confidence": "high|medium|low|baseline",
  "source": "https://example.com/primary-source",
  "retrievedAt": "2026-09-23",
  "note": "Short interpretation and caveat."
}
~~~
