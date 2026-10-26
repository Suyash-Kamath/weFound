import crypto from "crypto";

export function generateShortCode(length = 8) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  for (let i = 0; i < length; i += 1) {
    result += chars.charAt(crypto.randomInt(chars.length));
  }
  return result;
}

export function createId() {
  return crypto.randomUUID();
}
