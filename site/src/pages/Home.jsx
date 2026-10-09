import { Fragment } from "react";
import { Text } from "../ui.jsx";
import { useContent } from "../ContentContext.jsx";
import { AddButton, EditText, ItemControls, moveItem, patchItem, removeItem } from "../EditControls.jsx";

const EXPLORE = [
  { href: "/history", icon: "⏳", title: "History", text: "How the server grew, season by season." },
  { href: "/lore", icon: "📜", title: "Lore", text: "Stories, places and factions of the world." },
  { href: "/councilors", icon: "🏛️", title: "Councilors", text: "Meet the nine seats of the council." },
  { href: "/gallery", icon: "🖼️", title: "Gallery", text: "Screenshots from around the world." },
];

export default function Home() {
  const { content, editing, setSection } = useContent();
  const site = content.site;
  const edit = (change) => setSection("site", change);

  return (
    <>
      <section className="hero" id="home">
        <div className="hero-inner">
          <EditText as="h1" className="pixel" value={site.serverName} max={60} label="Server name" onChange={(v) => edit((s) => ({ ...s, serverName: v }))} />
          <EditText className="tagline" value={site.tagline} max={300} multiline label="Tagline" onChange={(v) => edit((s) => ({ ...s, tagline: v }))} />
          <div className="welcome">
            {site.welcome.map((p, i) => (
              <Fragment key={i}>
                <EditText value={p} max={1000} multiline label={`Welcome paragraph ${i + 1}`} onChange={(v) => edit((s) => ({ ...s, welcome: s.welcome.map((x, j) => (j === i ? v : x)) }))} />
                <ItemControls
                  label="paragraph"
                  index={i}
                  count={site.welcome.length}
                  onMove={(step) => edit((s) => ({ ...s, welcome: moveItem(s.welcome, i, step) }))}
                  onRemove={() => edit((s) => ({ ...s, welcome: removeItem(s.welcome, i) }))}
                />
              </Fragment>
            ))}
            <AddButton disabled={site.welcome.length >= 10} onClick={() => edit((s) => ({ ...s, welcome: [...s.welcome, "New paragraph. Write something friendly here."] }))}>
              + Add a paragraph
            </AddButton>
          </div>
          <div className="highlights">
            {site.highlights.map((h, i) => (
              <div className="highlight" key={i}>
                <EditText as="div" className="icon" value={h.icon} max={8} label="Icon" onChange={(v) => edit((s) => ({ ...s, highlights: patchItem(s.highlights, i, { icon: v }) }))} />
                <EditText as="h3" value={h.title} max={80} label="Highlight title" onChange={(v) => edit((s) => ({ ...s, highlights: patchItem(s.highlights, i, { title: v }) }))} />
                <EditText value={h.text} max={300} multiline label="Highlight text" onChange={(v) => edit((s) => ({ ...s, highlights: patchItem(s.highlights, i, { text: v }) }))} />
                <ItemControls
                  label="highlight"
                  index={i}
                  count={site.highlights.length}
                  onMove={(step) => edit((s) => ({ ...s, highlights: moveItem(s.highlights, i, step) }))}
                  onRemove={() => edit((s) => ({ ...s, highlights: removeItem(s.highlights, i) }))}
                />
              </div>
            ))}
            {editing && (
              <div className="highlight edit-add-card">
                <AddButton disabled={site.highlights.length >= 6} onClick={() => edit((s) => ({ ...s, highlights: [...s.highlights, { icon: "⭐", title: "New highlight", text: "Short line about something players love." }] }))}>
                  + Add a highlight
                </AddButton>
              </div>
            )}
          </div>
        </div>
        <div className="grass-edge" aria-hidden="true" />
      </section>

      <section className="section">
        <div className="container">
          <h2 className="pixel">Explore</h2>
          <div className="explore">
            {EXPLORE.map((e) => (
              <a className="explore-card" href={e.href} key={e.href}>
                <span className="icon" aria-hidden="true">{e.icon}</span>
                <span className="pixel">{e.title}</span>
                <span>{e.text}</span>
              </a>
            ))}
          </div>
          {editing && (
            <label className="edit-field-row">
              <span>Discord invite link (must start with https://)</span>
              <input
                type="text"
                className="edit-input"
                maxLength={200}
                value={site.discord}
                onChange={(e) => edit((s) => ({ ...s, discord: e.target.value }))}
              />
            </label>
          )}
        </div>
      </section>
    </>
  );
}
