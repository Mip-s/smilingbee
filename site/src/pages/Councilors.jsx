import { useState } from "react";
import { Text } from "../ui.jsx";
import { assetUrl, useContent } from "../ContentContext.jsx";
import { EditPicture, EditText, patchItem } from "../EditControls.jsx";

// The council always has 7 seats, laid out like a council table: six seats in two rows of three
// on the left, and the seventh seat alone on the right.
// Clicking a seat opens its details in place. "Vacant" seats show an empty outline and no picture.
// While an admin is editing, every seat shows its details and can be changed in place.
export default function Councilors() {
  const { content, editing, setSection } = useContent();
  const [open, setOpen] = useState(null);
  const seats = content.councilors.councilors;
  const main = seats.slice(0, 6);
  const side = seats.slice(6);

  const editSeat = (i, patch) => setSection("councilors", (c) => ({ ...c, councilors: patchItem(c.councilors, i, patch) }));

  function renderSeat(c, index) {
    return (
      <Seat
        key={index}
        c={c}
        index={index}
        open={editing || open === index}
        editing={editing}
        onToggle={() => setOpen(open === index ? null : index)}
        onEdit={(patch) => editSeat(index, patch)}
      />
    );
  }

  return (
    <section className="section page councilors-page">
      <h2 className="pixel">Councilors</h2>
      <div className="council-table">
        <div className="council-main">
          {main.map((c, i) => renderSeat(c, i))}
        </div>
        <div className="council-side">
          {side.map((c, i) => renderSeat(c, 6 + i))}
        </div>
      </div>
    </section>
  );
}

// Defined outside Councilors so typing in a field doesn't remount it.
function Seat({ c, index, open, editing, onToggle, onEdit }) {
  const vacant = c.name === "Vacant";

  if (editing) {
    return (
      <div className={`seat edit-seat${vacant ? " vacant" : ""}`}>
        <EditPicture
          src={c.picture}
          alt={`${c.name} full skin`}
          imgClassName="seat-skin"
          emptyLabel="No picture"
          onChange={(v) => onEdit({ picture: v })}
        />
        <EditText as="h3" value={c.name} max={32} label={`Seat ${index + 1} name (type Vacant to empty the seat)`} onChange={(v) => onEdit({ name: v })} />
        <EditText className="territory" value={c.territory} max={80} label="Territory" onChange={(v) => onEdit({ territory: v })} />
        <EditText value={c.description} max={500} multiline label="Description" onChange={(v) => onEdit({ description: v })} />
        {!vacant && (
          <div className="edit-controls">
            <button
              type="button"
              className="edit-chip danger"
              onClick={() => window.confirm("Empty this seat? The councilor's name, territory, description and picture will be removed.") && onEdit({ name: "Vacant", territory: "—", description: "This seat is vacant.", picture: "" })}
            >
              Empty this seat
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`seat${vacant ? " vacant" : ""}${open ? " open" : ""}`}
      role={vacant ? undefined : "button"}
      tabIndex={vacant ? undefined : 0}
      aria-expanded={vacant ? undefined : open}
      onClick={vacant ? undefined : onToggle}
      onKeyDown={vacant ? undefined : (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onToggle(); } }}
    >
      {c.picture ? (
        <img className="seat-skin" src={assetUrl(c.picture)} alt={`${c.name} full skin`} loading="lazy" />
      ) : (
        <div className="seat-skin seat-empty" aria-hidden="true" />
      )}
      <Text value={c.name} as="h3" className={vacant ? "vacant" : undefined} />
      {open && (
        <div className="seat-details">
          <Text value={c.territory} className="territory" />
          <Text value={c.description} />
        </div>
      )}
    </div>
  );
}
