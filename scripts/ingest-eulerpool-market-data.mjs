import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const apiKey = process.env.EULERPOOL_API_KEY?.trim();

if (!apiKey) {
  throw new Error("EULERPOOL_API_KEY is required. Store it only as a GitHub Actions secret; never add it to this repository or the public site.");
}

const root = process.cwd();
const expectationPath = path.join(root, "data", "manual", "expectations-gap.json");
const processedDirectory = path.join(root, "data", "processed");
const buildVersion = process.env.MARKET_SNAPSHOT_VERSION?.trim();
if (buildVersion && !/^[A-Za-z0-9_-]+$/.test(buildVersion)) {
  throw new Error("MARKET_SNAPSHOT_VERSION may contain only letters, numbers, underscores, and hyphens.");
}
const outputFilename = buildVersion ? "eulerpool-market-expectations-" + buildVersion + ".json" : "eulerpool-market-expectations.json";
const outputPath = path.join(processedDirectory, outputFilename);
const retrievedAt = new Date().toISOString();
const asOfDate = retrievedAt.slice(0, 10);
const apiOrigin = "https://api.eulerpool.com";
const documentationUrl = "https://eulerpool.com/developers";
const quoteDocumentationUrl = "https://eulerpool.com/developers/api/market/last/quote";
const estimateDocumentationUrl = "https://eulerpool.com/developers/api/equity/estimates";
const priceTargetDocumentationUrl = "https://eulerpool.com/developers/api/equity/price-target-consensus";

const asFiniteNumber = (value) => {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "number" && typeof value !== "string") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

function firstNumber(record, keys) {
  for (const key of keys) {
    const value = asFiniteNumber(record?.[key]);
    if (value !== null) return value;
  }
  return null;
}

function firstText(record, keys) {
  for (const key of keys) {
    const value = record?.[key];
    if (value !== null && value !== undefined && String(value).trim()) return String(value).trim();
  }
  return null;
}

function recordWithFields(record, hints, depth = 0) {
  if (!record || typeof record !== "object" || depth > 4) return record;
  const candidates = [record];
  for (const value of Object.values(record)) {
    if (Array.isArray(value)) candidates.push(...value.filter((item) => item && typeof item === "object"));
    else if (value && typeof value === "object") candidates.push(value);
  }
  const scored = candidates.map((candidate) => {
    const keys = Object.keys(candidate || {}).map((key) => key.toLowerCase());
    const score = hints.reduce((total, hint) => total + keys.filter((key) => key.includes(hint)).length, 0);
    return { candidate, score };
  }).sort((left, right) => right.score - left.score);
  const best = scored[0];
  if (!best || best.score === 0 || best.candidate === record) return record;
  return recordWithFields(best.candidate, hints, depth + 1);
}

function recordsFrom(payload, nestedKeys = []) {
  const containers = [
    payload?.data,
    payload?.results,
    payload?.items,
    ...nestedKeys.flatMap((key) => [payload?.[key], payload?.data?.[key]]),
    payload
  ];
  for (const container of containers) {
    if (Array.isArray(container)) return container.filter((record) => record && typeof record === "object");
  }
  for (const container of containers) {
    if (container && typeof container === "object") return [container];
  }
  return [];
}

async function requestEulerpool(pathname, label) {
  const requestUrl = new URL(pathname, apiOrigin);
  const response = await fetch(requestUrl, {
    headers: {
      Accept: "application/json",
      Authorization: "Bearer " + apiKey,
      "User-Agent": "AgenticEconomyDashboard/0.5 (personal research snapshot)"
    }
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error("Eulerpool " + label + " request failed with HTTP " + response.status + ".");
  return payload;
}

function dateFor(record) {
  const explicit = firstText(record, ["date", "fiscalDateEnding", "periodEndDate", "fiscalDate", "asOfDate", "updatedAt"]);
  if (explicit && /^\d{4}-\d{2}-\d{2}/.test(explicit)) return explicit.slice(0, 10);
  const year = firstText(record, ["year", "fiscalYear", "calendarYear"]);
  return year && /^\d{4}$/.test(year) ? year + "-12-31" : null;
}

function selectAnnualEstimate(records) {
  const annualRecords = records.filter((record) => {
    const period = firstText(record, ["periodType", "fiscalPeriod", "period", "frequency"]);
    return !period || /annual|year|fy/i.test(period) || /^\d{4}$/.test(period);
  });
  const candidates = annualRecords.length ? annualRecords : records;
  const dated = candidates
    .map((record) => ({ record, date: dateFor(record) }))
    .filter(({ date }) => Boolean(date))
    .sort((left, right) => left.date.localeCompare(right.date));
  const currentOrForward = dated.find(({ date }) => date >= asOfDate);
  return currentOrForward?.record || dated.at(-1)?.record || candidates[0] || null;
}

function selectLatestRecord(records) {
  const dated = records
    .map((record) => ({ record, date: dateFor(record) }))
    .filter(({ date }) => Boolean(date))
    .sort((left, right) => right.date.localeCompare(left.date));
  return dated[0]?.record || records[0] || null;
}

function fiscalPeriodFor(record) {
  const year = firstText(record, ["year", "fiscalYear", "calendarYear"]) || dateFor(record)?.slice(0, 4);
  if (year && /^\d{4}$/.test(year)) return "FY" + year;
  const period = firstText(record, ["fiscalPeriod", "period", "periodType", "frequency"]);
  return period || "Annual consensus";
}

function normalizeQuote(record) {
  if (!record) return null;
  return {
    price: firstNumber(record, ["price", "last", "lastPrice", "currentPrice", "close", "mid"]),
    marketCap: firstNumber(record, ["marketCap", "marketCapitalization"]),
    timestamp: firstText(record, ["timestamp", "date", "asOfDate", "updatedAt"])
  };
}

function normalizeEstimate(record) {
  if (!record) return null;
  return {
    fiscalPeriod: fiscalPeriodFor(record),
    fiscalDateEnding: dateFor(record),
    revenueConsensus: firstNumber(record, ["revenueEstimate", "revenueMean", "estimatedRevenueAvg", "revenueAvg", "estimatedRevenue", "consensusRevenue"]),
    epsConsensus: firstNumber(record, ["epsEstimate", "epsMean", "estimatedEpsAvg", "epsAvg", "estimatedEps", "consensusEps"]),
    revenueAnalystCount: firstNumber(record, ["revenueAnalysts", "revenueNumberAnalysts", "numberAnalystEstimatedRevenue", "numberOfAnalystsEstimatedRevenue"]),
    epsAnalystCount: firstNumber(record, ["epsAnalysts", "epsNumberAnalysts", "numberAnalystEstimatedEps", "numberOfAnalystsEstimatedEps"])
  };
}

function normalizePriceTarget(record) {
  if (!record) return null;
  const targetRecord = recordWithFields(record, ["target", "consensus", "mean", "average", "median", "high", "low"]);
  return {
    consensus: firstNumber(targetRecord, ["consensus", "targetConsensus", "priceTargetConsensus", "price_target_consensus", "targetMean", "meanTarget", "targetAverage", "averageTarget", "mean", "average", "avg", "priceTargetMean", "meanPriceTarget", "priceTarget"]),
    median: firstNumber(targetRecord, ["median", "targetMedian", "priceTargetMedian", "medianPriceTarget", "target_median"]),
    high: firstNumber(targetRecord, ["high", "targetHigh", "priceTargetHigh", "highPriceTarget", "target_high"]),
    low: firstNumber(targetRecord, ["low", "targetLow", "priceTargetLow", "lowPriceTarget", "target_low"])
  };
}

function normalizeRecord(ticker, quoteRecords, estimateRecords, targetRecords) {
  const quote = normalizeQuote(selectLatestRecord(quoteRecords));
  const annualEstimate = normalizeEstimate(selectAnnualEstimate(estimateRecords));
  const priceTarget = normalizePriceTarget(selectLatestRecord(targetRecords));
  const price = quote?.price;
  const eps = annualEstimate?.epsConsensus;
  const target = priceTarget?.consensus;
  const forwardPriceEarnings = price !== null && price !== undefined && eps !== null && eps !== undefined && eps > 0 ? Number((price / eps).toFixed(2)) : null;
  const targetUpsidePercent = price !== null && price !== undefined && price > 0 && target !== null && target !== undefined ? Number((((target / price) - 1) * 100).toFixed(2)) : null;

  return {
    ticker,
    status: "observed",
    asOfDate,
    quote,
    annualEstimate,
    priceTarget,
    availability: {
      quote: quoteRecords.length > 0,
      annualEstimate: estimateRecords.length > 0,
      priceTarget: targetRecords.length > 0
    },
    derived: {
      forwardPriceEarnings,
      targetUpsidePercent
    }
  };
}

function requestResultSummary(label, result) {
  if (result.status === "fulfilled") return label + " returned usable response data";
  const message = result.reason instanceof Error ? result.reason.message : "unknown request failure";
  return label + " failed: " + message;
}

async function loadTicker(ticker) {
  const profileResult = await Promise.allSettled([
    requestEulerpool("/api/1/equity/profile/" + encodeURIComponent(ticker), "equity profile")
  ]);
  const profileRecords = profileResult[0].status === "fulfilled" ? recordsFrom(profileResult[0].value, ["profile", "profiles"]) : [];
  const identifier = firstText(profileRecords[0], ["isin", "ISIN", "securityIdentifier"]) || ticker;
  const [quoteResult, estimateResult, targetResult] = await Promise.allSettled([
    requestEulerpool("/api/1/market/last-quote/" + encodeURIComponent(ticker), "last quote"),
    requestEulerpool("/api/1/equity/estimates/" + encodeURIComponent(identifier), "analyst estimates"),
    requestEulerpool("/api/1/equity/price-target-consensus/" + encodeURIComponent(identifier), "price-target consensus")
  ]);

  const quoteRecords = quoteResult.status === "fulfilled" ? recordsFrom(quoteResult.value, ["quote", "quotes"]) : [];
  const estimateRecords = estimateResult.status === "fulfilled" ? recordsFrom(estimateResult.value, ["estimates", "annualEstimates"]) : [];
  const targetRecords = targetResult.status === "fulfilled" ? recordsFrom(targetResult.value, ["priceTargetConsensus", "targets", "priceTargets"]) : [];
  if (!quoteRecords.length && !estimateRecords.length && !targetRecords.length) {
    throw new Error("Eulerpool did not return usable data for " + ticker + ". " + [
      requestResultSummary("Quote", quoteResult),
      requestResultSummary("Analyst estimates", estimateResult),
      requestResultSummary("Price targets", targetResult)
    ].join(" | "));
  }
  return normalizeRecord(ticker, quoteRecords, estimateRecords, targetRecords);
}

const expectationData = JSON.parse(await readFile(expectationPath, "utf8"));
const tickers = [...new Set((expectationData.rows || []).map((row) => String(row.ticker || "").trim()).filter(Boolean))];
if (!tickers.length) throw new Error("No expectation-row tickers are configured.");

const results = await Promise.allSettled(tickers.map(loadTicker));
const rows = [];
const unavailableSymbols = [];
results.forEach((result, index) => {
  if (result.status === "fulfilled") rows.push(result.value);
  else unavailableSymbols.push(tickers[index]);
});
if (!rows.length) {
  const failures = results
    .map((result) => result.status === "rejected" ? (result.reason instanceof Error ? result.reason.message : "unknown ticker request failure") : null)
    .filter(Boolean);
  throw new Error("Eulerpool did not return any usable watchlist records. " + failures.join(" || "));
}

const snapshot = {
  provider: {
    id: "eulerpool",
    name: "Eulerpool",
    sourceLabel: "Data by Eulerpool",
    sourceUrl: "https://eulerpool.com/",
    attributionText: "Data by Eulerpool",
    attributionUrl: "https://eulerpool.com/",
    documentationUrl,
    quoteDocumentationUrl,
    estimateDocumentationUrl,
    priceTargetDocumentationUrl,
    retrievedAt,
    displayStatus: "Owner-confirmed non-commercial personal daily static snapshot with required public attribution.",
    retention: "Current normalized snapshot only; no raw response and no vendor-data history are stored in this repository.",
    marketDataTiming: "Free-plan quote fields may be end-of-day or delayed; do not treat this as real-time market data."
  },
  asOfDate,
  methodology: "For each current Gap Readiness ticker, this snapshot requests Eulerpool's last-quote, analyst-estimates, and price-target-consensus endpoints. It selects a current or forward annual estimate when the provider identifies one. Forward P/E is calculated only as quote price divided by positive provider-supplied consensus EPS. Price-target data is retained as supplemental context, not a gap conclusion. The provider's EPS convention is displayed as supplied; management guidance is not merged with consensus automatically, and fiscal-period alignment remains a human review step. This current snapshot does not provide a revision or valuation-history series.",
  requestedSymbols: tickers,
  unavailableSymbols,
  rows
};

await mkdir(processedDirectory, { recursive: true });
await writeFile(outputPath, JSON.stringify(snapshot, null, 2) + "\n");
console.log("Stored current Eulerpool market-expectations snapshot for " + rows.map((row) => row.ticker).join(", ") + ".");
