const FINDER_SESSION_KEY = "wefound_finder_session";

function fallbackId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function getFinderSessionId() {
  const existing = localStorage.getItem(FINDER_SESSION_KEY);
  if (existing) return existing;

  const id = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function" ? crypto.randomUUID() : fallbackId();
  localStorage.setItem(FINDER_SESSION_KEY, id);
  return id;
}
