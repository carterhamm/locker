import express from "express";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { requireEnv } from "./config";
import { authRouter } from "./routes/auth";
import { keysRouter } from "./routes/keys";
import { logsRouter } from "./routes/logs";
import { healthRouter } from "./routes/health";
import { authenticate } from "./middleware/auth";
import { errorHandler } from "./middleware/errorHandler";

// Crash immediately if required env vars are missing
const PORT = requireEnv("PORT", "3001");
requireEnv("DATABASE_URL");
requireEnv("MASTER_ENCRYPTION_KEY");
requireEnv("JWT_SECRET");

const app = express();

// [C1] CORS — explicit allowlist, not wildcard
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "").split(",").filter(Boolean);
app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (CLI, MCP, server-to-server)
    if (!origin) return cb(null, true);
    if (ALLOWED_ORIGINS.length === 0 || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    cb(new Error("Not allowed by CORS"));
  },
  credentials: true,
}));

// [L5] Security headers
app.use(helmet());

// [L1] Explicit body size limit
app.use(express.json({ limit: "10kb" }));

// Global rate limit: 100 requests per 15 minutes per IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later" },
});
app.use(globalLimiter);

// Public routes
app.use("/health", healthRouter);
app.use("/auth", authRouter);

// Protected routes — JWT required
app.use("/keys", authenticate, keysRouter);
app.use("/logs", authenticate, logsRouter);

// Error handler
app.use(errorHandler);

app.listen(Number(PORT), () => {
  console.log(`Locker API running on port ${PORT}`);
});

export { app };
