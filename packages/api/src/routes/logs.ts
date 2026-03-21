import { Router } from "express";

export const logsRouter = Router();

// Placeholder — will implement in logs task
logsRouter.get("/", (_req, res) => {
  res.status(501).json({ error: "Not implemented" });
});
