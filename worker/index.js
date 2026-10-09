// Entry point. The API and uploaded pictures are handled here; every other request is a page or file in dist/.

import { handleApi } from "./api.js";
import { handleMedia } from "./media.js";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const { pathname } = url;
    // The Lore page is now Realms; keep old links working.
    if (pathname === "/lore" || pathname === "/lore/") return Response.redirect(new URL("/realms", url), 301);
    if (pathname.startsWith("/api/")) return handleApi(request, env);
    if (pathname.startsWith("/media/")) return handleMedia(request, env);
    return env.ASSETS.fetch(request);
  },
};
