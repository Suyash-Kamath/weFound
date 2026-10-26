// Express 4 does not catch rejected promises from async handlers; an uncaught
// rejection would crash the whole process. Wrap every async route with this.
export const asyncHandler = (handler) => (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch(next);
};

export function notFoundHandler(req, res) {
  res.status(404).json({ error: "Not found" });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(error, req, res, next) {
  if (res.headersSent) return;

  // Malformed ids in the URL or body, e.g. /items/abc
  if (error?.name === "CastError") {
    return res.status(404).json({ error: "Not found" });
  }
  if (error?.type === "entity.parse.failed") {
    return res.status(400).json({ error: "Invalid JSON body" });
  }
  if (error?.type === "entity.too.large") {
    return res.status(413).json({ error: "Request body too large" });
  }

  // eslint-disable-next-line no-console
  console.error(`${req.method} ${req.originalUrl} failed:`, error);
  return res.status(500).json({ error: "Something went wrong. Please try again." });
}
