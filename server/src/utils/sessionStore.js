// sessionStore.js
//
// Simple in-memory store, intentionally not a database — this is a demo/take-home project.
// Swapping this for Redis or Postgres would mean implementing the same five functions.

const sessions = new Map();

function ensure(sessionId) {
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, {
      id: sessionId,
      createdAt: new Date().toISOString(),
      messages: [], // chat transcript: {role, content}
      reasoningLog: [], // every log() entry, for admin replay
      decisions: [], // finalized outcomes: approve/deny/escalate
      customerContext: null, // last-known verified customer, for the admin sidebar
    });
  }
  return sessions.get(sessionId);
}

export function createSession(sessionId) {
  return ensure(sessionId);
}

export function getSession(sessionId) {
  return sessions.get(sessionId) || null;
}

export function listSessions() {
  return Array.from(sessions.values())
    .map((s) => ({
      id: s.id,
      createdAt: s.createdAt,
      messageCount: s.messages.length,
      lastDecision: s.decisions[s.decisions.length - 1] || null,
      customerContext: s.customerContext,
    }))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function appendMessage(sessionId, message) {
  const s = ensure(sessionId);
  s.messages.push(message);
  return s;
}

export function appendLog(sessionId, entry) {
  const s = ensure(sessionId);
  s.reasoningLog.push(entry);
  return s;
}

export function appendDecision(sessionId, decision) {
  const s = ensure(sessionId);
  s.decisions.push(decision);
  return s;
}

export function setCustomerContext(sessionId, customer) {
  const s = ensure(sessionId);
  s.customerContext = customer
    ? {
        customer_id: customer.customer_id,
        name: customer.name,
        email: customer.email,
        tier: customer.tier,
        fraud_flag: customer.fraud_flag,
      }
    : null;
  return s;
}

export function deleteSession(sessionId) {
  sessions.delete(sessionId);
}
