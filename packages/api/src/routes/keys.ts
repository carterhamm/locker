import { Router } from "express";

export const keysRouter = Router();

// Placeholder — will implement in keys task
keysRouter.post("/", (_req, res) => {
  res.status(501).json({ error: "Not implemented" });
});

keysRouter.get("/", (_req, res) => {
  res.status(501).json({ error: "Not implemented" });
});

keysRouter.get("/:service", (_req, res) => {
  res.status(501).json({ error: "Not implemented" });
});

keysRouter.delete("/:service", (_req, res) => {
  res.status(501).json({ error: "Not implemented" });
});
