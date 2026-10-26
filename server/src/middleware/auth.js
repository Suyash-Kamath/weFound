import jwt from "jsonwebtoken";

// Read lazily so the value set by config/env.js is always the one used.
const getJwtSecret = () => process.env.JWT_SECRET;

export function signToken(payload) {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: "7d" });
}

export function verifyToken(token) {
  return jwt.verify(token, getJwtSecret());
}

function getBearerToken(req) {
  const header = req.headers.authorization || "";
  return header.startsWith("Bearer ") ? header.slice(7) : null;
}

export function authRequired(req, res, next) {
  const token = getBearerToken(req);
  if (!token) {
    return res.status(401).json({ error: "Missing token" });
  }
  try {
    req.user = verifyToken(token);
    return next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

export function optionalAuth(req, res, next) {
  const token = getBearerToken(req);
  if (!token) {
    req.user = null;
    return next();
  }
  try {
    req.user = verifyToken(token);
    return next();
  } catch (_error) {
    req.user = null;
    return next();
  }
}
