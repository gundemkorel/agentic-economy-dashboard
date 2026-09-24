import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();

async function readJson(relativePath) {
  return JSON.parse(await readFile(path.join(root, relativePath), "utf8"));
}

function toUtcDate(value) {
  const text = String(value || "");
  if (!/^\d{4}-\d{2}-\d{2}/.test(text)) return null;
  const date = new Date(text.slice(0, 10) + "T00:00:00Z");
  return Number.isNaN(date.getTime()) ? null : date;
}

function daysBetween(first, second) {
  return Math.round((second.getTime() - first.getTime()) / 86_400_000);
}

function distinctDatedObservations(observations) {
  const byDate = new Map();
  observations.forEach((observation) => {
    if (toUtcDate(observation.asOfDate)) byDate.set(String(observation.asOfDate).slice(0, 10), observation);
  });
  return [...byDate.values()].sort((a, b) => String(a.asOfDate).localeCompare(String(b.asOfDate)));
}

function eligibleObservations(observations, minimumSpacingDays) {
  const eligible = [];
  observations.forEach((observation) => {
    const date = toUtcDate(observation.asOfDate);
    const previous = eligible.at(-1);
    const previousDate = previous && toUtcDate(previous.asOfDate);
    if (!previous || (date && previousDate && daysBetween(previousDate, date) >= minimumSpacingDays)) {
      eligible.push(observation);
    }
  });
  return eligible;
}

function maturity(eligibleCount, requiredCount) {
  if (eligibleCount === 0) return "Awaiting baseline";
  if (eligibleCount < requiredCount) return eligibleCount === 1 ? "Baseline" : "Developing";
  return "Ready for analyst trend review";
}

function remainingLabel(eligibleCount, requiredCount) {
  const remaining = Math.max(requiredCount - eligibleCount, 0);
  if (remaining === 0) return "Threshold met; review the direction, definitions, and counter-evidence manually.";
  return remaining === 1 ? "1 further eligible observation required." : remaining + " further eligible observations required.";
}

const policy = await readJson("data/manual/observation-policy.json");
const manualEnterprise = await readJson("data/manual/enterprise-adoption-observations.json");
const companyHistory = await readJson("data/manual/company-capture-history.json");

const tracks = await Promise.all(policy.tracks.map(async (track) => {
  let observations = [];
  if (track.historyFile) {
    const history = await readJson(track.historyFile);
    observations = Array.isArray(history.observations) ? history.observations : [];
  } else if (track.manualObservation) {
    observations = (manualEnterprise.observations || []).filter((observation) => observation.metricId === track.metricId);
  }
  const dated = distinctDatedObservations(observations);
  const eligible = eligibleObservations(dated, track.minimumSpacingDays);
  const latest = dated.at(-1) || null;
  return {
    metricId: track.metricId,
    title: track.title,
    layer: track.layer,
    sourceName: track.sourceName,
    sourceUrl: track.sourceUrl,
    dataType: track.dataType,
    cadence: track.cadence,
    comparability: track.comparability,
    decisionUse: track.decisionUse,
    doNotUse: track.doNotUse,
    minimumSpacingDays: track.minimumSpacingDays,
    requiredEligibleObservations: track.requiredEligibleObservations,
    recordedObservationCount: dated.length,
    eligibleObservationCount: eligible.length,
    maturity: maturity(eligible.length, track.requiredEligibleObservations),
    nextRequirement: remainingLabel(eligible.length, track.requiredEligibleObservations),
    firstObservedDate: dated[0]?.asOfDate || null,
    mostRecentObservation: latest ? {
      asOfDate: latest.asOfDate,
      periodStart: latest.periodStart || null,
      periodEnd: latest.periodEnd || null,
      displayValue: latest.displayValue || latest.value || "Qualitative",
      unit: latest.unit || null,
      notes: latest.notes || null
    } : null
  };
}));

const companyCapture = policy.companyCapture.map((company) => {
  const records = distinctDatedObservations((companyHistory.records || [])
    .filter((record) => record.ticker === company.ticker)
    .map((record) => ({ ...record, asOfDate: record.periodEnd || record.reportedDate })));
  const eligible = eligibleObservations(records, company.minimumSpacingDays);
  const latest = records.at(-1) || null;
  return {
    ticker: company.ticker,
    title: company.title,
    cadence: company.cadence,
    decisionUse: company.decisionUse,
    doNotUse: company.doNotUse,
    minimumSpacingDays: company.minimumSpacingDays,
    requiredEligibleObservations: company.requiredEligibleObservations,
    recordedObservationCount: records.length,
    eligibleObservationCount: eligible.length,
    maturity: maturity(eligible.length, company.requiredEligibleObservations),
    nextRequirement: remainingLabel(eligible.length, company.requiredEligibleObservations),
    latestRecord: latest ? {
      periodLabel: latest.periodLabel,
      periodEnd: latest.periodEnd,
      reportedDate: latest.reportedDate,
      sourceLabel: latest.sourceLabel,
      sourceUrl: latest.sourceUrl,
      captureRead: latest.captureRead,
      counterpoint: latest.counterpoint
    } : null
  };
});

const readyTracks = tracks.filter((track) => track.eligibleObservationCount >= track.requiredEligibleObservations).length;
const readyCompanies = companyCapture.filter((company) => company.eligibleObservationCount >= company.requiredEligibleObservations).length;
const observedDates = [
  policy.asOfDate,
  ...tracks.map((track) => track.mostRecentObservation?.asOfDate),
  ...companyCapture.map((company) => company.latestRecord?.periodEnd)
].filter((date) => toUtcDate(date)).map((date) => String(date).slice(0, 10)).sort();
const register = {
  asOfDate: observedDates.at(-1) || policy.asOfDate,
  definition: policy.definition,
  trendReviewRule: policy.trendReviewRule,
  summary: {
    trackedMetrics: tracks.length,
    metricsReadyForReview: readyTracks,
    trackedCompanies: companyCapture.length,
    companiesReadyForCaptureReview: readyCompanies
  },
  tracks,
  companyCapture,
  marketExpectationHistory: policy.marketExpectationHistory
};

const outputDirectory = path.join(root, "data", "processed");
await mkdir(outputDirectory, { recursive: true });
await writeFile(path.join(outputDirectory, "observation-register.json"), JSON.stringify(register, null, 2) + "\n");
console.log("Built observation register for " + tracks.length + " metrics and " + companyCapture.length + " companies.");
