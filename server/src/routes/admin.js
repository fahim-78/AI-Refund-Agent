import { Router } from "express";
import { listSessions, getSession } from "../utils/sessionStore.js";
import { allCustomers, allOrders } from "../agent/policyEngine.js";

export const adminRouter = Router();

adminRouter.get("/sessions", (_req, res) => {
  res.json(listSessions());
});

adminRouter.get("/sessions/:id", (req, res) => {
  const session = getSession(req.params.id);
  if (!session) return res.status(404).json({ error: "Session not found" });
  res.json(session);
});

// Exposes the mock CRM so the admin dashboard can show a "ground truth" panel next to the
// agent's reasoning — handy for the Loom walkthrough to prove the agent isn't hallucinating data.
adminRouter.get("/crm", (_req, res) => {
  res.json({ customers: allCustomers, orders: allOrders });
});

export default adminRouter;
