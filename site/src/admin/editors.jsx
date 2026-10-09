// Form pieces for the admin editor. Each section editor gets the section's draft and returns a new draft.
import { useState } from "react";
import { api } from "./api.js";
import { assetUrl } from "../ContentContext.jsx";

const PICTURE_TYPES = "image/png,image/jpeg,image/webp,image/gif";

export function TextField({ label, value, onChange, multiline = false, max, hint, type = "text" }) {
  return (
    <label className="adm-field">
      <span>{label}</span>
      {multiline ? (
        <textarea rows={3} value={value} maxLength={max} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input type={type} value={value} maxLength={max} onChange={(e) => onChange(e.target.value)} />
      )}
      {hint && <small>{hint}</small>}
    </label>
  );
}

// A picture from the uploads, or one that ships with the site. Uploading replaces it.
export function PictureField({ label, value, onChange, required = false }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function upload(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const { url } = await api("/api/admin/media", { method: "POST", file });
      onChange(url);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="adm-picture">
      <span className="adm-label">{label}</span>
      <div className="adm-picture-row">
        {value ? <img src={assetUrl(value)} alt="" /> : <div className="adm-nopic">No picture</div>}
        <div className="adm-picture-buttons">
          <label className="adm-btn small">
            {busy ? "Uploading…" : value ? "Replace picture" : "Upload picture"}
            <input type="file" accept={PICTURE_TYPES} onChange={upload} disabled={busy} hidden />
          </label>
          {value && !required && (
            <button type="button" className="adm-btn ghost small" onClick={() => onChange("")}>
              Remove picture
            </button>
          )}
        </div>
      </div>
      {error && <p className="adm-error" role="alert">{error}</p>}
    </div>
  );
}

// A list of items the admin can add to, reorder and remove.
export function ItemList({ items, onChange, max, makeItem, addLabel, title, renderFields }) {
  function setItem(i, next) {
    onChange(items.map((item, j) => (j === i ? next : item)));
  }
  function move(i, step) {
    const j = i + step;
    if (j < 0 || j >= items.length) return;
    const copy = [...items];
    [copy[i], copy[j]] = [copy[j], copy[i]];
    onChange(copy);
  }
  function remove(i) {
    if (window.confirm(`Remove "${title(items[i], i)}"?`)) onChange(items.filter((_, j) => j !== i));
  }

  return (
    <div className="adm-list">
      {items.map((item, i) => (
        <fieldset className="adm-item" key={i}>
          <legend>{title(item, i)}</legend>
          {renderFields(item, (next) => setItem(i, next))}
          <div className="adm-item-actions">
            <button type="button" className="adm-btn ghost small" onClick={() => move(i, -1)} disabled={i === 0}>
              ▲ Up
            </button>
            <button type="button" className="adm-btn ghost small" onClick={() => move(i, 1)} disabled={i === items.length - 1}>
              ▼ Down
            </button>
            <button type="button" className="adm-btn danger small" onClick={() => remove(i)}>
              Remove
            </button>
          </div>
        </fieldset>
      ))}
      {items.length < max && (
        <button type="button" className="adm-btn" onClick={() => onChange([...items, makeItem()])}>
          {addLabel}
        </button>
      )}
    </div>
  );
}

export function SiteEditor({ value, onChange }) {
  const set = (patch) => onChange({ ...value, ...patch });
  return (
    <>
      <TextField label="Server name" value={value.serverName} max={60} onChange={(v) => set({ serverName: v })} />
      <TextField label="Tagline" value={value.tagline} max={300} multiline onChange={(v) => set({ tagline: v })} />

      <h3 className="adm-sub">Welcome text</h3>
      <ItemList
        items={value.welcome}
        onChange={(welcome) => set({ welcome })}
        max={10}
        makeItem={() => ""}
        addLabel="Add a paragraph"
        title={(_, i) => `Paragraph ${i + 1}`}
        renderFields={(item, setItem) => (
          <TextField label="Text" value={item} max={1000} multiline onChange={setItem} />
        )}
      />

      <h3 className="adm-sub">Highlights</h3>
      <ItemList
        items={value.highlights}
        onChange={(highlights) => set({ highlights })}
        max={6}
        makeItem={() => ({ icon: "⭐", title: "", text: "" })}
        addLabel="Add a highlight"
        title={(h, i) => h.title || `Highlight ${i + 1}`}
        renderFields={(h, setItem) => (
          <>
            <TextField label="Icon (an emoji)" value={h.icon} max={8} onChange={(v) => setItem({ ...h, icon: v })} />
            <TextField label="Title" value={h.title} max={80} onChange={(v) => setItem({ ...h, title: v })} />
            <TextField label="Text" value={h.text} max={300} multiline onChange={(v) => setItem({ ...h, text: v })} />
          </>
        )}
      />

      <h3 className="adm-sub">Links and footer</h3>
      <TextField
        label="Discord invite link"
        value={value.discord}
        max={200}
        hint="Must start with https://"
        onChange={(v) => set({ discord: v })}
      />
      <TextField label="Footer" value={value.footer} max={500} multiline onChange={(v) => set({ footer: v })} />
    </>
  );
}

export function HistoryEditor({ value, onChange }) {
  return (
    <ItemList
      items={value.entries}
      onChange={(entries) => onChange({ ...value, entries })}
      max={100}
      makeItem={() => ({ date: "", title: "", text: "" })}
      addLabel="Add an entry"
      title={(e, i) => e.title || `Entry ${i + 1}`}
      renderFields={(e, setItem) => (
        <>
          <TextField label="Date (free text)" value={e.date} max={60} onChange={(v) => setItem({ ...e, date: v })} />
          <TextField label="Title" value={e.title} max={120} onChange={(v) => setItem({ ...e, title: v })} />
          <TextField label="Text" value={e.text} max={2000} multiline onChange={(v) => setItem({ ...e, text: v })} />
        </>
      )}
    />
  );
}

export function LoreEditor({ value, onChange }) {
  const set = (patch) => onChange({ ...value, ...patch });
  return (
    <>
      <h3 className="adm-sub">Stories</h3>
      <ItemList
        items={value.stories}
        onChange={(stories) => set({ stories })}
        max={50}
        makeItem={() => ({ title: "", text: "" })}
        addLabel="Add a story"
        title={(s, i) => s.title || `Story ${i + 1}`}
        renderFields={(s, setItem) => (
          <>
            <TextField label="Title" value={s.title} max={120} onChange={(v) => setItem({ ...s, title: v })} />
            <TextField label="Text" value={s.text} max={2000} multiline onChange={(v) => setItem({ ...s, text: v })} />
          </>
        )}
      />

      <h3 className="adm-sub">Places</h3>
      <ItemList
        items={value.places}
        onChange={(places) => set({ places })}
        max={50}
        makeItem={() => ({ name: "", text: "", image: "" })}
        addLabel="Add a place"
        title={(p, i) => p.name || `Place ${i + 1}`}
        renderFields={(p, setItem) => (
          <>
            <TextField label="Name" value={p.name} max={120} onChange={(v) => setItem({ ...p, name: v })} />
            <TextField label="Text" value={p.text} max={2000} multiline onChange={(v) => setItem({ ...p, text: v })} />
            <PictureField label="Picture (optional)" value={p.image} onChange={(v) => setItem({ ...p, image: v })} />
          </>
        )}
      />

      <h3 className="adm-sub">Factions</h3>
      <ItemList
        items={value.factions}
        onChange={(factions) => set({ factions })}
        max={50}
        makeItem={() => ({ name: "", color: "#c99a45", text: "" })}
        addLabel="Add a faction"
        title={(f, i) => f.name || `Faction ${i + 1}`}
        renderFields={(f, setItem) => (
          <>
            <TextField label="Name" value={f.name} max={120} onChange={(v) => setItem({ ...f, name: v })} />
            <label className="adm-field">
              <span>Color</span>
              <input type="color" value={f.color} onChange={(e) => setItem({ ...f, color: e.target.value })} />
            </label>
            <TextField label="Text" value={f.text} max={2000} multiline onChange={(v) => setItem({ ...f, text: v })} />
          </>
        )}
      />
    </>
  );
}

export function CouncilorsEditor({ value, onChange }) {
  function setSeat(i, next) {
    onChange({ ...value, councilors: value.councilors.map((seat, j) => (j === i ? next : seat)) });
  }
  return (
    <>
      <p className="adm-hint">
        The council has seven seats. To leave a seat empty, type <b>Vacant</b> as its name.
      </p>
      <div className="adm-list">
        {value.councilors.map((seat, i) => (
          <fieldset className="adm-item" key={i}>
            <legend>Seat {i + 1}: {seat.name || "(no name)"}</legend>
            <TextField
              label="Name (letters, digits and underscores)"
              value={seat.name}
              max={32}
              onChange={(v) => setSeat(i, { ...seat, name: v })}
            />
            <TextField label="Territory" value={seat.territory} max={80} onChange={(v) => setSeat(i, { ...seat, territory: v })} />
            <TextField
              label="Description"
              value={seat.description}
              max={500}
              multiline
              onChange={(v) => setSeat(i, { ...seat, description: v })}
            />
            <PictureField label="Full skin picture" value={seat.picture} onChange={(v) => setSeat(i, { ...seat, picture: v })} />
          </fieldset>
        ))}
      </div>
    </>
  );
}

export function GalleryEditor({ value, onChange }) {
  return (
    <ItemList
      items={value.images}
      onChange={(images) => onChange({ ...value, images })}
      max={200}
      makeItem={() => ({ src: "", caption: "" })}
      addLabel="Add a picture"
      title={(img, i) => img.caption || `Picture ${i + 1}`}
      renderFields={(img, setItem) => (
        <>
          <PictureField required label="Picture" value={img.src} onChange={(v) => setItem({ ...img, src: v })} />
          <TextField label="Caption" value={img.caption} max={200} onChange={(v) => setItem({ ...img, caption: v })} />
        </>
      )}
    />
  );
}
