import express from "express";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── Load Data ───────────────────────────────────────────────────────────────

const patients = JSON.parse(
  readFileSync(join(__dirname, "data/patients.json"), "utf-8")
);
const treatplans = JSON.parse(
  readFileSync(join(__dirname, "data/treatplans.json"), "utf-8")
);
const proctps = JSON.parse(
  readFileSync(join(__dirname, "data/proctps.json"), "utf-8")
);
const appointments = JSON.parse(
  readFileSync(join(__dirname, "data/appointments.json"), "utf-8")
);
const providers = JSON.parse(
  readFileSync(join(__dirname, "data/providers.json"), "utf-8")
);

// ─── Auth ────────────────────────────────────────────────────────────────────

// Accept any ODFHIR token — this is a mock server.
// But reject requests with no auth header so the connector's auth logic gets tested.
const VALID_DEVELOPER_KEY = "mock-dev-key";
const VALID_CUSTOMER_KEY = "mock-customer-key";

function authenticate(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("ODFHIR ")) {
    return res.status(401).json({ error: "Missing or invalid Authorization header" });
  }
  // Parse "ODFHIR devKey/custKey" or "ODFHIR custKey"
  const token = auth.slice("ODFHIR ".length);
  const parts = token.split("/");

  if (parts.length === 2) {
    // developer_key / customer_key format
    if (parts[0] !== VALID_DEVELOPER_KEY || parts[1] !== VALID_CUSTOMER_KEY) {
      return res.status(401).json({ error: "Invalid API credentials" });
    }
  } else if (parts.length === 1) {
    // customer_key only
    if (parts[0] !== VALID_CUSTOMER_KEY) {
      return res.status(401).json({ error: "Invalid API credentials" });
    }
  } else {
    return res.status(401).json({ error: "Malformed Authorization header" });
  }

  next();
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Parse an OD-style datetime "yyyy-MM-dd HH:mm:ss" to a Date.
 * Falls back to epoch if unparseable.
 */
function parseOdDateTime(dt) {
  if (!dt) return new Date(0);
  const d = new Date(dt.replace(" ", "T") + "Z");
  return isNaN(d.getTime()) ? new Date(0) : d;
}

/**
 * Filter records by a timestamp field >= the cursor value.
 * OD API uses DateTStamp / SecDateTEdit as cursor params.
 */
function filterByCursor(records, cursorValue, timestampField) {
  if (!cursorValue) return records;
  const cursorDate = new Date(cursorValue);
  if (isNaN(cursorDate.getTime())) return records;
  return records.filter((r) => parseOdDateTime(r[timestampField]) >= cursorDate);
}

// ─── App ─────────────────────────────────────────────────────────────────────

const app = express();
app.use(express.json());

// Add simulated latency (like a real API)
app.use((req, res, next) => {
  const delay = 50 + Math.random() * 150; // 50-200ms
  setTimeout(next, delay);
});

// Health check (no auth required)
app.get("/api/v1/health", (req, res) => {
  res.json({ status: "ok", server: "mock-open-dental", version: "1.0.0" });
});

// All API routes require auth
app.use("/api/v1", authenticate);

// ─── Patients ────────────────────────────────────────────────────────────────

// GET /api/v1/patients — used by testConnection (with ?limit=1)
app.get("/api/v1/patients", (req, res) => {
  const { limit, DateTStamp } = req.query;

  let result = filterByCursor(patients, DateTStamp, "DateTStamp");

  if (limit) {
    result = result.slice(0, parseInt(limit, 10));
  }

  console.log(`[GET /patients] DateTStamp=${DateTStamp || "none"} limit=${limit || "none"} → ${result.length} records`);
  res.json(result);
});

// GET /api/v1/patients/Simple — used by fetchPatients
app.get("/api/v1/patients/Simple", (req, res) => {
  const { DateTStamp } = req.query;

  // "Simple" endpoint returns the same data in OD, just fewer fields.
  // For mock purposes we return the full record (connector only reads what it needs).
  const result = filterByCursor(patients, DateTStamp, "DateTStamp");

  console.log(`[GET /patients/Simple] DateTStamp=${DateTStamp || "none"} → ${result.length} records`);
  res.json(result);
});

// ─── Treatment Plans ────────────────────────────────────────────────────────

app.get("/api/v1/treatplans", (req, res) => {
  const { SecDateTEdit } = req.query;

  const result = filterByCursor(treatplans, SecDateTEdit, "SecDateTEdit");

  console.log(`[GET /treatplans] SecDateTEdit=${SecDateTEdit || "none"} → ${result.length} records`);
  res.json(result);
});

// ─── Procedure TPs (line items per treatment plan) ──────────────────────────

app.get("/api/v1/proctps", (req, res) => {
  const { TreatPlanNum } = req.query;

  if (!TreatPlanNum) {
    // If no filter, return all proctps as a flat array
    const all = Object.values(proctps).flat();
    console.log(`[GET /proctps] no filter → ${all.length} records`);
    return res.json(all);
  }

  const result = proctps[TreatPlanNum] || [];
  console.log(`[GET /proctps] TreatPlanNum=${TreatPlanNum} → ${result.length} records`);
  res.json(result);
});

// ─── Appointments ───────────────────────────────────────────────────────────

app.get("/api/v1/appointments", (req, res) => {
  const { DateTStamp } = req.query;

  const result = filterByCursor(appointments, DateTStamp, "DateTStamp");

  console.log(`[GET /appointments] DateTStamp=${DateTStamp || "none"} → ${result.length} records`);
  res.json(result);
});

// ─── Providers ─────────────────────────────────────────────────────────────

app.get("/api/v1/providers", (req, res) => {
  // Providers endpoint returns all providers (small dataset, no cursor)
  console.log(`[GET /providers] → ${providers.length} records`);
  res.json(providers);
});

// ─── 404 catch-all ──────────────────────────────────────────────────────────

app.use("/api/v1/*", (req, res) => {
  console.log(`[404] ${req.method} ${req.originalUrl}`);
  res.status(404).json({ error: `Endpoint not found: ${req.originalUrl}` });
});

// ─── Start ──────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 4100;
app.listen(PORT, () => {
  console.log(`\n🦷 Mock OpenDental API running on http://localhost:${PORT}/api/v1`);
  console.log(`\n   Auth credentials:`);
  console.log(`     Developer Key: ${VALID_DEVELOPER_KEY}`);
  console.log(`     Customer Key:  ${VALID_CUSTOMER_KEY}`);
  console.log(`     Header:        Authorization: ODFHIR ${VALID_DEVELOPER_KEY}/${VALID_CUSTOMER_KEY}`);
  console.log(`\n   Data loaded:`);
  console.log(`     Providers:     ${providers.length}`);
  console.log(`     Patients:      ${patients.length}`);
  console.log(`     Treat Plans:   ${treatplans.length}`);
  console.log(`     Procedures:    ${Object.values(proctps).flat().length}`);
  console.log(`     Appointments:  ${appointments.length}`);
  console.log(`\n   Endpoints:`);
  console.log(`     GET /api/v1/health              (no auth)`);
  console.log(`     GET /api/v1/patients             ?limit=N&DateTStamp=...`);
  console.log(`     GET /api/v1/patients/Simple       ?DateTStamp=...`);
  console.log(`     GET /api/v1/treatplans            ?SecDateTEdit=...`);
  console.log(`     GET /api/v1/proctps               ?TreatPlanNum=...`);
  console.log(`     GET /api/v1/appointments          ?DateTStamp=...`);
  console.log(`     GET /api/v1/providers`);
  console.log(``);
});
