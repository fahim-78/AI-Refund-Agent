// logger.js
//
// The agent loop calls `log()` for every step of its reasoning (thinking, tool calls, tool
// results, retries, final decisions). This module just persists each entry to the session
// store and emits it on an EventEmitter — index.js subscribes and forwards entries to the
// admin dashboard over Socket.IO in real time. Keeping this decoupled from Socket.IO means
// the agent loop itself has no knowledge of the transport layer.

import { EventEmitter } from "node:events";
import { appendLog } from "./sessionStore.js";

export const logBus = new EventEmitter();
logBus.setMaxListeners(50);

let counter = 0;

/**
 * @param {string} sessionId
 * @param {"thinking"|"tool_call"|"tool_result"|"retry"|"decision"|"error"|"user_message"|"agent_message"|"system"} type
 * @param {object} payload
 */
export function log(sessionId, type, payload = {}) {
  const entry = {
    id: `log-${Date.now()}-${counter++}`,
    sessionId,
    type,
    payload,
    timestamp: new Date().toISOString(),
  };
  appendLog(sessionId, entry);
  logBus.emit("entry", entry);
  return entry;
}
