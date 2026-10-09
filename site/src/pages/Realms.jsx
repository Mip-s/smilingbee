import { useContent } from "../ContentContext.jsx";
import { AddButton, EditText, ItemControls, moveItem, patchItem, removeItem } from "../EditControls.jsx";
import { PictureCarousel } from "../PictureCarousel.jsx";

export default function Realms() {
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
        <h2 className="pixel">Realms</h2>

        <h3 className="sub">Places</h3>
        <div className="cards">
          {data.places.map((p, i) => (
            <article className="card" key={i}>
              <PictureCarousel images={p.images} alt={p.name} onChange={(images) => edit("places", (l) => patchItem(l, i, { images }))} />
              <div className="body">
                <EditText as="h4" value={p.name} max={120} label="Place name" onChange={(v) => edit("places", (l) => patchItem(l, i, { name: v }))} />
                <EditText value={p.text} max={2000} multiline label="Place text" onChange={(v) => edit("places", (l) => patchItem(l, i, { text: v }))} />
                {controls("places", "place", i)}
              </div>
            </article>
          ))}
        </div>
        <AddButton disabled={data.places.length >= 50} onClick={() => edit("places", (l) => [...l, { name: "New place", text: "Describe this place.", images: [] }])}>
          + Add a place
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
