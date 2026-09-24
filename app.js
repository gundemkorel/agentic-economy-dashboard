const $ = (selector) => document.querySelector(selector);

const formatDate = (iso) => {
  if (!iso) return "Not yet observed";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(iso));
};

const fetchJson = async (path) => {
  const response = await fetch(path);
  if (!response.ok) throw new Error("Unable to load " + path);
  return response.json();
};

const statusTone = (status) => {
  const text = String(status || "").toLowerCase();
  if (text.includes("observed") || text.includes("watchlist")) return "positive";
  if (text.includes("credential") || text.includes("sparse")) return "warning";
  return "neutral";
};

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#039;"
})[character]);

function sourceFor(sources, id) {
  return sources.find((source) => source.id === id);
}

function renderPulseCard(metric, source, currentObservation, observationCount) {
  const observed = currentObservation && currentObservation.metricId === metric.id ? currentObservation : null;
  const value = observed ? (observed.displayValue || new Intl.NumberFormat("en-US").format(observed.value)) : "—";
  const direction = observed ? (observed.comparison?.displayChange || "First observed point") : metric.status;
  const asOf = observed ? formatDate(observed.asOfDate) : "No published value";
  const sourceLink = source ? "<a href=\"" + source.url + "\" target=\"_blank\" rel=\"noreferrer\">" + escapeHtml(source.name) + " ↗</a>" : "";
  const historyNote = observed && observationCount < 2 ? "History begins with this observation" : (observationCount > 1 ? observationCount + " dated observations" : "No history yet");
  return "<article class=\"metric-card metric-card-wide\" id=\"" + escapeHtml(metric.id) + "\">" +
    "<div class=\"metric-top\"><span class=\"metric-number\">" + escapeHtml(metric.number) + " · " + escapeHtml(metric.layer) + "</span><span class=\"tag " + statusTone(metric.status) + "\">" + escapeHtml(metric.status) + "</span></div>" +
    "<h3>" + escapeHtml(metric.title) + "</h3><p class=\"description\">" + escapeHtml(metric.description) + "</p>" +
    "<div class=\"metric-bottom\"><div class=\"metric-signal\"><strong>" + value + "</strong><span>" + escapeHtml(direction) + "</span></div>" +
    "<div class=\"metadata-row\"><span>As of <b>" + asOf + "</b></span><span>" + historyNote + "</span></div>" +
    "<p class=\"method-note\">" + escapeHtml(metric.methodology) + "</p>" +
    "<div class=\"metric-sources\">" + sourceLink + "</div></div></article>";
}

function renderExpectation(item) {
  return "<article class=\"expectation-card\"><h3>" + escapeHtml(item.theme) + "</h3><p>" + escapeHtml(item.assumption) + "</p><span class=\"company\">" + escapeHtml(item.watchlist) + "</span></article>";
}

function renderGap(item) {
  const readClass = item.readTone === "caution" ? "caution" : "";
  return "<tr><td>" + escapeHtml(item.theme) + "</td><td>" + escapeHtml(item.evidence) + "</td><td>" + escapeHtml(item.consensus) + "</td><td><span class=\"read " + readClass + "\"><i></i>" + escapeHtml(item.read) + "</span></td></tr>";
}

function renderBreaker(item) {
  return "<article class=\"breaker\"><span class=\"severity\">" + escapeHtml(item.severity) + "</span><strong>" + escapeHtml(item.title) + "</strong><p>" + escapeHtml(item.description) + "</p></article>";
}

function renderCompany(company) {
  const evidence = company.evidence ? company.evidence.map((item) => "<div><dt>" + escapeHtml(item.label) + "</dt><dd>" + escapeHtml(item.value) + "</dd></div>").join("") : "";
  const kpis = company.kpis ? "<p class=\"company-label\">Thesis-relevant KPIs</p><ul>" + company.kpis.map((kpi) => "<li>" + escapeHtml(kpi) + "</li>").join("") + "</ul>" : "";
  const reviewedEvidence = company.evidence ? "<p class=\"company-period\">" + escapeHtml(company.period) + " · company-reported</p><dl class=\"company-evidence\">" + evidence + "</dl><p class=\"company-read\"><span>Capture read</span>" + escapeHtml(company.agenticRead) + "</p><p class=\"company-counterpoint\"><span>Counterpoint</span>" + escapeHtml(company.counterpoint) + "</p>" : kpis;
  const sourceLinks = company.sources ? company.sources.map((item) => "<a href=\"" + item.url + "\" target=\"_blank\" rel=\"noreferrer\">" + escapeHtml(item.label) + " ↗</a>").join("") : "<a href=\"" + company.source + "\" target=\"_blank\" rel=\"noreferrer\">Primary IR source ↗</a>";
  return "<article class=\"company-card\"><div class=\"company-card-top\"><span class=\"ticker\">" + escapeHtml(company.ticker) + "</span><span class=\"tag neutral\">" + escapeHtml(company.state) + "</span></div><p class=\"company-mechanism\">" + escapeHtml(company.mechanism) + "</p>" + reviewedEvidence + "<div class=\"company-sources\">" + sourceLinks + "</div></article>";
}

function renderExpectationRow(row) {
  return "<tr><td><strong>" + escapeHtml(row.ticker) + "</strong></td><td>" + escapeHtml(row.agenticEvidence) + "</td><td>" + escapeHtml(row.streetEstimates) + "</td><td>" + escapeHtml(row.valuation) + "</td><td><span class=\"read caution\"><i></i>" + escapeHtml(row.gapRead) + "</span></td></tr>";
}

function renderSource(source) {
  const fields = [
    "Supports: " + source.supports.join(", "),
    "Cadence: " + source.updateFrequency,
    "Access: " + source.accessMethod,
    "State: " + source.automationStatus
  ];
  return "<div class=\"source-item source-item-detailed\"><div><strong>" + escapeHtml(source.name) + "</strong><p>" + escapeHtml(fields.join(" · ")) + "</p><p class=\"source-caveat\">" + escapeHtml(source.caveat) + "</p></div><a href=\"" + source.url + "\" target=\"_blank\" rel=\"noreferrer\">Open ↗</a></div>";
}

async function initPulse() {
  const data = await Promise.all([
    fetchJson("data/metrics.json"),
    fetchJson("data/manual/pulse-metrics.json"),
    fetchJson("config/sources.json"),
    fetchJson("data/processed/mcp-registry-current.json").catch(() => null),
    fetchJson("data/processed/mcp-registry-history.json").catch(() => ({ observations: [] })),
    fetchJson("data/processed/cloudflare-ai-bot-current.json").catch(() => null),
    fetchJson("data/processed/cloudflare-ai-bot-history.json").catch(() => ({ observations: [] }))
  ]);
  const framework = data[0];
  const pulse = data[1];
  const sourceRegistry = data[2].sources;
  const currentMcp = data[3];
  const mcpHistory = data[4];
  const currentCloudflare = data[5];
  const cloudflareHistory = data[6];
  const observations = [currentMcp, currentCloudflare].filter(Boolean);
  const histories = {
    mcp_registered_server_count: mcpHistory.observations,
    ai_bot_request_volume: cloudflareHistory.observations
  };
  const observedCount = observations.length;
  const mostRecent = observations.sort((a, b) => String(b.retrievalDate).localeCompare(String(a.retrievalDate)))[0];
  $("#last-updated").textContent = mostRecent ? formatDate(mostRecent.retrievalDate) : formatDate(pulse.asOfDate);
  $("#confidence").textContent = observedCount + " observed / " + pulse.metrics.length + " staged";
  $("#metric-grid").innerHTML = pulse.metrics.map((metric) => {
    const observation = observations.find((item) => item.metricId === metric.id);
    const history = histories[metric.id] || [];
    return renderPulseCard(metric, sourceFor(sourceRegistry, metric.sourceId), observation, history.length);
  }).join("");
  $("#expectation-grid").innerHTML = framework.expectations.map(renderExpectation).join("");
  $("#gap-table-body").innerHTML = framework.gaps.map(renderGap).join("");
  $("#breaker-grid").innerHTML = framework.breakers.map(renderBreaker).join("");
  $("#source-list").innerHTML = sourceRegistry.map(renderSource).join("");
}

async function initCompanies() {
  const companyData = await fetchJson("data/manual/company-kpis.json");
  $("#company-grid").innerHTML = companyData.companies.map(renderCompany).join("");
}

async function initExpectations() {
  const data = await fetchJson("data/manual/expectations-gap.json");
  $("#expectations-body").innerHTML = data.rows.map(renderExpectationRow).join("");
}

async function initBreakers() {
  const data = await fetchJson("data/metrics.json");
  $("#breaker-grid").innerHTML = data.breakers.map(renderBreaker).join("");
}

async function initMethodology() {
  const data = await fetchJson("config/sources.json");
  $("#source-list").innerHTML = data.sources.map(renderSource).join("");
}

async function boot() {
  const page = document.body.dataset.page || "pulse";
  try {
    if (page === "companies") await initCompanies();
    else if (page === "expectations") await initExpectations();
    else if (page === "breakers") await initBreakers();
    else if (page === "methodology") await initMethodology();
    else await initPulse();
  } catch (error) {
    const target = document.querySelector("[aria-live]") || document.querySelector(".source-list") || document.querySelector("main");
    target.innerHTML = "<div class=\"loading-state\">Dashboard data could not be loaded. See the repository data layer for the underlying files.</div>";
    console.error(error);
  }
}

boot();
