const $ = (selector) => document.querySelector(selector);
const marketSnapshotVersion = "__MARKET_SNAPSHOT_VERSION__";
const eulerpoolSnapshotPath = marketSnapshotVersion.startsWith("__") ? "data/processed/eulerpool-market-expectations.json" : "data/processed/eulerpool-market-expectations-" + marketSnapshotVersion + ".json";

const formatDate = (iso) => {
  if (!iso) return "Not yet observed";
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(String(iso));
  const parsed = new Date(dateOnly ? iso + "T12:00:00Z" : iso);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC"
  }).format(parsed);
};

const fetchJson = async (path) => {
  const separator = path.includes("?") ? "&" : "?";
  const response = await fetch(path + separator + "refresh=" + Date.now(), { cache: "no-store" });
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
  const sourceName = observed?.sourceName || source?.name;
  const sourceUrl = observed?.sourceUrl || source?.url;
  const sourceLink = sourceName && sourceUrl ? "<a href=\"" + escapeHtml(sourceUrl) + "\" target=\"_blank\" rel=\"noreferrer\">" + escapeHtml(sourceName) + " ↗</a>" : "";
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

function renderEvidenceEntry(entry) {
  const tone = entry.tone || "neutral";
  const source = entry.sourceUrl ? "<a href=\"" + escapeHtml(entry.sourceUrl) + "\" target=\"_blank\" rel=\"noreferrer\">" + escapeHtml(entry.sourceLabel || "Primary source") + " ↗</a>" : "";
  return "<article class=\"evidence-entry evidence-" + escapeHtml(tone) + "\">" +
    "<div class=\"evidence-meta\"><span>" + escapeHtml(formatDate(entry.date)) + "</span><span>" + escapeHtml(entry.layer) + "</span></div>" +
    "<div class=\"evidence-copy\"><span class=\"evidence-direction\">" + escapeHtml(entry.direction) + "</span><h3>" + escapeHtml(entry.title) + "</h3><p>" + escapeHtml(entry.summary) + "</p><p class=\"evidence-read\"><span>Thesis read</span>" + escapeHtml(entry.thesisRead) + "</p>" + source + "</div></article>";
}

function renderCompany(company) {
  const evidence = company.evidence ? company.evidence.map((item) => "<div><dt>" + escapeHtml(item.label) + "</dt><dd>" + escapeHtml(item.value) + "</dd></div>").join("") : "";
  const kpis = company.kpis ? "<p class=\"company-label\">Thesis-relevant KPIs</p><ul>" + company.kpis.map((kpi) => "<li>" + escapeHtml(kpi) + "</li>").join("") + "</ul>" : "";
  const reviewedEvidence = company.evidence ? "<p class=\"company-period\">" + escapeHtml(company.period) + " · company-reported</p><dl class=\"company-evidence\">" + evidence + "</dl><p class=\"company-read\"><span>Capture read</span>" + escapeHtml(company.agenticRead) + "</p><p class=\"company-counterpoint\"><span>Counterpoint</span>" + escapeHtml(company.counterpoint) + "</p>" : kpis;
  const sourceLinks = company.sources ? company.sources.map((item) => "<a href=\"" + item.url + "\" target=\"_blank\" rel=\"noreferrer\">" + escapeHtml(item.label) + " ↗</a>").join("") : "<a href=\"" + company.source + "\" target=\"_blank\" rel=\"noreferrer\">Primary IR source ↗</a>";
  return "<article class=\"company-card\"><div class=\"company-card-top\"><span class=\"ticker\">" + escapeHtml(company.ticker) + "</span><span class=\"tag neutral\">" + escapeHtml(company.state) + "</span></div><p class=\"company-mechanism\">" + escapeHtml(company.mechanism) + "</p>" + reviewedEvidence + "<div class=\"company-sources\">" + sourceLinks + "</div></article>";
}

const finiteNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

function formatUsd(value, maximumFractionDigits = 2) {
  const numeric = finiteNumber(value);
  if (numeric === null) return null;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits
  }).format(numeric);
}

function formatUsdCompact(value) {
  const numeric = finiteNumber(value);
  if (numeric === null) return null;
  const absolute = Math.abs(numeric);
  if (absolute >= 1_000_000_000) return "$" + (numeric / 1_000_000_000).toFixed(2).replace(/\.00$/, "") + "B";
  if (absolute >= 1_000_000) return "$" + (numeric / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  return formatUsd(numeric);
}

function formatPercent(value) {
  const numeric = finiteNumber(value);
  if (numeric === null) return null;
  return (numeric >= 0 ? "+" : "") + numeric.toFixed(1) + "%";
}

function renderMarketSource(snapshot) {
  const provider = snapshot?.provider;
  const sourceUrl = provider?.attributionUrl || provider?.sourceUrl;
  if (!sourceUrl) return "";
  const sourceLabel = provider?.attributionText || provider?.sourceLabel || provider?.name || "Market-data source";
  return "<a class=\"table-source\" href=\"" + escapeHtml(sourceUrl) + "\" target=\"_blank\" rel=\"noreferrer\">" + escapeHtml(sourceLabel) + " ↗</a>";
}

function renderMarketEstimate(record, snapshot) {
  const estimate = record?.annualEstimate;
  const providerName = snapshot?.provider?.name || "Market-data";
  if (!estimate) return escapeHtml(providerName + " snapshot did not return an annual estimate");
  const details = [];
  const revenue = formatUsdCompact(estimate.revenueConsensus);
  const eps = formatUsd(estimate.epsConsensus);
  if (revenue) details.push("Revenue " + revenue);
  if (eps) details.push("EPS " + eps);
  const analystCount = finiteNumber(estimate.revenueAnalystCount) ?? finiteNumber(estimate.epsAnalystCount);
  if (analystCount !== null) details.push(analystCount + " analyst" + (analystCount === 1 ? "" : "s"));
  const period = estimate.fiscalPeriod || "annual estimate";
  const asOf = record.asOfDate || snapshot?.retrievedAt;
  return "<div class=\"market-data-cell\"><span class=\"guidance-label\">" + escapeHtml(providerName) + " · " + escapeHtml(period) + " · " + escapeHtml(formatDate(asOf)) + "</span><span>" + escapeHtml(details.length ? details.join(" · ") : "No displayable consensus fields returned") + "</span>" + renderMarketSource(snapshot) + "</div>";
}

function renderMarketValuation(record, snapshot) {
  const quote = record?.quote || {};
  const priceTarget = record?.priceTarget || {};
  const derived = record?.derived || {};
  const providerName = snapshot?.provider?.name || "Market-data";
  const details = [];
  const price = formatUsd(quote.price);
  const forwardPe = finiteNumber(derived.forwardPriceEarnings);
  const target = formatUsd(priceTarget.consensus);
  const targetMedian = formatUsd(priceTarget.median);
  const targetHigh = formatUsd(priceTarget.high);
  const targetLow = formatUsd(priceTarget.low);
  const targetUpside = formatPercent(derived.targetUpsidePercent);
  if (price) details.push("Price " + price);
  if (forwardPe !== null) details.push("Forward P/E " + forwardPe.toFixed(1) + "x");
  if (target) details.push("Target " + target + (targetUpside ? " (" + targetUpside + ")" : ""));
  else if (targetMedian && targetLow && targetHigh) details.push("Target median " + targetMedian + " · range " + targetLow + "–" + targetHigh);
  else if (targetMedian) details.push("Target median " + targetMedian);
  else if (targetLow && targetHigh) details.push("Target range " + targetLow + "–" + targetHigh);
  else if (targetHigh) details.push("Target high " + targetHigh);
  else if (targetLow) details.push("Target low " + targetLow);
  const asOf = record?.asOfDate || snapshot?.retrievedAt;
  return "<div class=\"market-data-cell\"><span class=\"guidance-label\">" + escapeHtml(providerName) + " snapshot · " + escapeHtml(formatDate(asOf)) + "</span><span>" + escapeHtml(details.length ? details.join(" · ") : "No displayable valuation fields returned") + "</span>" + renderMarketSource(snapshot) + "</div>";
}

function renderExpectationRow(row, marketSnapshot) {
  const guidance = row.managementGuidance;
  const source = guidance?.sourceUrl ? "<a class=\"table-source\" href=\"" + escapeHtml(guidance.sourceUrl) + "\" target=\"_blank\" rel=\"noreferrer\">" + escapeHtml(guidance.sourceLabel || "Primary source") + " ↗</a>" : "";
  const managementOutlook = guidance ? "<div class=\"guidance-cell\"><span class=\"guidance-label\">Company-issued · " + escapeHtml(guidance.period) + " · " + escapeHtml(formatDate(guidance.issuedDate)) + "</span><span>" + escapeHtml(guidance.outlook) + "</span>" + source + "</div>" : "Not loaded";
  const liveRows = Array.isArray(marketSnapshot?.rows) ? marketSnapshot.rows : [];
  const marketRecord = liveRows.find((record) => record?.ticker === row.ticker && record?.status === "observed");
  const providerName = marketSnapshot?.provider?.name || "Market-data";
  const streetEstimates = marketRecord ? renderMarketEstimate(marketRecord, marketSnapshot) : escapeHtml(row.streetEstimates);
  const valuation = marketRecord ? renderMarketValuation(marketRecord, marketSnapshot) : escapeHtml(row.valuation);
  const gapRead = marketRecord ? providerName + " snapshot loaded; align guidance and consensus fiscal periods before a gap conclusion" : row.gapRead;
  const tone = marketRecord ? "" : " caution";
  return "<tr><td><strong>" + escapeHtml(row.ticker) + "</strong></td><td>" + escapeHtml(row.agenticEvidence) + "</td><td>" + managementOutlook + "</td><td>" + streetEstimates + "</td><td>" + valuation + "</td><td><span class=\"read" + tone + "\"><i></i>" + escapeHtml(gapRead) + "</span></td></tr>";
}

function renderProvider(provider, marketSnapshot) {
  const capabilities = Array.isArray(provider.capabilities) ? provider.capabilities.map((capability) => "<span>" + escapeHtml(capability) + "</span>").join("") : "";
  const source = provider.sourceUrl ? "<a href=\"" + escapeHtml(provider.sourceUrl) + "\" target=\"_blank\" rel=\"noreferrer\">" + escapeHtml(provider.sourceLabel || "Provider details") + " ↗</a>" : "";
  const marketRows = Array.isArray(marketSnapshot?.rows) ? marketSnapshot.rows.filter((row) => row?.status === "observed") : [];
  const isLiveProvider = provider.id === marketSnapshot?.provider?.id && marketRows.length > 0;
  const status = isLiveProvider ? "Active · current snapshot" : provider.status;
  const tone = isLiveProvider ? "positive" : (provider.tone || "neutral");
  const description = isLiveProvider ? "A current " + (marketSnapshot?.provider?.name || provider.name) + " snapshot is rendered for " + marketRows.length + " Expectations Gap ticker" + (marketRows.length === 1 ? "" : "s") + ". Review its retrieval date and fiscal-year labels before using it in a gap read." : provider.description;
  return "<article class=\"provider-card\"><div class=\"provider-card-top\"><h3>" + escapeHtml(provider.name) + "</h3><span class=\"tag " + escapeHtml(tone) + "\">" + escapeHtml(status) + "</span></div><div class=\"provider-capabilities\">" + capabilities + "</div><p>" + escapeHtml(description) + "</p>" + source + "</article>";
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
    fetchJson("data/processed/cloudflare-ai-bot-history.json").catch(() => ({ observations: [] })),
    fetchJson("data/manual/enterprise-adoption-observations.json").catch(() => ({ observations: [] }))
  ]);
  const framework = data[0];
  const pulse = data[1];
  const sourceRegistry = data[2].sources;
  const currentMcp = data[3];
  const mcpHistory = data[4];
  const currentCloudflare = data[5];
  const cloudflareHistory = data[6];
  const manualEnterprise = data[7];
  const manualObservations = Array.isArray(manualEnterprise.observations) ? manualEnterprise.observations : [];
  const observations = [currentMcp, currentCloudflare, ...manualObservations].filter(Boolean);
  const histories = {
    mcp_registered_server_count: mcpHistory.observations,
    ai_bot_request_volume: cloudflareHistory.observations
  };
  manualObservations.forEach((observation) => {
    histories[observation.metricId] = [observation];
  });
  const observedCount = pulse.metrics.filter((metric) => observations.some((item) => item.metricId === metric.id)).length;
  const stagedCount = pulse.metrics.length - observedCount;
  const mostRecent = [...observations].sort((a, b) => String(b.retrievalDate).localeCompare(String(a.retrievalDate)))[0];
  $("#last-updated").textContent = mostRecent ? formatDate(mostRecent.retrievalDate) : formatDate(pulse.asOfDate);
  $("#confidence").textContent = observedCount + " observed / " + stagedCount + " staged";
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
  const [data, providerMap, eulerpoolSnapshot, fmpSnapshot] = await Promise.all([
    fetchJson("data/manual/expectations-gap.json"),
    fetchJson("config/market-data-providers.json").catch(() => ({ providers: [] })),
    fetchJson(eulerpoolSnapshotPath).catch(() => null),
    fetchJson("data/processed/fmp-market-expectations.json").catch(() => null)
  ]);
  const snapshots = [eulerpoolSnapshot, fmpSnapshot];
  const marketSnapshot = snapshots.find((snapshot) => Array.isArray(snapshot?.rows) && snapshot.rows.some((row) => row?.status === "observed")) || null;
  const marketRows = Array.isArray(marketSnapshot?.rows) ? marketSnapshot.rows.filter((row) => row?.status === "observed") : [];
  const attribution = $("#market-data-attribution");
  if (marketRows.length) {
    const providerName = marketSnapshot?.provider?.name || "Market-data";
    $("#market-data-status").textContent = providerName + " snapshot live · " + marketRows.length + " ticker" + (marketRows.length === 1 ? "" : "s");
    $("#market-data-notice").textContent = "Management guidance remains company-issued context. The current " + providerName + " snapshot shows its retrieval date and annual fiscal period, but fiscal-year alignment is still required before a gap conclusion.";
    if (attribution && marketSnapshot?.provider?.attributionText && marketSnapshot?.provider?.attributionUrl) {
      attribution.href = marketSnapshot.provider.attributionUrl;
      attribution.textContent = marketSnapshot.provider.attributionText + " ↗";
      attribution.hidden = false;
    }
  }
  $("#expectations-body").innerHTML = data.rows.map((row) => renderExpectationRow(row, marketSnapshot)).join("");
  const providerGrid = $("#provider-grid");
  if (providerGrid) providerGrid.innerHTML = providerMap.providers.map((provider) => renderProvider(provider, marketSnapshot)).join("");
}

async function initBreakers() {
  const data = await Promise.all([
    fetchJson("data/metrics.json"),
    fetchJson("data/manual/evidence-log.json").catch(() => ({ entries: [] }))
  ]);
  const framework = data[0];
  const evidenceLog = data[1];
  $("#breaker-grid").innerHTML = framework.breakers.map(renderBreaker).join("");
  $("#evidence-window").textContent = evidenceLog.windowStart && evidenceLog.asOfDate ? formatDate(evidenceLog.windowStart) + " – " + formatDate(evidenceLog.asOfDate) : "Current review window";
  $("#evidence-log").innerHTML = evidenceLog.entries.length ? evidenceLog.entries.map(renderEvidenceEntry).join("") : "<div class=\"loading-state\">No dated evidence entries yet.</div>";
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
