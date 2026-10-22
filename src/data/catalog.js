// Product catalog — language-neutral data only.
//
// HOW TO FILL IN (browser, recommended):
//   open http://localhost:8080/admin  ->  fill the table  ->  保存并发布
//   (values are stored in data/catalog.json and overwrite the defaults here)
//
// Or edit this file directly and rebuild: node build.js
//
// The model codes below are PLACEHOLDERS following a typical size ladder.
// Replace them with the codes printed in your brochure / quotation sheet —
// buyers quote these codes back to you, so they must match exactly.
//
// Empty values render as "—" with a "pending" banner on the page.
// Never put estimated or rounded-up numbers here: buyers check these.

const SERIES = [
  {
    key: "air",
    slug: "air-cooled-chiller",
    models: ["AC-03", "AC-05", "AC-08", "AC-10", "AC-15", "AC-20"],
    spec: {},
  },
  {
    key: "water",
    slug: "water-cooled-chiller",
    models: ["WC-10", "WC-20", "WC-30", "WC-50", "WC-80", "WC-100"],
    spec: {},
  },
  {
    key: "low",
    slug: "low-temp-chiller",
    models: ["LT-03", "LT-05", "LT-08", "LT-10", "LT-15", "LT-20"],
    spec: {},
  },
  {
    key: "screw",
    slug: "screw-chiller",
    models: ["SC-30", "SC-60", "SC-100", "SC-150", "SC-200", "SC-300"],
    spec: {},
  },
];

// Spec sheet rows, in the order engineers expect to read them.
// unit is language-neutral (kW / kcal/h / m³/h / mm / kg / V).
// "kcal" carries the same cooling capacity expressed in kcal/h — buyers in
// some markets quote it that way, so publishing both avoids them doing math.
const SPEC_FIELDS = [
  { key: "capacity", unit: "kW" },
  { key: "kcal", unit: "" },
  { key: "compressor", unit: "kW" },
  { key: "pump", unit: "kW" },
  { key: "power", unit: "kW" },
  { key: "flow", unit: "m³/h" },
  { key: "voltage", unit: "" },
  { key: "refrigerant", unit: "" },
  { key: "dim", unit: "mm" },
  { key: "weight", unit: "kg" },
];

// Selection rules for the sizing calculator.
// Coefficients are industry rule-of-thumb ranges, deliberately returned as a
// RANGE and labelled as an estimate on the page.
//   inj   : kW of cooling per ton of clamping force
//   blow  : kW per kg/h of output
//   extr  : kW = (screw_mm / 10)^2 * k
//   rub   : kW per kg/h of compound
//   laser : kW of cooling per kW of laser output
const RULES = {
  inj: { input: "tonnage", k: [0.055, 0.075] },
  blow: { input: "output", k: [0.22, 0.3] },
  extr: { input: "screw", k: [0.25, 0.4] },
  rub: { input: "output", k: [0.3, 0.45] },
  laser: { input: "laser", k: [2.6, 3.2] },
};

// Conditions that push the required capacity up.
const CORRECTIONS = [
  { key: "ambient", factor: 1.15 },
  { key: "altitude", factor: 1.08 },
  { key: "intermittent", factor: 0.85 },
  { key: "fullload", factor: 1.1 },
];

// Chilled-water outlet temperature correction. Industry nominal ratings are
// quoted at 7°C outlet; colder water means less capacity from the same
// machine (evaporator temperature drops). At or below 0°C the customer needs
// a low-temp/glycol machine — the calculator forces that recommendation.
// factor multiplies the raw load estimate; 7°C is the baseline (1.0).
const WATER_TEMP = [
  { key: "t12", delta: 12, factor: 0.9 },
  { key: "t7", delta: 7, factor: 1.0 },
  { key: "t0", delta: 0, factor: 1.18 },
  { key: "tm10", delta: -10, factor: 1.45 },
];

// Engineering safety margin applied on top of the corrected load.
const MARGIN = [
  { key: "std", factor: 1.15 },
  { key: "none", factor: 1.0 },
];

module.exports = { SERIES, SPEC_FIELDS, RULES, CORRECTIONS, WATER_TEMP, MARGIN };
