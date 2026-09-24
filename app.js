const $ = (selector) => document.querySelector(selector);

const formatDate = (iso) => new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric"
}).format(new Date(iso));

const tagClass = (tone = "neutral") => tone === "positive" ? "positive" : tone === "warning" ? "warning" : tone === "accent" ? "accent" : "neutral";

function renderMetric(metric) {
  const sources = metric.sources.map((source) =>
    "<a href=\"" + source.url + "\" target=\"_blank\" rel=\"noreferrer\">" + source.label + " ↗</a>"
  ).join("");
  return "<article class=\"metric-card\" id=\"" + metric.id + "\">" +
    "<div class=\"metric-top\"><span class=\"metric-number\">" + metric.number + "</span><span class=\"tag " + tagClass(metric.tone) + "\">" + metric.status + "</span></div>" +
    "<h3>" + metric.title + "</h3><p class=\"description\">" + metric.description + "</p>" +
    "<div class=\"metric-bottom\"><div class=\"metric-signal\"><strong>" + metric.signal + "</strong><span>" + metric.direction + "</span></div>" +
    "<div class=\"bar-label\"><span>" + metric.progressLabel + "</span><span>" + metric.progress + "%</span></div><div class=\"bar\"><i style=\"width:" + metric.progress + "%\"></i></div>" +
    "<div class=\"metric-sources\">" + sources + "</div></div></article>";
}

function renderExpectation(item) {
  return "<article class=\"expectation-card\"><h3>" + item.theme + "</h3><p>" + item.assumption + "</p><span class=\"company\">" + item.watchlist + "</span></article>";
}

function renderGap(item) {
  const readClass = item.readTone === "caution" ? "caution" : "";
  return "<tr><td>" + item.theme + "</td><td>" + item.evidence + "</td><td>" + item.consensus + "</td><td><span class=\"read " + readClass + "\"><i></i>" + item.read + "</span></td></tr>";
}

function renderBreaker(item) {
  return "<article class=\"breaker\"><span class=\"severity\">" + item.severity + "</span><strong>" + item.title + "</strong><p>" + item.description + "</p></article>";
}

function renderSource(source) {
  return "<div class=\"source-item\"><div><strong>" + source.name + "</strong><p>" + source.role + " · cadence: " + source.cadence + "</p></div><a href=\"" + source.url + "\" target=\"_blank\" rel=\"noreferrer\">Open ↗</a></div>";
}

async function loadDashboard() {
  try {
    const responses = await Promise.all([fetch("data/metrics.json"), fetch("data/sources.json")]);
    if (!responses[0].ok || !responses[1].ok) throw new Error("Data files unavailable");
    const metrics = await responses[0].json();
    const sources = await responses[1].json();
    $("#last-updated").textContent = formatDate(metrics.meta.lastUpdated);
    $("#confidence").textContent = metrics.meta.confidence;
    $("#metric-grid").innerHTML = metrics.layers.map(renderMetric).join("");
    $("#expectation-grid").innerHTML = metrics.expectations.map(renderExpectation).join("");
    $("#gap-table-body").innerHTML = metrics.gaps.map(renderGap).join("");
    $("#breaker-grid").innerHTML = metrics.breakers.map(renderBreaker).join("");
    $("#source-list").innerHTML = sources.sources.map(renderSource).join("");
  } catch (error) {
    $("#metric-grid").innerHTML = "<div class=\"loading-state\">Dashboard data could not be loaded. Check <code>data/metrics.json</code> and <code>data/sources.json</code>.</div>";
    console.error(error);
  }
}

loadDashboard();
