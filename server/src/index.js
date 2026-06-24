import express from "express";
import cors from "cors";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { config } from "./config.js";
import { chatRouter } from "./routes/chat.js";
import { adminRouter } from "./routes/admin.js";
import { logBus } from "./utils/logger.js";

const app = express();
app.use(cors({ origin: config.clientOrigin }));
app.use(express.json());

app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.use("/api", chatRouter);
app.use("/api/admin", adminRouter);

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: config.clientOrigin },
});

io.on("connection", (socket) => {
  // The admin dashboard joins this room to receive every reasoning-log entry in real time,
  // across all customer sessions, as they happen.
  socket.on("admin:subscribe", () => {
    socket.join("admin");
  });
});

logBus.on("entry", (entry) => {
  io.to("admin").emit("log_entry", entry);
});

httpServer.listen(config.port, () => {
  console.log(`Orbiq refund agent server listening on http://localhost:${config.port}`);
});
