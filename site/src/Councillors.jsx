import data from "./content/councillors.json";

// Renders the Councillors page from content/councillors.json (7 seats; "Vacant" marks an empty seat).
// Text is shown as-is; anything marked PLACEHOLDER is highlighted so it's easy to spot.
function isPlaceholder(text) {
  return String(text).includes("PLACEHOLDER");
}

function Text({ value, as: Tag = "p", className }) {
  return <Tag className={isPlaceholder(value) ? `${className || ""} placeholder-tag`.trim() : className}>{value}</Tag>;
}

export default function Councillors() {
  return (
    <>
      <header className="site-header">
        <nav className="nav" aria-label="Main">
          <a className="brand" href="/">
            <span>Smilingbee</span>
          </a>
        </nav>
      </header>

      <main>
        <section className="section page">
          <div className="container">
            <h2 className="pixel">Councillors</h2>
            <div className="gallery councillor-grid">
              {data.councillors.map((c, i) => (
                <article className="card councillor" key={i}>
                  {c.picture && <img src={`/councillors/${c.picture}`} alt={c.name} loading="lazy" />}
                  <Text value={c.name} as="h3" className={c.name === "Vacant" ? "vacant" : undefined} />
                  <Text value={c.territory} className="territory" />
                  <Text value={c.description} className={c.name === "Vacant" ? "vacant" : undefined} />
                </article>
              ))}
            </div>
            <p className="join">
              <a href={data.discord} target="_blank" rel="noopener noreferrer">Join the Discord</a>
            </p>
          </div>
        </section>
      </main>
    </>
  );
}
