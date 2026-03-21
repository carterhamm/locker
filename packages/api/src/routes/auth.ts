import { Router } from "express";

export const authRouter = Router();

// Placeholder — will implement in auth task
authRouter.post("/register", (_req, res) => {
  res.status(501).json({ error: "Not implemented" });
});

authRouter.post("/login", (_req, res) => {
  res.status(501).json({ error: "Not implemented" });
});

authRouter.post("/logout", (_req, res) => {
  res.status(501).json({ error: "Not implemented" });
});
