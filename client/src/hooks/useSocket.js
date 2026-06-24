import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { API_BASE } from "../api.js";

/**
 * Connects to the server's Socket.IO admin room and streams every reasoning-log entry as it's
 * emitted by the agent loop, across all active sessions.
 */
export function useAdminSocket(onEntry) {
  const [connected, setConnected] = useState(false);
  const callbackRef = useRef(onEntry);
  callbackRef.current = onEntry;

  useEffect(() => {
    const socket = io(API_BASE, { transports: ["websocket", "polling"] });

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("admin:subscribe");
    });
    socket.on("disconnect", () => setConnected(false));
    socket.on("log_entry", (entry) => callbackRef.current?.(entry));

    return () => socket.disconnect();
  }, []);

  return { connected };
}
