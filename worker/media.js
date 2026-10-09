// Serves uploaded pictures from the R2 bucket. Upload names are random, so each one can be cached for a year.

import { HttpError, json } from "./http.js";

const NAME = /^[a-f0-9-]{36}\.(png|jpg|webp|gif)$/;

export async function handleMedia(request, env) {
  try {
    const name = new URL(request.url).pathname.slice("/media/".length);
    if (!NAME.test(name)) throw new HttpError(404, "Not found.");
    const object = await env.MEDIA.get(name);
    if (!object) throw new HttpError(404, "Not found.");
    return new Response(object.body, {
      headers: {
        "Content-Type": object.httpMetadata?.contentType || "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (err) {
    if (err instanceof HttpError) return json({ error: err.message }, err.status);
    throw err;
  }
}
