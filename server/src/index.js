// Must stay the first import: it loads .env before any other module reads process.env.
import "./config/env.js";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import http from "http";
import { Server } from "socket.io";
import { connectDb } from "./config/db.js";
import routes from "./routes/index.js";
import { attachChatSocket } from "./realtime/chatSocket.js";
import { errorHandler, notFoundHandler } from "./middleware/errors.js";

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5050;
// Comma-separated list, e.g. "https://wefound.vercel.app,http://localhost:5173"
const CLIENT_ORIGINS = (process.env.CLIENT_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/wefound";

// Hosts like Render/Railway/Heroku sit behind one proxy; this makes req.ip the
// real client IP so rate limits apply per user instead of to everyone at once.
app.set("trust proxy", process.env.TRUST_PROXY === "false" ? false : 1);

app.use(cors({ origin: CLIENT_ORIGINS, credentials: true }));
app.use(helmet());
app.use(express.json({ limit: "2mb" }));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

app.get("/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

app.use("/", routes);
app.use(notFoundHandler);
app.use(errorHandler);

const io = new Server(server, {
  cors: { origin: CLIENT_ORIGINS, credentials: true },
});
app.set("io", io);
attachChatSocket(io);

// Last line of defence: log stray promise rejections instead of letting one
// bad request take the whole server down.
process.on("unhandledRejection", (error) => {
  // eslint-disable-next-line no-console
  console.error("Unhandled promise rejection:", error);
});

connectDb(MONGODB_URI)
  .then(() => {
    server.listen(PORT, () => {
      // eslint-disable-next-line no-console
      console.log(`weFound API running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error("MongoDB connection failed", error);
    process.exit(1);
  });
