// In-place editing for admins. Each piece shows the normal page element for visitors, and a field, picture
// control or button while the admin is editing. Changes go into the drafts until "Save changes" is pressed.
import { useLayoutEffect, useRef, useState } from "react";
import { useContent, assetUrl, SECTION_NAMES } from "./ContentContext.jsx";
import { api } from "./admin/api.js";
import { shrinkPicture } from "./shrink.js";
import { Text } from "./ui.jsx";
import { Rich } from "./RichText.jsx";

const PICTURE_TYPES = "image/png,image/jpeg,image/webp,image/gif";

// The formatting buttons for a multi-line field. Each one wraps the selected text, or changes the start of its line.
const FORMATS = [
  { label: "Bold", key: "b", open: "**", close: "**", placeholder: "bold text" },
  { label: "Italic", key: "i", open: "*", close: "*", placeholder: "italic text" },
  { label: "Heading", line: "# " },
  { label: "Subheading", line: "## " },
  { label: "Large text", open: "[large]", close: "[/large]", placeholder: "large text" },
  { label: "Small text", open: "[small]", close: "[/small]", placeholder: "small text" },
  { label: "Bullet list", line: "- " },
];

// Text that becomes a field while editing. `as` is the tag the text normally uses.
export function EditText({ value, onChange, as: Tag = "p", className = "", multiline = false, max, label }) {
  const { editing } = useContent();
  const field = useRef(null);
  const selectAfter = useRef(null); // the selection to restore once the new text is shown

  useLayoutEffect(() => {
    if (!selectAfter.current || !field.current) return;
    field.current.setSelectionRange(...selectAfter.current);
    selectAfter.current = null;
  });

  if (!editing) return <Rich value={value} as={Tag} className={className || undefined} />;

  // Changes the selected text, or the start of its line, and keeps the field's text within its limit.
  function format(item) {
    const el = field.current;
    if (!el) return;
    const text = el.value;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    let next;
    let range;
    if (item.line) {
      const lineStart = start === 0 ? 0 : text.lastIndexOf("\n", start - 1) + 1;
      const hasPrefix = text.startsWith(item.line, lineStart);
      next = hasPrefix
        ? text.slice(0, lineStart) + text.slice(lineStart + item.line.length)
        : text.slice(0, lineStart) + item.line + text.slice(lineStart);
      const shift = hasPrefix ? -item.line.length : item.line.length;
      range = [start + shift, end + shift];
    } else {
      const selected = text.slice(start, end) || item.placeholder;
      next = text.slice(0, start) + item.open + selected + item.close + text.slice(end);
      range = [start + item.open.length, start + item.open.length + selected.length];
    }
    if (max && next.length > max) return;
    selectAfter.current = range;
    onChange(next);
  }

  function onKeyDown(e) {
    if (!(e.ctrlKey || e.metaKey)) return;
    const item = FORMATS.find((f) => f.key === e.key.toLowerCase());
    if (!item) return;
    e.preventDefault();
    format(item);
  }

  const props = {
    value,
    maxLength: max,
    "aria-label": label,
    className: `edit-input ${className}`,
    onChange: (e) => onChange(e.target.value),
  };
  if (!multiline) return <input type="text" {...props} />;
  return (
    <>
      <div className="edit-format" role="toolbar" aria-label={`Formatting for ${label}`}>
        {FORMATS.map((item) => (
          <button
            key={item.label}
            type="button"
            className="edit-chip edit-format-btn"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => format(item)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <textarea ref={field} rows={3} onKeyDown={onKeyDown} {...props} />
    </>
  );
}

// A picture that can be replaced by uploading a new one while editing.
export function EditPicture({ src, onChange, alt = "", className = "", imgClassName = "", required = false, emptyLabel = "No picture" }) {
  const { editing } = useContent();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (!editing) {
    return src ? <img className={imgClassName || undefined} src={assetUrl(src)} alt={alt} loading="lazy" /> : null;
  }

  async function upload(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const { url } = await api("/api/admin/media", { method: "POST", file: await shrinkPicture(file) });
      onChange(url);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={`edit-picture ${className}`}>
      {src ? (
        <img className={imgClassName || undefined} src={assetUrl(src)} alt={alt} />
      ) : (
        <div className="edit-nopic">{emptyLabel}</div>
      )}
      <div className="edit-controls">
        <label className="edit-chip">
          {busy ? "Uploading…" : src ? "Replace picture" : "Add picture"}
          <input type="file" accept={PICTURE_TYPES} onChange={upload} disabled={busy} hidden />
        </label>
        {src && !required && (
          <button type="button" className="edit-chip danger" onClick={() => onChange("")}>
            Remove picture
          </button>
        )}
      </div>
      {error && <p className="edit-error" role="alert">{error}</p>}
    </div>
  );
}

// Move, delete and (for pictures) add controls for one item in a list. Shown only while editing.
export function ItemControls({ label, index, count, onMove, onRemove }) {
  const { editing } = useContent();
  if (!editing) return null;
  return (
    <div className="edit-controls" role="group" aria-label={`Controls for this ${label}`}>
      <button type="button" className="edit-chip" onClick={() => onMove(-1)} disabled={index === 0} aria-label={`Move this ${label} up`}>
        ▲ Up
      </button>
      <button type="button" className="edit-chip" onClick={() => onMove(1)} disabled={index === count - 1} aria-label={`Move this ${label} down`}>
        ▼ Down
      </button>
      <button
        type="button"
        className="edit-chip danger"
        onClick={() => window.confirm(`Delete this ${label}?`) && onRemove()}
      >
        🗑 Delete
      </button>
    </div>
  );
}

// A button that adds an item to a list. Shown only while editing.
export function AddButton({ children, onClick, disabled = false }) {
  const { editing } = useContent();
  if (!editing) return null;
  return (
    <button type="button" className="edit-add" onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

// Uploads a picture and hands its address to `onAdd`. Shown only while editing.
export function AddPicture({ label, onAdd }) {
  const { editing } = useContent();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (!editing) return null;

  async function upload(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const { url } = await api("/api/admin/media", { method: "POST", file: await shrinkPicture(file) });
      onAdd(url);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="edit-add-wrap">
      <label className="edit-add">
        {busy ? "Uploading…" : label}
        <input type="file" accept={PICTURE_TYPES} onChange={upload} disabled={busy} hidden />
      </label>
      {error && <p className="edit-error" role="alert">{error}</p>}
    </div>
  );
}

// The bar at the bottom of every public page for a logged-in admin: edit switch, save and discard.
export function EditBar() {
  const { admin, editing, setEditing, dirtyKeys, saving, message, save, discard, logout } = useContent();
  if (!admin) return null;
  return (
    <>
      <div className="edit-bar-spacer" aria-hidden="true" />
      <div className="edit-bar" role="region" aria-label="Admin tools">
        <span className="edit-bar-who">Logged in as <b>{admin.username}</b></span>
        {editing ? (
          <button className="edit-bar-btn" onClick={() => setEditing(false)}>Stop editing</button>
        ) : (
          <button className="edit-bar-btn primary" onClick={() => setEditing(true)}>Edit this website</button>
        )}
        {dirtyKeys.length > 0 && (
          <>
            <span className="edit-bar-dirty">Unsaved: {dirtyKeys.map((k) => SECTION_NAMES[k]).join(", ")}</span>
            <button className="edit-bar-btn primary" onClick={save} disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </button>
            <button className="edit-bar-btn" onClick={discard} disabled={saving}>Discard</button>
          </>
        )}
        {message.text && (
          <span className={message.error ? "edit-bar-error" : "edit-bar-ok"} role={message.error ? "alert" : "status"}>
            {message.text}
          </span>
        )}
        <a className="edit-bar-link" href="/admin">My profile</a>
        <button className="edit-bar-btn" onClick={logout}>Log out</button>
      </div>
    </>
  );
}

// Helpers for changing one item in a list without touching the others.
export function patchItem(list, index, patch) {
  return list.map((item, i) => (i === index ? { ...item, ...patch } : item));
}

export function moveItem(list, index, step) {
  const to = index + step;
  if (to < 0 || to >= list.length) return list;
  const copy = [...list];
  [copy[index], copy[to]] = [copy[to], copy[index]];
  return copy;
}

export function removeItem(list, index) {
  return list.filter((_, i) => i !== index);
}
