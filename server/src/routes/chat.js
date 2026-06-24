import { Router } from "express";
import { randomUUID } from "node:crypto";
import { runAgentTurn } from "../agent/agentLoop.js";
import { createSession, getSession, appendMessage } from "../utils/sessionStore.js";
import { allCustomers } from "../agent/policyEngine.js";

export const chatRouter = Router();

// Lightweight "login" so the demo can simulate a real customer session without building auth.
chatRouter.get("/customers", (_req, res) => {
  res.json(
    allCustomers.map((c) => ({
      customer_id: c.customer_id,
      name: c.name,
      email: c.email,
      tier: c.tier,
    }))
  );
});

chatRouter.post("/session", (_req, res) => {
  const sessionId = randomUUID();
  createSession(sessionId);
  res.json({ sessionId });
});

chatRouter.get("/session/:id", (req, res) => {
  const session = getSession(req.params.id);
  if (!session) return res.status(404).json({ error: "Session not found" });
  res.json(session);
});

chatRouter.post("/chat", async (req, res) => {
  const { sessionId, message } = req.body || {};
  if (!sessionId || !message || typeof message !== "string") {
    return res.status(400).json({ error: "sessionId and message are required" });
  }

  const session = getSession(sessionId) || createSession(sessionId);

  appendMessage(sessionId, { role: "user", content: message, at: new Date().toISOString() });

  try {
    const { finalText } = await runAgentTurn({
      sessionId,
      history: session.messages
        .slice(0, -1) // exclude the message we just appended; runAgentTurn adds it explicitly
        .map((m) => ({ role: m.role, content: m.content })),
      userMessage: message,
    });

    appendMessage(sessionId, { role: "assistant", content: finalText, at: new Date().toISOString() });
    res.json({ reply: finalText, sessionId });
  } catch (err) {
    console.error("Agent turn failed:", err);
    res.status(500).json({ error: "The agent ran into an unexpected error.", detail: err?.message });
  }
});

export default chatRouter;
