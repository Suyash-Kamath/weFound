import crypto from "crypto";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// This module must be the first import of src/index.js. ES module imports run
// before the importing file's body, so loading .env anywhere later means other
// modules would read process.env before it is populated.
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load server/.env first, then repo root .env as fallback
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

export const isProduction = process.env.NODE_ENV === "production";

if (!process.env.JWT_SECRET) {
  // Never fall back to a known secret: anyone could forge login tokens with it.
  // A random per-process secret keeps tokens unforgeable; sessions just end on restart.
  process.env.JWT_SECRET = crypto.randomBytes(48).toString("hex");
  // eslint-disable-next-line no-console
  console.warn("JWT_SECRET is not set. Using a random secret, so users are logged out whenever the server restarts.");
}
