import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const map = JSON.parse(readFileSync(new URL("../data/manual/agentic-economics-map.json", import.meta.url), "utf8"));
const present = (value) => typeof value === "string" && value.trim().length > 0;
const positive = (value) => typeof value === "number" && Number.isFinite(value) && value > 0;

assert.match(map.asOfDate, /^\d{4}-\d{2}-\d{2}$/);
assert.ok(present(map.status) && present(map.purpose));
assert.equal(map.gates.length, 3);
assert.equal(map.priorityTests.length, 3);
assert.ok(map.workUnits.length >= 3);
assert.ok(map.layers.length >= 8);
assert.ok(map.companies.length >= 5);
assert.ok(map.methodology.length >= 3);

const tickers = new Set();
const priorityIds = new Set();
for (const test of map.priorityTests) {
  assert.ok(present(test.id) && !priorityIds.has(test.id), `Duplicate or missing priority test id: ${test.id}`);
  priorityIds.add(test.id);
  for (const field of ["title", "state", "observed", "missing", "nextEvidence"]) {
    assert.ok(present(test[field]), `${test.id}: missing ${field}`);
  }
  assert.ok(test.sources.length >= 2, `${test.id}: at least two sources required`);
  for (const source of test.sources) {
    assert.ok(present(source.label) && source.url.startsWith("https://"), `${test.id}: invalid source`);
  }
}
for (const company of map.companies) {
  assert.ok(present(company.ticker) && !tickers.has(company.ticker), `Duplicate or missing ticker: ${company.ticker}`);
  tickers.add(company.ticker);
  for (const field of ["name", "lens", "priority", "workUnit", "resource", "paidUnit", "observed", "cashUnknown", "breaker", "nextTest", "expectations"]) {
    assert.ok(present(company[field]), `${company.ticker}: missing ${field}`);
  }
  assert.ok(company.sources.length >= 2, `${company.ticker}: at least two sources required`);
  for (const source of company.sources) {
    assert.ok(present(source.label) && source.url.startsWith("https://"), `${company.ticker}: invalid source`);
  }
  assert.match(company.expectations.toLowerCase(), /no |not |unproven|unverified/, `${company.ticker}: do not imply a proven gap without a dated model pair`);

  const m = company.materiality;
  assert.ok(["project", "unit", "revenue", "outcome-range"].includes(m.type), `${company.ticker}: unknown materiality type`);
  assert.ok(["USD", "GBP"].includes(m.currency) && present(m.note), `${company.ticker}: missing materiality notes`);
  if (m.type === "project") {
    assert.ok(positive(m.contractMillions) && positive(m.capexMillions), `${company.ticker}: invalid project values`);
    assert.ok(m.capexMillions < m.contractMillions, `${company.ticker}: capital recovery exceeds contractual payments`);
    continue;
  }
  assert.ok(present(m.basis) && positive(m.baselineMillions) && m.targetPercent === 5, `${company.ticker}: invalid 5% baseline`);
  assert.ok(positive(m.assumedCashConversion) && m.assumedCashConversion <= 1, `${company.ticker}: invalid cash conversion`);
  if (m.type === "unit") assert.ok(positive(m.pricePerUnit) && present(m.unit), `${company.ticker}: invalid unit assumptions`);
  if (m.type === "revenue") assert.ok(present(m.period), `${company.ticker}: missing revenue period`);
  if (m.type === "outcome-range") {
    assert.ok(positive(m.assumedCommission) && m.feeRateLow > 0 && m.feeRateHigh <= 1 && m.feeRateLow < m.feeRateHigh && present(m.unit), `${company.ticker}: invalid outcome range`);
  }
}

console.log(`Economic map valid: ${map.layers.length} layers, ${map.companies.length} company mechanisms, ${tickers.size} unique tickers.`);
