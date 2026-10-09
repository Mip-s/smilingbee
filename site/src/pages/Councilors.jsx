import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Text } from "../ui.jsx";
import { assetUrl, useContent } from "../ContentContext.jsx";
import { EditPicture, EditText, patchItem } from "../EditControls.jsx";

// The council always has 9 seats, laid out like a council table: eight seats in two rows of four
// on the left, and the ninth seat alone on the right.
// Clicking a seat moves its skin up into a large island with the details beside it; Back returns it to the table.
// "Vacant" seats show an empty outline and no picture.
// While an admin is editing, every seat shows its fields and can be changed in place.
export default function Councilors() {
  const { content, editing, setSection } = useContent();
  // The open seat: its index, where its skin sat on screen, and the element to return it to.
  const [focus, setFocus] = useState(null);
  const seats = content.councilors.councilors;
  const main = seats.slice(0, 8);
  const side = seats.slice(8);

  const editSeat = (i, patch) => setSection("councilors", (c) => ({ ...c, councilors: patchItem(c.councilors, i, patch) }));

  function renderSeat(c, index) {
    return (
      <Seat
        key={index}
        c={c}
        index={index}
        editing={editing}
        onOpen={(from, source) => setFocus({ index, from, source })}
        onEdit={(patch) => editSeat(index, patch)}
      />
    );
  }

  const focused = focus && !editing ? seats[focus.index] : null;

  return (
    <section className="section page councilors-page">
      <h2 className="pixel">Councilors</h2>
      <div className="council-table">
        <div className="council-main">
          {main.map((c, i) => renderSeat(c, i))}
        </div>
        <div className="council-side">
          {side.map((c, i) => renderSeat(c, 8 + i))}
        </div>
      </div>
      {focused && <Island c={focused} from={focus.from} source={focus.source} onDone={() => setFocus(null)} />}
    </section>
  );
}

// Defined outside Councilors so typing in a field doesn't remount it.
function Seat({ c, index, editing, onOpen, onEdit }) {
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

  function open(e) {
    const picture = e.currentTarget.querySelector(".seat-skin");
    onOpen(picture.getBoundingClientRect(), picture);
  }

  return (
    <div
      className={`seat${vacant ? " vacant" : ""}`}
      role={vacant ? undefined : "button"}
      tabIndex={vacant ? undefined : 0}
      onClick={vacant ? undefined : open}
      onKeyDown={vacant ? undefined : (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(e); } }}
    >
      {c.picture ? (
        <img className="seat-skin" src={assetUrl(c.picture)} alt={`${c.name} full skin`} loading="lazy" />
      ) : (
        <div className="seat-skin seat-empty" aria-hidden="true" />
      )}
      <Text value={c.name} as="h3" className={vacant ? "vacant" : undefined} />
    </div>
  );
}

// Moves a rectangle's element from one screen box to another with a transform (FLIP).
function flipTo(el, from, to) {
  const dx = from.left - to.left;
  const dy = from.top - to.top;
  const sx = from.width / to.width;
  const sy = from.height / to.height;
  el.style.transformOrigin = "0 0";
  el.style.transition = "none";
  el.style.transform = `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`;
  el.getBoundingClientRect(); // make the browser apply the start position before animating
}

// The large island: skin on the left, details on the right, with a Back button.
function Island({ c, from, source, onDone }) {
  const skin = useRef(null);
  const island = useRef(null);
  const backBtn = useRef(null);
  const closing = useRef(false);
  const vacant = c.name === "Vacant";

  // Fly the skin from its seat into the island.
  useLayoutEffect(() => {
    const el = skin.current;
    if (!el || !from) return;
    flipTo(el, from, el.getBoundingClientRect());
    el.style.transition = "transform .55s cubic-bezier(.2, .8, .2, 1)";
    el.style.transform = "none";
  }, []);

  // Lock page scrolling while the island is open, and focus Back.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    backBtn.current?.focus();
    return () => { document.body.style.overflow = prev; };
  }, []);

  function back() {
    if (closing.current) return;
    closing.current = true;
    const el = skin.current;
    const home = source?.getBoundingClientRect();
    if (el && home && home.width) {
      const now = el.getBoundingClientRect();
      el.style.transformOrigin = "0 0";
      el.style.transition = "transform .45s cubic-bezier(.4, 0, .2, 1)";
      el.style.transform = `translate(${home.left - now.left}px, ${home.top - now.top}px) scale(${home.width / now.width}, ${home.height / now.height})`;
    }
    if (island.current) {
      island.current.style.transition = "opacity .4s ease";
      island.current.style.opacity = "0";
    }
    setTimeout(onDone, 450);
  }

  useEffect(() => {
    function onKey(e) { if (e.key === "Escape") back(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div className="focus-backdrop" role="dialog" aria-modal="true" aria-label={`${c.name} details`}>
      <div className="island" ref={island}>
        <button ref={backBtn} type="button" className="focus-back" onClick={back}>← Back</button>
        <div className="focus-stage">
          {c.picture ? (
            <img ref={skin} className="focus-skin" src={assetUrl(c.picture)} alt={`${c.name} full skin`} />
          ) : (
            <div className="focus-skin seat-empty" aria-hidden="true" />
          )}
        </div>
        <div className="focus-details">
          <Text value={c.name} as="h2" className={`pixel${vacant ? " vacant" : ""}`} />
          <Text value={c.territory} className="territory" />
          <Text value={c.description} />
        </div>
      </div>
    </div>
  );
}
