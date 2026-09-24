import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { gzipSync } from "node:zlib";

const registryUrl = "https://registry.modelcontextprotocol.io/v0.1/servers";
const root = process.cwd();
const rawDirectory = path.join(root, "data", "raw", "mcp-registry");
const processedPath = path.join(root, "data", "processed", "mcp-registry-history.json");
const currentPath = path.join(root, "data", "processed", "mcp-registry-current.json");
const retrievedAt = new Date().toISOString();
const asOfDate = retrievedAt.slice(0, 10);
const pageSize = 100;

async function requestPage(cursor) {
  const url = new URL(registryUrl);
  url.searchParams.set("limit", String(pageSize));
  if (cursor) url.searchParams.set("cursor", cursor);
  const response = await fetch(url, {
    headers: {
      "User-Agent": "AgenticEconomyDashboard/0.2 (research data pipeline)"
    }
  });
  if (!response.ok) throw new Error("MCP Registry request failed: " + response.status + " " + response.statusText);
  return { url: url.toString(), body: await response.json() };
}

async function fetchRegistry() {
  const servers = [];
  const requestUrls = [];
  let cursor;
  do {
    const page = await requestPage(cursor);
    requestUrls.push(page.url);
    servers.push(...page.body.servers);
    cursor = page.body.metadata && page.body.metadata.nextCursor;
  } while (cursor);
  return { servers, requestUrls };
}

async function readExistingHistory() {
  try {
    return JSON.parse(await readFile(processedPath, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return { metricId: "mcp_registered_server_count", observations: [] };
    throw error;
  }
}

const registry = await fetchRegistry();
const rawSnapshot = {
  sourceName: "Model Context Protocol Registry",
  sourceUrl: registryUrl,
  retrievedAt,
  requestUrls: registry.requestUrls,
  methodology: "Counts registered server records returned by the public registry endpoint. This is an observed ecosystem-supply proxy, not a measure of active production usage.",
  serverCount: registry.servers.length,
  servers: registry.servers
};

const observation = {
  metricId: "mcp_registered_server_count",
  metricName: "Registered MCP servers",
  category: "enterprise_adoption_control",
  value: registry.servers.length,
  unit: "registered servers",
  periodStart: asOfDate,
  periodEnd: asOfDate,
  asOfDate,
  sourceName: "Model Context Protocol Registry",
  sourceUrl: registryUrl,
  sourceType: "public registry",
  retrievalDate: retrievedAt,
  methodology: rawSnapshot.methodology,
  isObserved: true,
  isEstimate: false,
  notes: "Do not interpret as production agent activity."
};

const history = await readExistingHistory();
history.metricId = observation.metricId;
history.metricName = observation.metricName;
history.category = observation.category;
history.methodology = observation.methodology;
history.observations = history.observations.filter((item) => item.asOfDate !== asOfDate);
history.observations.push(observation);
history.observations.sort((a, b) => a.asOfDate.localeCompare(b.asOfDate));

await mkdir(rawDirectory, { recursive: true });
await mkdir(path.dirname(processedPath), { recursive: true });
await writeFile(path.join(rawDirectory, asOfDate + ".json.gz"), gzipSync(JSON.stringify(rawSnapshot) + "\n", { level: 9 }));
await writeFile(processedPath, JSON.stringify(history, null, 2) + "\n");
await writeFile(currentPath, JSON.stringify(observation, null, 2) + "\n");
console.log("Stored " + observation.value + " MCP Registry records for " + asOfDate + ".");
