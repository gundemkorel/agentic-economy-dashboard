import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const hurdle = JSON.parse(readFileSync(new URL("../data/manual/akam-deal-hurdle.json", import.meta.url), "utf8"));
const map = JSON.parse(readFileSync(new URL("../data/manual/agentic-economics-map.json", import.meta.url), "utf8"));
const akam = map.companies.find((company) => company.ticker === "AKAM");
const positive = (value) => typeof value === "number" && Number.isFinite(value) && value > 0;
const present = (value) => typeof value === "string" && value.trim().length > 0;

assert.match(hurdle.asOfDate, /^\d{4}-\d{2}-\d{2}$/);
for (const field of ["title", "classification", "definition", "condition", "interpretation", "nextProof"]) {
  assert.ok(present(hurdle[field]), "Missing " + field);
}
assert.ok(positive(hurdle.contractedRevenueBillions));
assert.ok(positive(hurdle.plannedCapexBillions));
assert.ok(positive(hurdle.extraCapexStressBillions));
assert.ok(hurdle.plannedCapexBillions < hurdle.contractedRevenueBillions);
assert.ok(Array.isArray(hurdle.retentionScenariosPercent) && hurdle.retentionScenariosPercent.length >= 3);
assert.ok(hurdle.retentionScenariosPercent.every((value) => positive(value) && value <= 100));
assert.ok(hurdle.retentionScenariosPercent.every((value, index, values) => index === 0 || value > values[index - 1]));
assert.ok(hurdle.sources.length >= 2);
assert.ok(hurdle.sources.every((source) => present(source.label) && source.url.startsWith("https://")));
assert.ok(akam && akam.materiality.type === "project", "AKAM must remain a project-cash mechanism");
assert.equal(hurdle.contractedRevenueBillions * 1000, akam.materiality.contractMillions);
assert.equal(hurdle.plannedCapexBillions * 1000, akam.materiality.capexMillions);

const threshold = (capex) => capex / hurdle.contractedRevenueBillions * 100;
const surplus = (retention, capex) => hurdle.contractedRevenueBillions * retention / 100 - capex;
assert.equal(threshold(hurdle.plannedCapexBillions).toFixed(1), "47.4");
assert.equal(threshold(hurdle.plannedCapexBillions + hurdle.extraCapexStressBillions).toFixed(1), "56.0");
assert.equal(surplus(40, hurdle.plannedCapexBillions).toFixed(2), "-0.86");
assert.equal(surplus(50, hurdle.plannedCapexBillions).toFixed(2), "0.30");
assert.equal(surplus(60, hurdle.plannedCapexBillions).toFixed(2), "1.46");
assert.match(hurdle.interpretation, /not an IRR, NPV/);

console.log("AKAM nominal cash-recovery hurdle valid: 47.4% base, 56.0% extra-capex stress.");
