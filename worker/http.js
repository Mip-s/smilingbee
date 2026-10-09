// Small helpers shared by the API routes.

// An error with an HTTP status. Anything else becomes a generic 500 so no internals leak to the browser.
export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function json(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...headers },
  });
}

// Refuse cross-site writes: browsers send Origin on POST/PUT/DELETE, and it must be this site.
export function requireSameOrigin(request) {
  const origin = request.headers.get("Origin");
  if (origin && origin !== new URL(request.url).origin) {
    throw new HttpError(403, "Request came from another site.");
  }
}

export async function readJson(request) {
  if (!request.headers.get("Content-Type")?.startsWith("application/json")) {
    throw new HttpError(415, "Send the data as JSON.");
  }
  try {
    return await request.json();
  } catch {
    throw new HttpError(400, "The data could not be read.");
  }
}
