const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5050";

export function getToken() {
  return localStorage.getItem("wefound_token");
}

export function setToken(token: string | null) {
  if (token) {
    localStorage.setItem("wefound_token", token);
  } else {
    localStorage.removeItem("wefound_token");
  }
}

async function request(path: string, options: RequestInit = {}) {
  const token = getToken();
  const headers = new Headers(options.headers || {});
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const message = errorBody?.error || errorBody?.message || "Request failed";
    throw new Error(typeof message === "string" ? message : "Request failed");
  }

  return response.json();
}

export const api = {
  get: (path: string) => request(path),
  post: (path: string, body?: unknown) => request(path, { method: "POST", body: JSON.stringify(body || {}) }),
  put: (path: string, body?: unknown) => request(path, { method: "PUT", body: JSON.stringify(body || {}) }),
  del: (path: string) => request(path, { method: "DELETE" }),
};

export { API_URL };
