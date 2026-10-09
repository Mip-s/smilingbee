import { useContent } from "../ContentContext.jsx";
import { AddButton, EditText, ItemControls, moveItem, patchItem, removeItem } from "../EditControls.jsx";
import { PictureCarousel } from "../PictureCarousel.jsx";

export default function Archives() {
  const { content, editing, setSection } = useContent();
  const data = content.lore;
  const edit = (key, change) => setSection("lore", (l) => ({ ...l, [key]: change(l[key]) }));

  // Move/delete controls for one item in one of the two lists.
  function controls(key, label, i) {
    const list = data[key];
    return (
      <ItemControls
        label={label}
        index={i}
        count={list.length}
        onMove={(step) => edit(key, (l) => moveItem(l, i, step))}
        onRemove={() => edit(key, (l) => removeItem(l, i))}
      />
    );
  }

  return (
    <section className="section page">
      <div className="container">
        <h2 className="pixel">Archives</h2>

        <h3 className="sub">Occurrences</h3>
        <div className="cards">
          {data.occurrences.map((o, i) => (
            <article className="card" key={i}>
              <PictureCarousel images={o.images} alt={o.name} onChange={(images) => edit("occurrences", (l) => patchItem(l, i, { images }))} />
              <div className="body">
                {(editing || o.when) && (
                  <EditText as="p" className="when" value={o.when} max={120} label="Occurrence time note" onChange={(v) => edit("occurrences", (l) => patchItem(l, i, { when: v }))} />
                )}
                <EditText as="h4" value={o.name} max={120} label="Occurrence title" onChange={(v) => edit("occurrences", (l) => patchItem(l, i, { name: v }))} />
                <EditText value={o.text} max={2000} multiline label="Occurrence text" onChange={(v) => edit("occurrences", (l) => patchItem(l, i, { text: v }))} />
                {controls("occurrences", "occurrence", i)}
              </div>
            </article>
          ))}
        </div>
        <AddButton disabled={data.occurrences.length >= 50} onClick={() => edit("occurrences", (l) => [...l, { name: "New occurrence", when: "", text: "Describe what happened.", images: [] }])}>
          + Add an occurrence
        </AddButton>

        <h3 className="sub">Factions</h3>
        <div className="cards">
          {data.factions.map((f, i) => (
            <article className="card faction" key={i} style={{ borderLeftColor: f.color }}>
              <PictureCarousel images={f.images} alt={f.name} onChange={(images) => edit("factions", (l) => patchItem(l, i, { images }))} />
              <div className="body">
                <EditText as="h4" value={f.name} max={120} label="Faction name" onChange={(v) => edit("factions", (l) => patchItem(l, i, { name: v }))} />
                {editing && (
                  <label className="edit-field-row edit-inline">
                    <span>Color</span>
                    <input type="color" value={f.color} onChange={(e) => edit("factions", (l) => patchItem(l, i, { color: e.target.value }))} />
                  </label>
                )}
                <EditText value={f.text} max={2000} multiline label="Faction text" onChange={(v) => edit("factions", (l) => patchItem(l, i, { text: v }))} />
                {controls("factions", "faction", i)}
              </div>
            </article>
          ))}
        </div>
        <AddButton disabled={data.factions.length >= 50} onClick={() => edit("factions", (l) => [...l, { name: "New faction", color: "#c99a45", text: "Who they are.", images: [] }])}>
          + Add a faction
        </AddButton>
      </div>
    </section>
  );
}
