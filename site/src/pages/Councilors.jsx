import { useState } from "react";
import data from "../content/councilors.json";
import { Text } from "../ui.jsx";

// The council always has 7 seats, laid out like a council table: six seats in two rows of three
// on the left, and the seventh seat alone on the right, separated by a line.
// Clicking a seat opens its details in place. "Vacant" seats show an empty outline and no picture.
export default function Councilors() {
  const [open, setOpen] = useState(null);
  const base = import.meta.env.BASE_URL;
  const seats = data.councilors;
  const main = seats.slice(0, 6);
  const side = seats.slice(6);

  function Seat({ c, index }) {
    const vacant = c.name === "Vacant";
    const isOpen = open === index;
    const toggle = () => setOpen(isOpen ? null : index);
    return (
      <div
        className={`seat${vacant ? " vacant" : ""}${isOpen ? " open" : ""}`}
        role={vacant ? undefined : "button"}
        tabIndex={vacant ? undefined : 0}
        aria-expanded={vacant ? undefined : isOpen}
        onClick={vacant ? undefined : toggle}
        onKeyDown={vacant ? undefined : (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); } }}
      >
        {c.picture ? (
          <img className="seat-skin" src={`${base}councilors/${c.picture}`} alt={`${c.name} full skin`} loading="lazy" />
        ) : (
          <div className="seat-skin seat-empty" aria-hidden="true" />
        )}
        <Text value={c.name} as="h3" className={vacant ? "vacant" : undefined} />
        {isOpen && (
          <div className="seat-details">
            <Text value={c.territory} className="territory" />
            <Text value={c.description} />
          </div>
        )}
      </div>
    );
  }

  return (
    <section className="section page councilors-page">
      <h2 className="pixel">Councilors</h2>
      <div className="council-table">
        <div className="council-main">
          {main.map((c, i) => <Seat key={i} c={c} index={i} />)}
        </div>
        <div className="council-side">
          {side.map((c, i) => <Seat key={6 + i} c={c} index={6 + i} />)}
        </div>
      </div>
      <p className="join">
        <a href={data.discord} target="_blank" rel="noopener noreferrer">Join the Discord</a>
      </p>
    </section>
  );
}
