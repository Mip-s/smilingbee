import { useContent } from "../ContentContext.jsx";
import { AddButton, EditText, ItemControls, moveItem, patchItem, removeItem } from "../EditControls.jsx";
import { PictureCarousel } from "../PictureCarousel.jsx";

export default function History() {
  const { content, setSection } = useContent();
  const entries = content.history.entries;
  const edit = (change) => setSection("history", change);

  return (
    <section className="section page">
      <div className="container">
        <h2 className="pixel">History</h2>
        <ol className="timeline">
          {entries.map((e, i) => (
            <li key={i}>
              <EditText as="div" className="date" value={e.date} max={60} label="Date" onChange={(v) => edit((h) => ({ ...h, entries: patchItem(h.entries, i, { date: v }) }))} />
              <EditText as="h3" value={e.title} max={120} label="Title" onChange={(v) => edit((h) => ({ ...h, entries: patchItem(h.entries, i, { title: v }) }))} />
              <EditText value={e.text} max={2000} multiline label="Text" onChange={(v) => edit((h) => ({ ...h, entries: patchItem(h.entries, i, { text: v }) }))} />
              <PictureCarousel images={e.images} alt={e.title} onChange={(images) => edit((h) => ({ ...h, entries: patchItem(h.entries, i, { images }) }))} />
              <ItemControls
                label="entry"
                index={i}
                count={entries.length}
                onMove={(step) => edit((h) => ({ ...h, entries: moveItem(h.entries, i, step) }))}
                onRemove={() => edit((h) => ({ ...h, entries: removeItem(h.entries, i) }))}
              />
            </li>
          ))}
        </ol>
        <AddButton
          disabled={entries.length >= 100}
          onClick={() => edit((h) => ({ ...h, entries: [...h.entries, { date: "Season 1", title: "New entry", text: "Describe this entry.", images: [] }] }))}
        >
          + Add an entry
        </AddButton>
      </div>
    </section>
  );
}
