import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const apiKey = process.env.FMP_API_KEY?.trim();
const publicDisplayApproved = process.env.FMP_PUBLIC_DISPLAY_APPROVED?.trim().toLowerCase() === "true";

if (!apiKey) {
  throw new Error("FMP_API_KEY is required. Store it as a GitHub Actions secret; never put it in this repository or the public site.");
}

if (!publicDisplayApproved) {
  throw new Error("FMP_PUBLIC_DISPLAY_APPROVED=true is required after written FMP public-display and retention rights are confirmed.");
}

const root = process.cwd();
const expectationPath = path.join(root, "data", "manual", "expectations-gap.json");
const processedDirectory = path.join(root, "data", "processed");
const outputPath = path.join(processedDirectory, "fmp-market-expectations.json");
const retrievedAt = new Date().toISOString();
const asOfDate = retrievedAt.slice(0, 10);
const apiOrigin = "https://financialmodelingprep.com";
const estimateDocumentationUrl = "https://site.financialmodelingprep.com/developer/docs/stable/financial-estimates";
const priceTargetDocumentationUrl = "https://site.financialmodelingprep.com/developer/docs/stable/price-target-consensus";

const asFiniteNumber = (value) => {
  if (value === null || value === undefined || value === "") return null;
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

function recordsFrom(payload, label) {
  if (!Array.isArray(payload)) throw new Error(label + " did not return a record array.");
  return payload;
}

async function requestFmp(pathname, parameters) {
  const requestUrl = new URL(pathname, apiOrigin);
  Object.entries(parameters).forEach(([key, value]) => requestUrl.searchParams.set(key, String(value)));
  requestUrl.searchParams.set("apikey", apiKey);

  const response = await fetch(requestUrl, {
    headers: { "User-Agent": "AgenticEconomyDashboard/0.4 (licensed research display pipeline)" }
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error("FMP " + pathname + " request failed with HTTP " + response.status + ".");
  return recordsFrom(payload, "FMP " + pathname);
}

function dateFor(record) {
  return firstText(record, ["date", "fiscalDateEnding", "periodEndDate", "fiscalDate"]);
}

function selectAnnualEstimate(records) {
  const dated = records
    .map((record) => ({ record, date: dateFor(record) }))
    .filter(({ date }) => Boolean(date))
    .sort((left, right) => left.date.localeCompare(right.date));
  const nextOrCurrent = dated.find(({ date }) => date >= asOfDate);
  return nextOrCurrent?.record || dated.at(-1)?.record || records[0] || null;
}

function fiscalPeriodFor(record) {
  const explicitPeriod = firstText(record, ["fiscalPeriod", "period", "periodType"]);
  const year = firstText(record, ["fiscalYear", "calendarYear"]) || dateFor(record)?.slice(0, 4);
  if (year && /^\d{4}$/.test(year)) return "FY" + year;
  return explicitPeriod || "Annual";
}

function normalizeEstimate(record) {
  if (!record) return null;
  return {
    fiscalPeriod: fiscalPeriodFor(record),
    fiscalDateEnding: dateFor(record),
    revenueConsensus: firstNumber(record, ["estimatedRevenueAvg", "revenueAvg", "estimatedRevenue", "revenueMean", "consensusRevenue"]),
    epsConsensus: firstNumber(record, ["estimatedEpsAvg", "epsAvg", "estimatedEps", "epsMean", "consensusEps"]),
    revenueAnalystCount: firstNumber(record, ["numberAnalystEstimatedRevenue", "numberAnalystsEstimatedRevenue", "numberOfAnalystsEstimatedRevenue", "revenueNumberAnalysts"]),
    epsAnalystCount: firstNumber(record, ["numberAnalystEstimatedEps", "numberAnalystsEstimatedEps", "numberOfAnalystsEstimatedEps", "epsNumberAnalysts"])
  };
}

function normalizeQuote(record) {
  if (!record) return null;
  return {
    price: firstNumber(record, ["price", "previousClose"]),
    marketCap: firstNumber(record, ["marketCap"]),
    timestamp: firstText(record, ["timestamp", "date"])
  };
}

function normalizePriceTarget(record) {
  if (!record) return null;
  return {
    consensus: firstNumber(record, ["targetConsensus", "consensus", "priceTargetConsensus"]),
    median: firstNumber(record, ["targetMedian", "median", "priceTargetMedian"]),
    high: firstNumber(record, ["targetHigh", "high", "priceTargetHigh"]),
    low: firstNumber(record, ["targetLow", "low", "priceTargetLow"])
  };
}

function normalizeRecord(ticker, quoteRecords, estimateRecords, priceTargetRecords) {
  const quote = normalizeQuote(quoteRecords[0]);
  const annualEstimate = normalizeEstimate(selectAnnualEstimate(estimateRecords));
  const priceTarget = normalizePriceTarget(priceTargetRecords[0]);
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
    derived: {
      forwardPriceEarnings,
      targetUpsidePercent
    }
  };
}

function requestResultSummary(label, result) {
  if (result.status === "fulfilled") return label + " returned " + result.value.length + " record" + (result.value.length === 1 ? "" : "s");
  const message = result.reason instanceof Error ? result.reason.message : "unknown request failure";
  return label + " failed: " + message;
}

async function loadTicker(ticker) {
  const [quoteResult, estimateResult, targetResult] = await Promise.allSettled([
    requestFmp("/stable/quote", { symbol: ticker }),
    requestFmp("/stable/analyst-estimates", { symbol: ticker, period: "annual", page: 0, limit: 10 }),
    requestFmp("/stable/price-target-consensus", { symbol: ticker })
  ]);

  const quoteRecords = quoteResult.status === "fulfilled" ? quoteResult.value : [];
  const estimateRecords = estimateResult.status === "fulfilled" ? estimateResult.value : [];
  const targetRecords = targetResult.status === "fulfilled" ? targetResult.value : [];
  if (!quoteRecords.length && !estimateRecords.length && !targetRecords.length) {
    throw new Error("FMP did not return usable data for " + ticker + ". " + [
      requestResultSummary("Quote", quoteResult),
      requestResultSummary("Annual estimates", estimateResult),
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
  throw new Error("FMP did not return any usable watchlist records. " + failures.join(" || "));
}

const snapshot = {
  provider: {
    id: "fmp",
    name: "Financial Modeling Prep",
    sourceLabel: "FMP analyst-estimate and price-target documentation",
    sourceUrl: estimateDocumentationUrl,
    priceTargetDocumentationUrl,
    retrievedAt,
    displayStatus: "Published only after protected public-display approval gate",
    retention: "Current normalized snapshot only; no raw response and no historical FMP archive are stored in this repository."
  },
  asOfDate,
  methodology: "For each current Expectations Gap ticker, this snapshot requests the FMP annual analyst-estimates, quote, and price-target-consensus endpoints. It selects the nearest current or future dated annual estimate when dated records are returned. Forward P/E is calculated only as current quote price divided by positive annual consensus EPS. Price-target upside is a mechanical comparison to the quote, not an investment conclusion. Management guidance is not merged with consensus automatically; fiscal-period alignment remains a human review step.",
  requestedSymbols: tickers,
  unavailableSymbols,
  rows
};

await mkdir(processedDirectory, { recursive: true });
await writeFile(outputPath, JSON.stringify(snapshot, null, 2) + "\n");
console.log("Stored current licensed FMP expectation snapshot for " + rows.map((row) => row.ticker).join(", ") + ".");
