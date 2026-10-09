import { createContext, useContext, useEffect, useRef, useState } from "react";
import site from "./content/site.json";
import history from "./content/history.json";
import lore from "./content/lore.json";
import councilors from "./content/councilors.json";
import gallery from "./content/gallery.json";
import { api } from "./admin/api.js";

// The built-in text. Used only if the content API can't be reached.
const DEFAULT_CONTENT = { site, history, lore, councilors, gallery };
export const SECTION_NAMES = {
  site: "Home and header",
  history: "History",
  lore: "Archives",
  councilors: "Councilors",
  gallery: "Gallery",
};
const SECTION_KEYS = Object.keys(SECTION_NAMES);
const EDIT_FLAG = "smilingbee-edit";
const DRAFT_KEY = "smilingbee-drafts";

// Unsaved drafts are kept for this browser tab only, so they survive moving between pages until saved or discarded.
function readDrafts() {
  try {
    return JSON.parse(sessionStorage.getItem(DRAFT_KEY)) || null;
  } catch {
    return null;
  }
}

function writeDrafts(dirty) {
  try {
    if (Object.keys(dirty).length) sessionStorage.setItem(DRAFT_KEY, JSON.stringify(dirty));
    else sessionStorage.removeItem(DRAFT_KEY);
  } catch {
    // Storage can be blocked; the drafts then last only until the page is left.
  }
}

// Remembers, for this browser tab only, that the admin switched editing on.
function readEditFlag() {
  try {
    return sessionStorage.getItem(EDIT_FLAG) === "1";
  } catch {
    return false;
  }
}

export function writeEditFlag(on) {
  try {
    sessionStorage.setItem(EDIT_FLAG, on ? "1" : "0");
  } catch {
    // Private windows can block storage; editing still works, it just isn't remembered.
  }
}

const ContentContext = createContext(null);

// Shares the website text with every page. Logged-in admins also get the editing state here: the saved text,
// the unsaved drafts, and the save and discard actions. Visitors never see any of it.
export function ContentProvider({ children }) {
  const [saved, setSaved] = useState(null);
  const [drafts, setDrafts] = useState(null);
  const [admin, setAdmin] = useState(null); // the logged-in admin, or null
  const [editingOn, setEditingOn] = useState(readEditFlag);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: "", error: false });

  useEffect(() => {
    let alive = true;
    fetch("/api/content")
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))))
      .then((data) => {
        if (alive) {
          setSaved(data);
          setDrafts(data);
        }
      })
      .catch(() => {
        if (alive) {
          setSaved(DEFAULT_CONTENT);
          setDrafts(DEFAULT_CONTENT);
        }
      });
    api("/api/admin/me")
      .then((user) => alive && setAdmin(user))
      .catch(() => alive && setAdmin(null));
    return () => { alive = false; };
  }, []);

  const dirtyKeys = saved && drafts ? SECTION_KEYS.filter((k) => JSON.stringify(drafts[k]) !== JSON.stringify(saved[k])) : [];

  // Bring back drafts left from the last page (once, after the saved text has loaded), and keep the current ones.
  const restored = useRef(false);
  useEffect(() => {
    if (!saved || restored.current) return;
    restored.current = true;
    const stored = readDrafts();
    if (stored) setDrafts((d) => ({ ...d, ...stored }));
  }, [saved]);

  useEffect(() => {
    if (!saved || !drafts) return;
    writeDrafts(Object.fromEntries(dirtyKeys.map((k) => [k, drafts[k]])));
  }, [drafts, saved]);

  function setSection(key, change) {
    setDrafts((d) => ({ ...d, [key]: typeof change === "function" ? change(d[key]) : change }));
  }

  async function save() {
    setSaving(true);
    setMessage({ text: "", error: false });
    let current = null;
    try {
      for (const key of dirtyKeys) {
        current = key;
        const { value } = await api(`/api/admin/content/${key}`, { method: "PUT", json: drafts[key] });
        setSaved((s) => ({ ...s, [key]: value }));
        setDrafts((d) => ({ ...d, [key]: value }));
      }
      setMessage({ text: "Saved. The website is updated.", error: false });
    } catch (err) {
      setMessage({ text: `${SECTION_NAMES[current]}: ${err.message}`, error: true });
    } finally {
      setSaving(false);
    }
  }

  function discard() {
    setDrafts(saved);
    setMessage({ text: "", error: false });
  }

  function setEditing(on) {
    writeEditFlag(on);
    setEditingOn(on);
  }

  async function logout() {
    if (dirtyKeys.length && !window.confirm("Discard your unsaved changes and log out?")) return;
    await api("/api/admin/logout", { method: "POST", json: {} }).catch(() => {});
    writeEditFlag(false);
    writeDrafts({});
    window.location.href = "/";
  }

  const value = {
    content: drafts,
    admin,
    editing: editingOn && admin !== null,
    dirtyKeys,
    saving,
    message,
    setSection,
    save,
    discard,
    setEditing,
    logout,
  };

  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>;
}

export function useContent() {
  return useContext(ContentContext);
}

// Pictures are either uploaded (/media/...), absolute (http...), or a file under public/ (gallery/x.png).
export function assetUrl(path) {
  if (!path || path.startsWith("/") || path.startsWith("http")) return path;
  return import.meta.env.BASE_URL + path;
}
