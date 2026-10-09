import { createContext, useContext, useEffect, useState } from "react";
import site from "./content/site.json";
import history from "./content/history.json";
import lore from "./content/lore.json";
import councilors from "./content/councilors.json";
import gallery from "./content/gallery.json";

// The built-in text. Used only if the content API can't be reached.
const DEFAULT_CONTENT = { site, history, lore, councilors, gallery };

const ContentContext = createContext(null);

// Loads the website text from the API (where admins save their changes) and shares it with every page.
// Pages wait for it, so placeholder text never flashes on screen before the saved text arrives.
export function ContentProvider({ children }) {
  const [content, setContent] = useState(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/content")
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))))
      .then((data) => alive && setContent(data))
      .catch(() => alive && setContent(DEFAULT_CONTENT));
    return () => { alive = false; };
  }, []);

  return <ContentContext.Provider value={content}>{children}</ContentContext.Provider>;
}

export function useContent() {
  return useContext(ContentContext);
}

// Pictures are either uploaded (/media/...), absolute (http...), or a file under public/ (gallery/x.png).
export function assetUrl(path) {
  if (!path || path.startsWith("/") || path.startsWith("http")) return path;
  return import.meta.env.BASE_URL + path;
}
