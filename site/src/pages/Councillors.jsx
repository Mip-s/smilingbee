import data from "../content/councillors.json";
import { Text } from "../ui.jsx";

// The council always has 7 seats. Each seat is one full-width card: details on the left, full skin on the right.
// "Vacant" marks an empty seat, which has no picture.
export default function Councillors() {
  return (
    <section className="section page councillors-page">
      <h2 className="pixel">Councillors</h2>
      <div className="councillor-list">
        {data.councillors.map((c, i) => {
          const vacant = c.name === "Vacant";
          return (
            <article className="card councillor" key={i}>
              <div className="details">
                <Text value={c.name} as="h3" className={vacant ? "vacant" : undefined} />
                <Text value={c.territory} className="territory" />
                <Text value={c.description} className={vacant ? "vacant" : undefined} />
              </div>
              {c.picture && (
                <figure className="skin">
                  <img src={`${import.meta.env.BASE_URL}councillors/${c.picture}`} alt={`${c.name} full skin`} loading="lazy" />
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
