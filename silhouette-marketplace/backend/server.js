// backend/server.js
// ---------------------------------------------------------------------------
// SYSTEM FLOW
//   Browser (Next.js) --POST /api/try-on--> this Express server
//     -> validates input -> calls Fal.ai (fashn v1.6 try-on) with the SECRET key
//     -> returns { imageUrl } to the browser.
// The Fal key lives ONLY here (process.env.FAL_KEY). The browser never sees it.
// ---------------------------------------------------------------------------

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { fal } from "@fal-ai/client";

// 1) Load backend/.env into process.env BEFORE anything reads it.
dotenv.config();

// 2) Fail fast if the secret is missing (better than a confusing 401 later).
if (!process.env.FAL_KEY) {
  console.error("Missing FAL_KEY. Copy backend/.env.example to backend/.env and set it.");
  process.exit(1);
}

// 3) Configure the Fal SDK with the server-side credential.
fal.config({ credentials: process.env.FAL_KEY });

const PORT = Number(process.env.PORT) || 4000;
const TRYON_TIMEOUT_MS = Number(process.env.TRYON_TIMEOUT_MS) || 60_000;
const MODEL_ID = "fal-ai/fashn/v1-6/try-on";

// Only categories we intend to support (fashn also accepts "one-pieces"/"auto").
const ALLOWED_CATEGORIES = new Set(["tops", "bottoms"]);

const app = express();

// 4) CORS: only the configured frontend origin(s) may call the API.
const allowedOrigins = (process.env.FRONTEND_ORIGIN || "http://localhost:3000")
  .split(",")
  .map((o) => o.trim());

app.use(
  cors({
    origin(origin, cb) {
      // Allow same-origin / curl (no Origin header) and whitelisted origins.
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error("Origin not allowed by CORS"));
    },
    methods: ["POST", "GET"],
  })
);

// 5) Body parser. Limit is small: we only accept URLs, never raw files.
app.use(express.json({ limit: "100kb" }));

// Helper: accept only absolute http(s) URLs. Fal must be able to fetch them,
// so localhost / relative paths will NOT work as image sources.
function isHttpUrl(value) {
  if (typeof value !== "string") return false;
  try {
    const u = new URL(value);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

// Health check (handy for deployment platforms)
app.get("/health", (_req, res) => res.json({ ok: true }));

// ---------------------------------------------------------------------------
// POST /api/try-on
// body: { mannequinUrl: string, garmentUrl: string, clothingCategory: "tops"|"bottoms" }
// ---------------------------------------------------------------------------
app.post("/api/try-on", async (req, res) => {
  const { mannequinUrl, garmentUrl, clothingCategory } = req.body ?? {};

  // --- Step A: validate input before spending any API credits ---
  if (!isHttpUrl(mannequinUrl) || !isHttpUrl(garmentUrl)) {
    return res.status(400).json({ error: "mannequinUrl and garmentUrl must be valid http(s) URLs." });
  }
  if (!ALLOWED_CATEGORIES.has(clothingCategory)) {
    return res.status(400).json({ error: 'clothingCategory must be "tops" or "bottoms".' });
  }

  // --- Step B: timeout guard. AbortController cancels the Fal request ---
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TRYON_TIMEOUT_MS);

  try {
    // --- Step C: call the async model. subscribe() submits to Fal's queue
    //     and resolves once the job is COMPLETED (it polls internally). ---
    const result = await fal.subscribe(MODEL_ID, {
      input: {
        model_image: mannequinUrl,
        garment_image: garmentUrl,
        category: clothingCategory,
      },
      abortSignal: controller.signal,
    });

    // --- Step D: extract the final image URL and return it ---
    const imageUrl = result?.data?.images?.[0]?.url;
    if (!imageUrl) {
      return res.status(502).json({ error: "Try-on finished but returned no image." });
    }
    return res.json({ imageUrl });
  } catch (err) {
    // Timeout (our abort) -> 504 so the UI can offer "try again"
    if (controller.signal.aborted || err?.name === "AbortError") {
      return res.status(504).json({ error: "Try-on timed out. Please try again." });
    }
    // Log details server-side only; send a generic message to the client.
    console.error("[try-on] Fal.ai error:", err?.message || err);
    return res.status(502).json({ error: "Try-on service is unavailable right now." });
  } finally {
    clearTimeout(timer); // always clean up the timer
  }
});

// Central error handler (e.g. CORS rejection, malformed JSON)
app.use((err, _req, res, _next) => {
  console.error("[server] ", err.message);
  res.status(err.status || 400).json({ error: err.message || "Bad request" });
});

app.listen(PORT, () => console.log(`Silhouette API listening on http://localhost:${PORT}`));
