import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const buildVersion = process.env.MARKET_SNAPSHOT_VERSION?.trim();
if (!buildVersion || !/^[A-Za-z0-9_-]+$/.test(buildVersion)) {
  throw new Error("MARKET_SNAPSHOT_VERSION is required and may contain only letters, numbers, underscores, and hyphens.");
}

const root = process.cwd();
const appSourcePath = path.join(root, "app.js");
const appSource = await readFile(appSourcePath, "utf8");
if (!appSource.includes("__MARKET_SNAPSHOT_VERSION__")) {
  throw new Error("app.js is missing the market-snapshot version marker.");
}
await writeFile(path.join(root, "app-" + buildVersion + ".js"), appSource.replaceAll("__MARKET_SNAPSHOT_VERSION__", buildVersion));

const htmlFiles = ["index.html", "history.html", "companies.html", "economic-map.html", "earnings.html", "research-queue.html", "expectations.html", "breakers.html", "methodology.html", "models.html", "committee.html"];
await Promise.all(htmlFiles.map(async (file) => {
  const filePath = path.join(root, file);
  const contents = await readFile(filePath, "utf8");
  if (!contents.includes("__MARKET_SNAPSHOT_VERSION__")) {
    throw new Error(file + " is missing the market-snapshot version marker.");
  }
  await writeFile(filePath, contents.replace("app.js?build=__MARKET_SNAPSHOT_VERSION__", "app-" + buildVersion + ".js"));
}));

console.log("Bound market-data asset paths to this deployment.");
