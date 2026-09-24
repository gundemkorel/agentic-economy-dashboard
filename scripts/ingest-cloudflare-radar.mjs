import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const token = process.env.CLOUDFLARE_RADAR_API_TOKEN;
if (!token) {
  throw new Error("CLOUDFLARE_RADAR_API_TOKEN is required. Set it locally or as a GitHub Actions secret.");
}

const endpoint = "https://api.cloudflare.com/client/v4/radar/ai/bots/timeseries";
const root = process.cwd();
const rawDirectory = path.join(root, "data", "raw", "cloudflare-radar");
const processedDirectory = path.join(root, "data", "processed");
const currentPath = path.join(processedDirectory, "cloudflare-ai-bot-current.json");
const historyPath = path.join(processedDirectory, "cloudflare-ai-bot-history.json");
const retrievedAt = new Date().toISOString();

const requestUrl = new URL(endpoint);
requestUrl.searchParams.append("dateRange", "30d");
requestUrl.searchParams.append("dateRange", "30dcontrol");
requestUrl.searchParams.set("aggInterval", "1d");
requestUrl.searchParams.set("format", "json");

const response = await fetch(requestUrl, {
  headers: {
    Authorization: "Bearer " + token,
    "User-Agent": "AgenticEconomyDashboard/0.3 (research data pipeline)"
  }
});
const payload = await response.json();
if (!response.ok || payload.success !== true) {
  const message = payload.errors?.map((error) => error.message).join("; ") || response.statusText;
  throw new Error("Cloudflare Radar request failed: " + response.status + " " + message);
}

const currentSeries = payload.result?.serie_0;
const priorSeries = payload.result?.serie_1;
const metadata = payload.result?.meta;
if (!currentSeries?.timestamps?.length || !currentSeries?.values?.length || !priorSeries?.values?.length || metadata?.normalization !== "MIN0_MAX") {
  throw new Error("Cloudflare Radar response did not contain the expected comparable MIN0_MAX series.");
}

const average = (values) => values.reduce((total, value) => total + Number(value), 0) / values.length;
const currentMean = average(currentSeries.values);
const priorMean = average(priorSeries.values);
const changePercent = priorMean === 0 ? null : ((currentMean / priorMean) - 1) * 100;
const periodRange = metadata.dateRange?.[0] || {};
const asOfDate = currentSeries.timestamps.at(-1).slice(0, 10);
const currentIndex = Number((currentMean * 100).toFixed(1));
const priorIndex = Number((priorMean * 100).toFixed(1));
const formattedChange = changePercent === null ? "No comparable prior window" : (changePercent >= 0 ? "+" : "") + changePercent.toFixed(1) + "% vs prior 30d";
const methodology = "Cloudflare Radar AI bot HTTP request time series. The API returns MIN0_MAX-normalized values rather than raw request counts. This observation is the mean index for the current 30-day window, compared with the preceding 30-day control window in the same API request; it is not all agentic activity or a raw request-volume estimate.";

const observation = {
  metricId: "ai_bot_request_volume",
  metricName: "Cloudflare AI bot traffic index",
  category: "machine_activity",
  value: currentIndex,
  unit: "normalized index (0–100; common 60-day request maximum)",
  displayValue: currentIndex.toFixed(1),
  periodStart: periodRange.startTime,
  periodEnd: periodRange.endTime,
  asOfDate,
  sourceName: "Cloudflare Radar",
  sourceUrl: endpoint,
  sourceType: "token-backed network telemetry",
  retrievalDate: retrievedAt,
  methodology,
  isObserved: true,
  isEstimate: false,
  comparison: {
    basis: "30-day mean index versus preceding 30-day control window in the same request",
    priorValue: priorIndex,
    changePercent: changePercent === null ? null : Number(changePercent.toFixed(1)),
    displayChange: formattedChange
  },
  notes: "MIN0_MAX permits comparison between the two windows returned together, but separate retrievals should not be treated as a raw-volume time series. Cloudflare sees traffic through its own network and AI bot traffic is not synonymous with autonomous agent activity."
};

async function readExistingHistory() {
  try {
    return JSON.parse(await readFile(historyPath, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return { metricId: observation.metricId, observations: [] };
    throw error;
  }
}

const rawSnapshot = {
  sourceName: observation.sourceName,
  sourceUrl: observation.sourceUrl,
  requestUrl: requestUrl.toString(),
  retrievedAt,
  methodology,
  response: payload
};
const history = await readExistingHistory();
history.metricId = observation.metricId;
history.metricName = observation.metricName;
history.category = observation.category;
history.methodology = methodology;
history.observations = history.observations.filter((item) => item.asOfDate !== asOfDate);
history.observations.push(observation);
history.observations.sort((a, b) => a.asOfDate.localeCompare(b.asOfDate));

await mkdir(rawDirectory, { recursive: true });
await mkdir(processedDirectory, { recursive: true });
await writeFile(path.join(rawDirectory, asOfDate + ".json"), JSON.stringify(rawSnapshot, null, 2) + "\n");
await writeFile(currentPath, JSON.stringify(observation, null, 2) + "\n");
await writeFile(historyPath, JSON.stringify(history, null, 2) + "\n");
console.log("Stored Cloudflare AI bot traffic index " + observation.displayValue + " for " + asOfDate + " (" + formattedChange + ").");
