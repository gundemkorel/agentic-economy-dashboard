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
  if (text.includes("observed") || text.includes("defined") || text.includes("active") || text.includes("prototype") || text.includes("ready")) return "positive";
  if (text.includes("baseline") || text.includes("developing") || text.includes("watch") || text.includes("unresolved") || text.includes("not gap") || text.includes("caution") || text.includes("sparse")) return "warning";
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

function renderPulseCard(metric, source, currentObservation, observationCount, registerTrack) {
  const observed = currentObservation && currentObservation.metricId === metric.id ? currentObservation : null;
  const value = observed ? (observed.displayValue || new Intl.NumberFormat("en-US").format(observed.value)) : "—";
  const direction = observed ? (observed.comparison?.displayChange || "First observed point") : metric.status;
  const asOf = observed ? formatDate(observed.asOfDate) : "No published value";
  const sourceName = observed?.sourceName || source?.name;
  const sourceUrl = observed?.sourceUrl || source?.url;
  const sourceLink = sourceName && sourceUrl ? "<a href=\"" + escapeHtml(sourceUrl) + "\" target=\"_blank\" rel=\"noreferrer\">" + escapeHtml(sourceName) + " ↗</a>" : "";
  const historyNote = registerTrack
    ? registerTrack.recordedObservationCount + " recorded · " + registerTrack.eligibleObservationCount + " eligible · " + registerTrack.maturity
    : (observed && observationCount < 2 ? "First observation — no trend call" : (observationCount < 3 ? observationCount + " dated observations — trend pending" : observationCount + " dated observations — comparable series"));
  const dataType = observed?.dataType || metric.dataType || source?.dataType || "Reviewed evidence";
  return "<article class=\"metric-card metric-card-wide\" id=\"" + escapeHtml(metric.id) + "\">" +
    "<div class=\"metric-top\"><span class=\"metric-number\">" + escapeHtml(metric.number) + " · " + escapeHtml(metric.layer) + "</span><span class=\"tag " + statusTone(metric.status) + "\">" + escapeHtml(metric.status) + "</span></div>" +
    "<h3>" + escapeHtml(metric.title) + "</h3><p class=\"metric-data-type\">" + escapeHtml(dataType) + "</p><p class=\"description\">" + escapeHtml(metric.description) + "</p>" +
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
  const details = item.test ? "<dl class=\"breaker-details\"><div><dt>Test</dt><dd>" + escapeHtml(item.test) + "</dd></div><div><dt>Current state</dt><dd>" + escapeHtml(item.status) + "</dd></div><div><dt>Cadence</dt><dd>" + escapeHtml(item.cadence) + "</dd></div><div><dt>Downgrade action</dt><dd>" + escapeHtml(item.downgrade) + "</dd></div></dl>" : "";
  return "<article class=\"breaker\"><span class=\"severity\">" + escapeHtml(item.severity) + "</span><strong>" + escapeHtml(item.title) + "</strong><p>" + escapeHtml(item.description) + "</p>" + details + "</article>";
}

function renderResearchGate(gate) {
  return "<article class=\"research-gate\"><div class=\"research-gate-top\"><span class=\"metric-number\">" + escapeHtml(gate.number) + "</span><span class=\"tag " + escapeHtml(gate.tone || "neutral") + "\">" + escapeHtml(gate.status) + "</span></div><h3>" + escapeHtml(gate.title) + "</h3><p class=\"research-question\">" + escapeHtml(gate.question) + "</p><p class=\"research-definition\">" + escapeHtml(gate.definition) + "</p><p class=\"research-current\"><span>Current read</span>" + escapeHtml(gate.currentRead) + "</p></article>";
}

function renderCompanyReadiness(row) {
  return "<tr><td><strong>" + escapeHtml(row.ticker) + "</strong></td><td>" + escapeHtml(row.stage) + "</td><td>" + escapeHtml(row.state) + "</td><td>" + escapeHtml(row.expectationsState) + "</td><td>" + escapeHtml(row.nextEvidence) + "</td></tr>";
}

function formatObservationValue(observation) {
  if (!observation) return "No recorded observation";
  const value = observation.displayValue;
  if (typeof value === "number") return new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(value);
  if (value === null || value === undefined || value === "") return "Qualitative observation";
  return String(value);
}

function renderObservationHistoryRow(track) {
  const latest = track.mostRecentObservation;
  const source = track.sourceUrl ? "<a class=\"history-link\" href=\"" + escapeHtml(track.sourceUrl) + "\" target=\"_blank\" rel=\"noreferrer\">" + escapeHtml(track.sourceName) + " ↗</a>" : "";
  const periodStart = latest?.periodStart ? String(latest.periodStart).slice(0, 10) : null;
  const periodEnd = latest?.periodEnd ? String(latest.periodEnd).slice(0, 10) : null;
  const sameDayObservation = latest?.asOfDate && periodStart === String(latest.asOfDate).slice(0, 10) && periodEnd === String(latest.asOfDate).slice(0, 10);
  const period = latest?.periodStart && latest?.periodEnd && !sameDayObservation ? formatDate(latest.periodStart) + " – " + formatDate(latest.periodEnd) : "";
  const value = latest ? formatObservationValue(latest) + (latest.unit ? " · " + latest.unit : "") : "No recorded observation";
  return "<tr><td><strong>" + escapeHtml(track.title) + "</strong><span class=\"table-subtle\">" + escapeHtml(track.layer) + "</span>" + source + "</td>" +
    "<td><span class=\"observation-value\">" + escapeHtml(value) + "</span><span class=\"observation-meta\">" + (latest ? "As of " + escapeHtml(formatDate(latest.asOfDate)) : "Awaiting baseline") + (period ? " · " + escapeHtml(period) : "") + "</span></td>" +
    "<td><span class=\"tag " + statusTone(track.maturity) + "\">" + escapeHtml(track.maturity) + "</span><span class=\"history-count\">" + escapeHtml(track.recordedObservationCount + " recorded · " + track.eligibleObservationCount + " eligible / " + track.requiredEligibleObservations + " needed") + "</span><span class=\"table-subtle\">" + escapeHtml(track.nextRequirement) + "</span></td>" +
    "<td>" + escapeHtml(track.comparability) + "<span class=\"table-subtle\">" + escapeHtml(track.cadence) + "</span></td>" +
    "<td>" + escapeHtml(track.decisionUse) + "<span class=\"table-subtle\">Do not use: " + escapeHtml(track.doNotUse) + "</span></td></tr>";
}

function renderCompanyHistoryRow(company) {
  const latest = company.latestRecord;
  const source = latest?.sourceUrl ? "<a class=\"history-link\" href=\"" + escapeHtml(latest.sourceUrl) + "\" target=\"_blank\" rel=\"noreferrer\">" + escapeHtml(latest.sourceLabel || "Primary source") + " ↗</a>" : "";
  const reported = latest ? escapeHtml(latest.periodLabel || "Reported period") + "<span class=\"observation-meta\">Ended " + escapeHtml(formatDate(latest.periodEnd)) + " · reported " + escapeHtml(formatDate(latest.reportedDate)) + "</span>" + source : "Awaiting first reported period";
  return "<tr><td><strong>" + escapeHtml(company.ticker) + "</strong><span class=\"table-subtle\">" + escapeHtml(company.title) + "</span></td>" +
    "<td>" + reported + "</td>" +
    "<td><span class=\"tag " + statusTone(company.maturity) + "\">" + escapeHtml(company.maturity) + "</span><span class=\"history-count\">" + escapeHtml(company.recordedObservationCount + " recorded · " + company.eligibleObservationCount + " eligible / " + company.requiredEligibleObservations + " needed") + "</span><span class=\"table-subtle\">" + escapeHtml(company.nextRequirement) + "</span></td>" +
    "<td>" + escapeHtml(company.decisionUse) + (latest?.captureRead ? "<span class=\"table-subtle\">Current read: " + escapeHtml(latest.captureRead) + "</span>" : "") + "</td>" +
    "<td>" + escapeHtml(company.doNotUse) + (latest?.counterpoint ? "<span class=\"table-subtle\">Counterpoint: " + escapeHtml(latest.counterpoint) + "</span>" : "") + "</td></tr>";
}

function renderMarketHistory(history) {
  return "<h3>" + escapeHtml(history.title) + "</h3><p><strong>Current status:</strong> " + escapeHtml(history.status) + ".</p><p><strong>Missing:</strong> " + escapeHtml(history.missing) + "</p><p><strong>Boundary:</strong> " + escapeHtml(history.boundary) + "</p><p><strong>Next action:</strong> " + escapeHtml(history.nextAction) + "</p>";
}

function renderMechanics(company) {
  const mechanics = company.mechanics;
  if (!mechanics) return "";
  const rows = [
    ["Billable unit", mechanics.billableUnit],
    ["Agentic trigger", mechanics.agenticTrigger],
    ["Pricing architecture", mechanics.pricingArchitecture],
    ["Incremental cost", mechanics.incrementalCost],
    ["Leading KPI", mechanics.leadingKpi],
    ["Proof threshold", mechanics.proofThreshold],
    ["Time to impact", mechanics.timeToImpact],
    ["Key risk", mechanics.keyRisk]
  ].map(([label, value]) => "<div><dt>" + escapeHtml(label) + "</dt><dd>" + escapeHtml(value) + "</dd></div>").join("");
  const review = company.reviewUrl ? "<a href=\"" + escapeHtml(company.reviewUrl) + "\" target=\"_blank\" rel=\"noreferrer\">Full research note ↗</a>" : "";
  return "<article class=\"mechanics-card\"><div class=\"company-card-top\"><span class=\"ticker\">" + escapeHtml(company.ticker) + "</span><span class=\"tag neutral\">" + escapeHtml(company.readiness?.stage || "Core") + "</span></div><dl class=\"mechanics-list\">" + rows + "</dl>" + review + "</article>";
}

function renderTriangulationRow(row) {
  return "<tr><td><strong>" + escapeHtml(row.lens) + "</strong><span class=\"table-subtle\">" + escapeHtml(row.source) + "</span></td><td>" + escapeHtml(row.reading) + "</td><td>" + escapeHtml(formatDate(row.asOfDate)) + "<span class=\"table-subtle\">" + escapeHtml(row.sample) + "</span></td><td><span class=\"tag neutral\">" + escapeHtml(row.maturity) + "</span><span class=\"table-subtle\">" + escapeHtml(row.crossSourceRead) + "</span></td></tr>";
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
  const readiness = company.readiness ? "<p class=\"company-readiness\"><span>Decision stage " + escapeHtml(company.readiness.stage) + "</span>" + escapeHtml(company.readiness.state) + "<small>Next: " + escapeHtml(company.readiness.nextEvidence) + "</small></p>" : "";
  const currentUpdate = company.currentUpdate
    ? "<section class=\"company-current-update\"><span>" + escapeHtml(company.currentUpdate.label) + "</span><strong>" + escapeHtml(company.currentUpdate.headline) + "</strong><p>" + escapeHtml(company.currentUpdate.detail) + "</p><a href=\"" + escapeHtml(company.currentUpdate.sourceUrl) + "\" target=\"_blank\" rel=\"noreferrer\">" + escapeHtml(company.currentUpdate.sourceLabel) + " ↗</a></section>"
    : "";
  const reviewedEvidence = company.evidence ? "<p class=\"company-period\">" + escapeHtml(company.period) + " · company-reported</p><dl class=\"company-evidence\">" + evidence + "</dl><p class=\"company-read\"><span>Capture read</span>" + escapeHtml(company.agenticRead) + "</p><p class=\"company-counterpoint\"><span>Counterpoint</span>" + escapeHtml(company.counterpoint) + "</p>" + currentUpdate + readiness : kpis;
  const sourceLinks = company.sources ? company.sources.map((item) => "<a href=\"" + escapeHtml(item.url) + "\" target=\"_blank\" rel=\"noreferrer\">" + escapeHtml(item.label) + " ↗</a>").join("") : "<a href=\"" + escapeHtml(company.source) + "\" target=\"_blank\" rel=\"noreferrer\">Primary IR source ↗</a>";
  const reviewLink = company.reviewUrl ? "<a href=\"" + escapeHtml(company.reviewUrl) + "\" target=\"_blank\" rel=\"noreferrer\">Full research note ↗</a>" : "";
  return "<article class=\"company-card\"><div class=\"company-card-top\"><span class=\"ticker\">" + escapeHtml(company.ticker) + "</span><span class=\"tag neutral\">" + escapeHtml(company.state) + "</span></div><p class=\"company-mechanism\">" + escapeHtml(company.mechanism) + "</p>" + reviewedEvidence + "<div class=\"company-sources\">" + sourceLinks + reviewLink + "</div></article>";
}

const finiteNumber = (value) => {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "number" && typeof value !== "string") return null;
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
  const derived = record?.derived || {};
  const providerName = snapshot?.provider?.name || "Market-data";
  const details = [];
  const price = formatUsd(quote.price);
  const forwardPe = finiteNumber(derived.forwardPriceEarnings);
  if (price) details.push("Price " + price);
  if (forwardPe !== null) details.push("Forward P/E " + forwardPe.toFixed(1) + "x");
  const asOf = record?.asOfDate || snapshot?.retrievedAt;
  return "<div class=\"market-data-cell\"><span class=\"guidance-label\">" + escapeHtml(providerName) + " snapshot · " + escapeHtml(formatDate(asOf)) + "</span><span>" + escapeHtml(details.length ? details.join(" · ") : "No displayable valuation fields returned") + "</span><span class=\"market-context-note\">Price targets are supplemental context and are not used in the gap read.</span>" + renderMarketSource(snapshot) + "</div>";
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
  const estimateYearEnd = marketRecord?.annualEstimate?.fiscalDateEnding;
  const fiscalMismatch = Boolean(marketRecord && row.companyFiscalYearEnd && estimateYearEnd && !String(estimateYearEnd).endsWith(row.companyFiscalYearEnd));
  const alignmentRead = fiscalMismatch ? "Current snapshot ends " + formatDate(estimateYearEnd) + "; " + (row.companyName || row.ticker) + "'s fiscal year ends " + (row.companyFiscalYearEndLabel || row.companyFiscalYearEnd) + ". Do not compare this estimate with company guidance." : null;
  const gapRead = !marketRecord ? "No current market context — not decision-ready." : (alignmentRead || "Fiscal period aligns, but this is a current snapshot only. Estimate-revision and valuation history are still required before a gap call.");
  const tone = " caution";
  return "<tr><td><strong>" + escapeHtml(row.ticker) + "</strong></td><td>" + escapeHtml(row.agenticEvidence) + "</td><td>" + managementOutlook + "</td><td>" + streetEstimates + "</td><td>" + valuation + "</td><td><span class=\"read" + tone + "\"><i></i>" + escapeHtml(gapRead) + "</span></td></tr>";
}

function renderProvider(provider, marketSnapshot) {
  const capabilities = Array.isArray(provider.capabilities) ? provider.capabilities.map((capability) => "<span>" + escapeHtml(capability) + "</span>").join("") : "";
  const source = provider.sourceUrl ? "<a href=\"" + escapeHtml(provider.sourceUrl) + "\" target=\"_blank\" rel=\"noreferrer\">" + escapeHtml(provider.sourceLabel || "Provider details") + " ↗</a>" : "";
  const marketRows = Array.isArray(marketSnapshot?.rows) ? marketSnapshot.rows.filter((row) => row?.status === "observed") : [];
  const isLiveProvider = provider.id === marketSnapshot?.provider?.id && marketRows.length > 0;
  const status = isLiveProvider ? "Active · current snapshot" : provider.status;
  const tone = isLiveProvider ? "positive" : (provider.tone || "neutral");
  const description = isLiveProvider ? "A current " + (marketSnapshot?.provider?.name || provider.name) + " snapshot is rendered for " + marketRows.length + " core ticker" + (marketRows.length === 1 ? "" : "s") + ". It supplies market context only: fiscal alignment, accounting convention, estimate revisions, and valuation history remain separate requirements for a gap call." : provider.description;
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
    fetchJson("data/manual/enterprise-adoption-observations.json").catch(() => ({ observations: [] })),
    fetchJson("data/manual/research-gates.json"),
    fetchJson("data/manual/triangulation.json"),
    fetchJson("data/processed/observation-register.json").catch(() => null)
  ]);
  const framework = data[0];
  const pulse = data[1];
  const sourceRegistry = data[2].sources;
  const currentMcp = data[3];
  const mcpHistory = data[4];
  const currentCloudflare = data[5];
  const cloudflareHistory = data[6];
  const manualEnterprise = data[7];
  const researchGates = data[8];
  const triangulation = data[9];
  const observationRegister = data[10];
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
  const trendReadyCount = observationRegister?.summary?.metricsReadyForReview ?? Object.values(histories).filter((history) => Array.isArray(history) && history.length >= 3).length;
  const registerTracks = new Map((observationRegister?.tracks || []).map((track) => [track.metricId, track]));
  const mostRecent = [...observations].sort((a, b) => String(b.retrievalDate).localeCompare(String(a.retrievalDate)))[0];
  $("#last-updated").textContent = mostRecent ? formatDate(mostRecent.retrievalDate) : formatDate(pulse.asOfDate);
  $("#confidence").textContent = observedCount + " observed proxies · " + (trendReadyCount ? trendReadyCount + " ready for trend review" : "no series ready for trend review");
  $("#project-state").textContent = researchGates.projectState;
  $("#project-note").textContent = researchGates.projectNote;
  $("#research-gate-grid").innerHTML = researchGates.gates.map(renderResearchGate).join("");
  $("#metric-grid").innerHTML = pulse.metrics.map((metric) => {
    const observation = observations.find((item) => item.metricId === metric.id);
    const history = histories[metric.id] || [];
    return renderPulseCard(metric, sourceFor(sourceRegistry, metric.sourceId), observation, history.length, registerTracks.get(metric.id));
  }).join("");
  $("#expectation-grid").innerHTML = framework.expectations.map(renderExpectation).join("");
  $("#gap-table-body").innerHTML = framework.gaps.map(renderGap).join("");
  $("#breaker-grid").innerHTML = framework.breakers.slice(0, 3).map(renderBreaker).join("") + "<a class=\"breaker-more\" href=\"breakers.html\">See all 10 measurable thesis breakers →</a>";
  $("#triangulation-headline").textContent = triangulation.headline;
  $("#triangulation-summary").textContent = triangulation.summary;
  $("#triangulation-body").innerHTML = triangulation.rows.map(renderTriangulationRow).join("");
  $("#source-list").innerHTML = sourceRegistry.map(renderSource).join("");
}

async function initCompanies() {
  const [companyData, researchGates] = await Promise.all([
    fetchJson("data/manual/company-kpis.json"),
    fetchJson("data/manual/research-gates.json")
  ]);
  const coreCompanies = companyData.companies.filter((company) => company.tier === "Core");
  $("#company-readiness-body").innerHTML = researchGates.companies.map(renderCompanyReadiness).join("");
  $("#company-grid").innerHTML = coreCompanies.map(renderCompany).join("");
  $("#mechanics-grid").innerHTML = coreCompanies.filter((company) => company.mechanics).map(renderMechanics).join("");
}

function renderEarningsSummary(item) {
  return "<article class=\"earnings-summary-item\"><span>" + escapeHtml(item.label) + "</span><strong>" + escapeHtml(item.value) + "</strong><small>" + escapeHtml(item.note) + "</small></article>";
}

function renderEarningsGuide(item) {
  return "<div class=\"earnings-guide-item\"><span>" + escapeHtml(item.label) + "</span><strong>" + escapeHtml(item.value) + "</strong><small>" + escapeHtml(item.note) + "</small></div>";
}

function renderEarningsCheck(check) {
  const lines = [
    ["Evidence upgrade", check.upgrade],
    ["Not enough", check.notEnough],
    ["Thesis downgrade", check.downgrade]
  ].map(([label, value]) => "<div><dt>" + escapeHtml(label) + "</dt><dd>" + escapeHtml(value) + "</dd></div>").join("");
  return "<article class=\"earnings-check\"><div class=\"earnings-check-top\"><span class=\"metric-number\">" + escapeHtml(check.number) + "</span><h3>" + escapeHtml(check.title) + "</h3></div><dl>" + lines + "</dl></article>";
}

function renderEarningsCard(company) {
  const sourceLinks = (company.sources || []).map((source) => "<a href=\"" + escapeHtml(source.url) + "\" target=\"_blank\" rel=\"noreferrer\">" + escapeHtml(source.label) + " ↗</a>").join("");
  return "<article class=\"earnings-card\">" +
    "<div class=\"earnings-card-top\"><div><span class=\"ticker\">" + escapeHtml(company.ticker) + "</span><h3 class=\"earnings-company-name\">" + escapeHtml(company.name) + "</h3></div><span class=\"tag warning\">Pre-release</span></div>" +
    "<p class=\"earnings-lens\">" + escapeHtml(company.lens) + "</p><p class=\"earnings-period\">" + escapeHtml(company.fiscalPeriod) + "</p><p class=\"earnings-timing\">" + escapeHtml(company.timing) + "</p>" +
    "<div class=\"earnings-question\"><span>One question</span><p>" + escapeHtml(company.question) + "</p></div>" +
    "<div class=\"earnings-guide\">" + company.guide.map(renderEarningsGuide).join("") + "</div>" +
    "<details class=\"earnings-details\"><summary><span>Decision checks</span><strong>" + escapeHtml(company.checks.length + " checkpoints") + "</strong></summary><div class=\"earnings-checks\">" + company.checks.map(renderEarningsCheck).join("") + "</div><p class=\"earnings-boundary\"><span>Boundary</span>" + escapeHtml(company.boundary) + "</p></details>" +
    "<div class=\"company-sources\">" + sourceLinks + "</div></article>";
}

async function initEarnings() {
  const data = await fetchJson("data/manual/company-earnings-scorecards.json");
  $("#earnings-status").textContent = data.status;
  $("#earnings-purpose").textContent = data.purpose;
  $("#earnings-summary").innerHTML = data.summary.map(renderEarningsSummary).join("");
  $("#earnings-grid").innerHTML = data.companies.map(renderEarningsCard).join("");
  $("#earnings-protocol").innerHTML = data.postReleaseProtocol.map((step) => "<li>" + escapeHtml(step) + "</li>").join("");
}

function renderQueueSummary(item) {
  return "<article class=\"queue-summary-item\"><span>" + escapeHtml(item.label) + "</span><strong>" + escapeHtml(item.value) + "</strong><small>" + escapeHtml(item.note) + "</small></article>";
}

function renderQueueBaseline(item) {
  return "<div class=\"queue-baseline-item\"><span>" + escapeHtml(item.label) + "</span><strong>" + escapeHtml(item.value) + "</strong>" + (item.note ? "<small>" + escapeHtml(item.note) + "</small>" : "") + "</div>";
}

function renderQueueTest(test) {
  const lines = [
    ["Evidence upgrade", test.upgrade],
    ["Not enough", test.notEnough],
    ["Thesis downgrade", test.downgrade]
  ].map(([label, value]) => "<div><dt>" + escapeHtml(label) + "</dt><dd>" + escapeHtml(value) + "</dd></div>").join("");
  return "<article class=\"queue-test\"><div class=\"queue-test-top\"><span class=\"metric-number\">" + escapeHtml(test.number) + "</span><h3>" + escapeHtml(test.title) + "</h3></div><dl>" + lines + "</dl></article>";
}

function renderQueueSources(sources) {
  return (sources || []).map((source) => "<a href=\"" + escapeHtml(source.url) + "\" target=\"_blank\" rel=\"noreferrer\">" + escapeHtml(source.label) + " ↗</a>").join("");
}

function renderSecondaryQueueCard(company) {
  return "<article class=\"queue-card\">" +
    "<div class=\"queue-card-top\"><div><span class=\"ticker\">" + escapeHtml(company.ticker) + "</span><h3 class=\"queue-company-name\">" + escapeHtml(company.name) + "</h3></div><span class=\"tag warning\">Secondary</span></div>" +
    "<p class=\"queue-lens\">" + escapeHtml(company.lens) + "</p><p class=\"queue-period\">" + escapeHtml(company.fiscalPeriod) + "</p><p class=\"queue-state\">" + escapeHtml(company.state) + "</p>" +
    "<div class=\"queue-question\"><span>One question</span><p>" + escapeHtml(company.question) + "</p></div>" +
    "<div class=\"queue-baseline\">" + company.reportedBaseline.map(renderQueueBaseline).join("") + "</div>" +
    "<p class=\"queue-mechanism\"><span>Mechanism</span>" + escapeHtml(company.mechanism) + "</p>" +
    "<details class=\"queue-details\"><summary><span>Decision tests</span><strong>" + escapeHtml(company.tests.length + " checkpoints") + "</strong></summary><div class=\"queue-tests\">" + company.tests.map(renderQueueTest).join("") + "</div><p class=\"queue-boundary-text\"><span>Boundary</span>" + escapeHtml(company.boundary) + "</p></details>" +
    "<div class=\"company-sources\">" + renderQueueSources(company.sources) + "</div></article>";
}

function renderBenchmarkCard(company) {
  return "<article class=\"benchmark-card\">" +
    "<div class=\"benchmark-card-top\"><div><span class=\"ticker\">" + escapeHtml(company.ticker) + "</span><h3 class=\"benchmark-company-name\">" + escapeHtml(company.name) + "</h3></div><span class=\"tag neutral\">Benchmark</span></div>" +
    "<p class=\"benchmark-lens\">" + escapeHtml(company.lens) + "</p><p class=\"benchmark-period\">" + escapeHtml(company.fiscalPeriod) + "</p>" +
    "<div class=\"queue-baseline\">" + company.reportedBaseline.map(renderQueueBaseline).join("") + "</div>" +
    "<p class=\"benchmark-why\"><span>Why it is here</span>" + escapeHtml(company.whyBenchmark) + "</p>" +
    "<p class=\"benchmark-next\"><span>What changes its role</span>" + escapeHtml(company.whatWouldChangeRole) + "</p>" +
    "<p class=\"benchmark-boundary\"><span>Boundary</span>" + escapeHtml(company.boundary) + "</p>" +
    "<div class=\"company-sources\">" + renderQueueSources(company.sources) + "</div></article>";
}

function renderQueueProtocol(item) {
  return "<article class=\"queue-protocol-item\"><span class=\"metric-number\">" + escapeHtml(item.number) + "</span><h3>" + escapeHtml(item.title) + "</h3><p>" + escapeHtml(item.detail) + "</p></article>";
}

async function initResearchQueue() {
  const data = await fetchJson("data/manual/secondary-company-research.json");
  $("#queue-status").textContent = data.status;
  $("#queue-purpose").textContent = data.purpose;
  $("#queue-summary").innerHTML = data.summary.map(renderQueueSummary).join("");
  $("#queue-candidates").innerHTML = data.secondary.map(renderSecondaryQueueCard).join("");
  $("#benchmark-grid").innerHTML = data.benchmarks.map(renderBenchmarkCard).join("");
  $("#queue-protocol").innerHTML = data.promotionProtocol.map(renderQueueProtocol).join("");
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
    $("#market-data-status").textContent = providerName + " current-context snapshot · " + marketRows.length + " ticker" + (marketRows.length === 1 ? "" : "s");
    $("#market-data-notice").textContent = "Management guidance remains company-issued context. The current " + providerName + " snapshot shows a retrieval date and annual fiscal period, but has no retained estimate-revision or valuation-history series. It cannot independently support an expectation-gap conclusion.";
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

async function initHistory() {
  const register = await fetchJson("data/processed/observation-register.json");
  $("#history-as-of").textContent = formatDate(register.asOfDate);
  $("#history-metric-count").textContent = String(register.summary?.trackedMetrics || 0);
  $("#history-ready-count").textContent = String(register.summary?.metricsReadyForReview || 0);
  $("#history-company-count").textContent = String(register.summary?.trackedCompanies || 0);
  $("#history-rule").textContent = register.trendReviewRule;
  $("#observation-register-body").innerHTML = (register.tracks || []).map(renderObservationHistoryRow).join("");
  $("#company-history-body").innerHTML = (register.companyCapture || []).map(renderCompanyHistoryRow).join("");
  $("#market-history-card").innerHTML = renderMarketHistory(register.marketExpectationHistory || {});
}

function formatBillions(value, maximumFractionDigits = 2) {
  const numeric = finiteNumber(value);
  if (numeric === null) return "—";
  return "$" + numeric.toFixed(maximumFractionDigits).replace(/\.0+$/, "").replace(/(\.\d*?)0+$/, "$1") + "B";
}

function formatPercentPlain(value, maximumFractionDigits = 0) {
  const numeric = finiteNumber(value);
  if (numeric === null) return "—";
  return numeric.toFixed(maximumFractionDigits).replace(/\.0+$/, "") + "%";
}

function calculatedScenario(scenario, baseline) {
  const revenue2026 = finiteNumber(baseline.revenueGuideMidpointBillions) || 0;
  const g27 = (finiteNumber(scenario.revenueGrowth?.fy2027) || 0) / 100;
  const g28 = (finiteNumber(scenario.revenueGrowth?.fy2028) || 0) / 100;
  const g30 = (finiteNumber(scenario.revenueGrowth?.fy2029to2030) || 0) / 100;
  const revenue2027 = revenue2026 * (1 + g27);
  const revenue2028 = revenue2027 * (1 + g28);
  const revenue2030 = revenue2028 * Math.pow(1 + g30, 2);
  const fcfMargin2030 = (finiteNumber(scenario.fcfMargin?.fy2030) || 0) / 100;
  const fcf2030 = revenue2030 * fcfMargin2030;
  const enterpriseValue2030 = fcf2030 * (finiteNumber(scenario.exitFcfMultiple) || 0);
  const equityValue2030 = enterpriseValue2030 - (finiteNumber(baseline.netDebtBridgeBillions) || 0);
  const dilutedShares = finiteNumber(baseline.dilutedShareBridgeMillions) || 0;
  const perShare = dilutedShares > 0 ? equityValue2030 * 1000 / dilutedShares : null;
  return { revenue2027, revenue2028, revenue2030, fcf2030, enterpriseValue2030, equityValue2030, perShare };
}

function renderModelBaseline(baseline) {
  const marginRange = formatPercentPlain(baseline.nonGaapOperatingMarginGuideLow) + "–" + formatPercentPlain(baseline.nonGaapOperatingMarginGuideHigh);
  const cards = [
    ["FY2026 revenue guide midpoint", formatBillions(baseline.revenueGuideMidpointBillions), "Company-issued guidance"],
    ["FY2026 non-GAAP operating-margin guide", marginRange, "Company-issued guidance"],
    ["H1 operating cash flow", formatBillions(baseline.h1OperatingCashFlowBillions), "Company-reported cash flow"],
    ["H1 capital-investment proxy", formatBillions(baseline.h1CapitalInvestmentProxyBillions), "PPE + capitalized internal-use software"],
    ["Net-debt bridge", formatBillions(baseline.netDebtBridgeBillions), "Analyst-defined June 30 bridge"],
    ["Diluted-share bridge", (finiteNumber(baseline.dilutedShareBridgeMillions) || 0).toFixed(0) + "M", "Guidance share-count bridge"]
  ];
  return cards.map(([label, value, note]) => "<article class=\"model-baseline-card\"><span>" + escapeHtml(label) + "</span><strong>" + escapeHtml(value) + "</strong><small>" + escapeHtml(note) + "</small></article>").join("");
}

function renderScorecardBaseline(item) {
  return "<article class=\"model-baseline-card scorecard-baseline-card\"><span>" + escapeHtml(item.label) + "</span><strong>" + escapeHtml(item.value) + "</strong><small>" + escapeHtml(item.note) + "</small></article>";
}

function renderScorecardCheck(check) {
  const lines = [
    ["Q3 question", check.question],
    ["Starting point", check.baseline],
    ["Evidence upgrade", check.upgrade],
    ["Not enough", check.notEnough],
    ["Thesis downgrade", check.downgrade],
    ["Decision impact", check.decisionImpact]
  ].map(([label, value]) => "<div><dt>" + escapeHtml(label) + "</dt><dd>" + escapeHtml(value) + "</dd></div>").join("");
  return "<article class=\"scorecard-check\"><div class=\"scorecard-check-top\"><span class=\"metric-number\">" + escapeHtml(check.number) + "</span><span class=\"tag neutral\">Reported evidence</span></div><h3>" + escapeHtml(check.title) + "</h3><dl>" + lines + "</dl></article>";
}

function renderScorecardDecision(rule) {
  const tone = rule.state.toLowerCase().includes("upgrade") ? "positive" : (rule.state.toLowerCase().includes("downgrade") ? "caution" : "warning");
  return "<article class=\"scorecard-decision\"><span class=\"tag " + tone + "\">" + escapeHtml(rule.state) + "</span><p>" + escapeHtml(rule.definition) + "</p><strong>" + escapeHtml(rule.action) + "</strong></article>";
}

function renderAkamDecisionFact(fact) {
  return "<article class=\"akam-decision-fact\"><span>" + escapeHtml(fact.label) + "</span><strong>" + escapeHtml(fact.value) + "</strong><p>" + escapeHtml(fact.detail) + "</p></article>";
}

function renderAkamDecisionQuestion(question) {
  return "<article class=\"akam-decision-question\"><span class=\"metric-number\">" + escapeHtml(question.number) + "</span><div><h3>" + escapeHtml(question.title) + "</h3><p>" + escapeHtml(question.detail) + "</p></div></article>";
}

function initAkamDecisionDesk(desk) {
  $("#akam-decision-status").textContent = desk.status;
  $("#akam-decision-purpose").textContent = desk.purpose;
  $("#akam-decision-now").innerHTML = "<span>" + escapeHtml(desk.currentDecision.label) + "</span><strong>" + escapeHtml(desk.currentDecision.value) + "</strong><p>" + escapeHtml(desk.currentDecision.detail) + "</p>";
  $("#akam-decision-facts").innerHTML = desk.facts.map(renderAkamDecisionFact).join("");
  $("#akam-decision-questions").innerHTML = desk.nextQuestions.map(renderAkamDecisionQuestion).join("");
  $("#akam-decision-boundary").innerHTML = "<span>Decision boundary</span>" + escapeHtml(desk.boundary);
  $("#akam-decision-sources").innerHTML = "<div class=\"model-source-notes\"><p>" + escapeHtml(desk.sourceNote) + "</p></div><div class=\"company-sources\">" + desk.sources.map((source) => "<a href=\"" + escapeHtml(source.url) + "\" target=\"_blank\" rel=\"noreferrer\">" + escapeHtml(source.label) + " ↗</a>").join("") + "</div>";
}

function initAkamScorecard(scorecard) {
  $("#akam-scorecard-status").textContent = scorecard.status;
  $("#akam-scorecard-purpose").textContent = scorecard.purpose;
  $("#akam-scorecard-period").textContent = scorecard.event.fiscalPeriod;
  $("#akam-scorecard-timing").textContent = scorecard.event.timing;
  $("#akam-scorecard-events-link").href = scorecard.event.eventsUrl;
  $("#akam-scorecard-baseline").innerHTML = scorecard.reportedBaseline.map(renderScorecardBaseline).join("");
  $("#akam-scorecard-checks").innerHTML = scorecard.checks.map(renderScorecardCheck).join("");
  $("#akam-scorecard-protocol").innerHTML = scorecard.postReleaseProtocol.map((step) => "<li>" + escapeHtml(step) + "</li>").join("");
  $("#akam-scorecard-decisions").innerHTML = scorecard.decisionRules.map(renderScorecardDecision).join("");
  $("#akam-scorecard-sources").innerHTML = "<div class=\"model-source-notes\"><p>The scorecard is pre-release research discipline. Each line must be updated from the earnings release, filing, and management commentary—not from a price move or headline.</p></div><div class=\"company-sources\">" + scorecard.sources.map((source) => "<a href=\"" + escapeHtml(source.url) + "\" target=\"_blank\" rel=\"noreferrer\">" + escapeHtml(source.label) + " ↗</a>").join("") + "</div>";
}

function renderModelScenario(scenario, baseline, currentPrice) {
  const calculated = calculatedScenario(scenario, baseline);
  const growth = [scenario.revenueGrowth?.fy2027, scenario.revenueGrowth?.fy2028, scenario.revenueGrowth?.fy2029to2030].map((value) => formatPercentPlain(value)).join(" / ");
  const valueNote = currentPrice && calculated.perShare !== null ? formatPercent(((calculated.perShare / currentPrice) - 1) * 100) + " versus current snapshot" : "Current price unavailable";
  const value = calculated.perShare !== null ? formatUsd(calculated.perShare) : "—";
  return "<tr><td><span class=\"tag " + escapeHtml(scenario.tone || "neutral") + "\">" + escapeHtml(scenario.title) + "</span><span class=\"table-subtle\">" + escapeHtml(scenario.thesis) + "</span></td><td>" + escapeHtml(growth) + "</td><td>" + escapeHtml(formatBillions(calculated.revenue2030)) + "</td><td>" + escapeHtml(formatPercentPlain(scenario.fcfMargin?.fy2030)) + "</td><td>" + escapeHtml(formatPercentPlain(scenario.capitalInvestmentRatio?.fy2030)) + "</td><td>" + escapeHtml((finiteNumber(scenario.exitFcfMultiple) || 0).toFixed(0) + "x") + "</td><td>" + escapeHtml(formatBillions(calculated.fcf2030)) + "</td><td>" + escapeHtml(value) + "<span class=\"table-subtle\">" + escapeHtml(valueNote) + "</span></td><td>" + escapeHtml(scenario.proof) + "</td></tr>";
}

function renderReverseExpectationRow(multiple, baseline, currentPrice, referenceRevenue) {
  const dilutedShares = finiteNumber(baseline.dilutedShareBridgeMillions) || 0;
  const netDebt = finiteNumber(baseline.netDebtBridgeBillions) || 0;
  const enterpriseValue = currentPrice * dilutedShares / 1000 + netDebt;
  const fcfRequired = enterpriseValue / multiple;
  const marginRequired = referenceRevenue > 0 ? fcfRequired / referenceRevenue * 100 : null;
  const interpretation = "At the stated multiple, a $" + referenceRevenue.toFixed(1) + "B FY2030 revenue base would require about " + formatPercentPlain(marginRequired, 1) + " FCF margin to support this simple enterprise-value bridge.";
  return "<tr><td>" + escapeHtml(multiple.toFixed(0) + "x") + "</td><td>" + escapeHtml(formatBillions(enterpriseValue)) + "</td><td>" + escapeHtml(formatBillions(fcfRequired)) + "</td><td>" + escapeHtml(formatPercentPlain(marginRequired, 1)) + "</td><td>" + escapeHtml(interpretation) + "</td></tr>";
}

async function initModel() {
  const [model, eulerpoolSnapshot, fmpSnapshot, scorecard, decisionDesk] = await Promise.all([
    fetchJson("data/manual/akam-scenario-lab.json"),
    fetchJson(eulerpoolSnapshotPath).catch(() => null),
    fetchJson("data/processed/fmp-market-expectations.json").catch(() => null),
    fetchJson("data/manual/akam-q3-scorecard.json"),
    fetchJson("data/manual/akam-decision-desk.json")
  ]);
  const snapshots = [eulerpoolSnapshot, fmpSnapshot];
  const marketSnapshot = snapshots.find((snapshot) => Array.isArray(snapshot?.rows) && snapshot.rows.some((row) => row?.ticker === "AKAM" && row?.status === "observed")) || null;
  const marketRecord = marketSnapshot?.rows?.find((row) => row?.ticker === "AKAM" && row?.status === "observed");
  const currentPrice = finiteNumber(marketRecord?.quote?.price);
  const attribution = $("#model-attribution");
  $("#model-baseline-grid").innerHTML = renderModelBaseline(model.reportedBaseline);
  initAkamDecisionDesk(decisionDesk);
  initAkamScorecard(scorecard);
  $("#model-scenarios-body").innerHTML = model.scenarios.map((scenario) => renderModelScenario(scenario, model.reportedBaseline, currentPrice)).join("");
  $("#model-source-list").innerHTML = "<div class=\"model-source-notes\">" + model.reportedBaseline.notes.map((note) => "<p>" + escapeHtml(note) + "</p>").join("") + "</div><div class=\"company-sources\">" + model.reportedBaseline.sources.map((source) => "<a href=\"" + escapeHtml(source.url) + "\" target=\"_blank\" rel=\"noreferrer\">" + escapeHtml(source.label) + " ↗</a>").join("") + "</div>";
  if (currentPrice !== null) {
    const providerName = marketSnapshot?.provider?.name || "Market-data";
    const asOf = marketRecord?.asOfDate || marketSnapshot?.retrievedAt;
    $("#model-status").textContent = model.status + " · Current AKAM price " + formatUsd(currentPrice) + " as of " + formatDate(asOf);
    $("#model-notice").textContent = "The current price is used only to show the gap between a transparent FY2030 scenario bridge and today’s market context. It is not stored in the model, nor does it turn the output into a price target.";
    if (attribution && marketSnapshot?.provider?.attributionText && marketSnapshot?.provider?.attributionUrl) {
      attribution.href = marketSnapshot.provider.attributionUrl;
      attribution.textContent = marketSnapshot.provider.attributionText + " ↗";
      attribution.hidden = false;
    }
    const reverse = model.reverseExpectation;
    const referenceRevenue = finiteNumber(reverse.referenceRevenueBillions) || 0;
    $("#reverse-expectation-note").textContent = reverse.note;
    $("#reverse-expectations-body").innerHTML = reverse.exitFcfMultiples.map((multiple) => renderReverseExpectationRow(multiple, model.reportedBaseline, currentPrice, referenceRevenue)).join("");
  } else {
    $("#model-status").textContent = model.status + " · Current market input unavailable";
    $("#model-notice").textContent = "Reported baseline and scenario assumptions remain available. The reverse-expectations table requires a current attributed market snapshot and will remain blank until one is available.";
    $("#reverse-expectation-note").textContent = "A current attributed AKAM quote is unavailable, so no reverse-expectations calculation is shown.";
    $("#reverse-expectations-body").innerHTML = "<tr><td colspan=\"5\">Current attributed market input unavailable.</td></tr>";
  }
}

async function boot() {
  const page = document.body.dataset.page || "pulse";
  try {
    if (page === "companies") await initCompanies();
    else if (page === "earnings") await initEarnings();
    else if (page === "research-queue") await initResearchQueue();
    else if (page === "expectations") await initExpectations();
    else if (page === "breakers") await initBreakers();
    else if (page === "methodology") await initMethodology();
    else if (page === "history") await initHistory();
    else if (page === "model") await initModel();
    else await initPulse();
  } catch (error) {
    const target = document.querySelector("[aria-live]") || document.querySelector(".source-list") || document.querySelector("main");
    target.innerHTML = "<div class=\"loading-state\">Dashboard data could not be loaded. See the repository data layer for the underlying files.</div>";
    console.error(error);
  }
}

boot();
