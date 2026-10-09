import data from "../content/councillors.json";
import { Text } from "../ui.jsx";

// The council always has 7 seats. Each entry is one seat; "Vacant" marks an empty one.
export default function Councillors() {
  return (
    <section className="section page">
      <div className="container">
        <h2 className="pixel">Councillors</h2>
        <div className="gallery councillor-grid">
          {data.councillors.map((c, i) => {
            const vacant = c.name === "Vacant";
            return (
              <article className="card councillor" key={i}>
                {c.picture && (
                  <img src={`${import.meta.env.BASE_URL}councillors/${c.picture}`} alt={c.name} loading="lazy" />
                )}
                <Text value={c.name} as="h3" className={vacant ? "vacant" : undefined} />
                <Text value={c.territory} className="territory" />
                <Text value={c.description} className={vacant ? "vacant" : undefined} />
              </article>
            );
          })}
        </div>
        <p className="join">
          <a href={data.discord} target="_blank" rel="noopener noreferrer">Join the Discord</a>
        </p>
      </div>
    </section>
  );
}
