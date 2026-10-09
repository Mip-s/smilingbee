import data from "../content/councilors.json";
import { Text } from "../ui.jsx";

// The council always has 7 seats. Each seat is one full-width card: details on the left, full skin on the right.
// "Vacant" marks an empty seat, which has no picture.
export default function Councilors() {
  return (
    <section className="section page councilors-page">
      <h2 className="pixel">Councilors</h2>
      <div className="councilor-list">
        {data.councilors.map((c, i) => {
          const vacant = c.name === "Vacant";
          return (
            <article className="card councilor" key={i}>
              <div className="details">
                <Text value={c.name} as="h3" className={vacant ? "vacant" : undefined} />
                <Text value={c.territory} className="territory" />
                <Text value={c.description} className={vacant ? "vacant" : undefined} />
              </div>
              {c.picture && (
                <figure className="skin">
                  <img src={`${import.meta.env.BASE_URL}councilors/${c.picture}`} alt={`${c.name} full skin`} loading="lazy" />
                </figure>
              )}
            </article>
          );
        })}
      </div>
      <p className="join">
        <a href={data.discord} target="_blank" rel="noopener noreferrer">Join the Discord</a>
      </p>
    </section>
  );
}
