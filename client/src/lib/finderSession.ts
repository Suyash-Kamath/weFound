const FINDER_SESSION_KEY = "wefound_finder_session";

// The session id is the finder's only proof of who they are in a chat, so it
// must be unguessable. getRandomValues also works on plain http pages, where
// randomUUID is unavailable.
function fallbackId() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function getFinderSessionId() {
  const existing = localStorage.getItem(FINDER_SESSION_KEY);
  if (existing) return existing;

  const id = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function" ? crypto.randomUUID() : fallbackId();
  localStorage.setItem(FINDER_SESSION_KEY, id);
  return id;
}
