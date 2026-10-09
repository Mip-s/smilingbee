import { Text } from "../ui.jsx";
import { useContent, assetUrl } from "../ContentContext.jsx";

function Card({ title, text, image, className = "card", style }) {
  return (
    <article className={className} style={style}>
      {image && <img src={assetUrl(image)} alt={title} loading="lazy" />}
      <div className="body">
        <Text value={title} as="h4" />
        <Text value={text} />
      </div>
    </article>
  );
}

export default function Lore() {
  const data = useContent().lore;
  return (
    <section className="section page">
      <div className="container">
        <h2 className="pixel">Lore</h2>

        <h3 className="sub">Stories</h3>
        <div className="cards">
          {data.stories.map((s, i) => <Card key={i} title={s.title} text={s.text} />)}
        </div>

        <h3 className="sub">Places</h3>
        <div className="cards">
          {data.places.map((p, i) => <Card key={i} title={p.name} text={p.text} image={p.image} />)}
        </div>

        <h3 className="sub">Factions</h3>
        <div className="cards">
          {data.factions.map((f, i) => (
            <Card
              key={i}
              title={f.name}
              text={f.text}
              className="card faction"
              style={{ borderLeftColor: f.color }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
