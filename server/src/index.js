import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { connectDb } from "./config/db.js";
import routes from "./routes/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// eslint-disable-next-line no-console
console.log("Server cwd:", process.cwd());
// eslint-disable-next-line no-console
console.log("Server __dirname:", __dirname);
// eslint-disable-next-line no-console
console.log("Loading env from:", path.resolve(__dirname, "../.env"));
// Load server/.env first, then repo root .env as fallback
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const app = express();
const PORT = process.env.PORT || 5050;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/wefound";
// eslint-disable-next-line no-console
console.log("SMTP env loaded:", {
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: process.env.SMTP_PORT,
  SMTP_SECURE: process.env.SMTP_SECURE,
  SMTP_USER_SET: Boolean(process.env.SMTP_USER),
  SMTP_PASS_SET: Boolean(process.env.SMTP_PASS),
});

app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }));
app.use(helmet());
app.use(express.json({ limit: "2mb" }));
app.use(morgan("dev"));

app.get("/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

app.use("/", routes);

connectDb(MONGODB_URI)
  .then(() => {
    app.listen(PORT, () => {
      // eslint-disable-next-line no-console
      console.log(`weFound API running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error("MongoDB connection failed", error);
    process.exit(1);
  });
