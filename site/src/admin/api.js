// Calls the Worker API. Errors carry the message the server sent, which is written for people to read.
export async function api(path, { method = "GET", json, file } = {}) {
  const headers = {};
  let body;
  if (json !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(json);
  }
  if (file) {
    headers["Content-Type"] = file.type;
    body = file;
  }
  const res = await fetch(path, { method, headers, body, credentials: "same-origin" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = new Error(data.error || `Something went wrong (${res.status}).`);
    error.status = res.status;
    throw error;
  }
  return data;
}
