import site from "../content/site.json";
import { Text } from "../ui.jsx";

const EXPLORE = [
  { href: "/history", icon: "⏳", title: "History", text: "How the server grew, season by season." },
  { href: "/lore", icon: "📜", title: "Lore", text: "Stories, places and factions of the world." },
  { href: "/councilors", icon: "🏛️", title: "Councilors", text: "Meet the seven seats of the council." },
  { href: "/gallery", icon: "🖼️", title: "Gallery", text: "Screenshots from around the world." },
];

export default function Home() {
  return (
    <>
      <section className="hero" id="home">
        <div className="hero-inner">
          <h1 className="pixel">{site.serverName}</h1>
          <Text value={site.tagline} className="tagline" />
          <div className="welcome">
            {site.welcome.map((p, i) => <Text key={i} value={p} />)}
          </div>
          <div className="highlights">
            {site.highlights.map((h, i) => (
              <div className="highlight" key={i}>
                <div className="icon" aria-hidden="true">{h.icon}</div>
                <Text value={h.title} as="h3" />
                <Text value={h.text} />
              </div>
            ))}
          </div>
        </div>
        <div className="grass-edge" aria-hidden="true" />
      </section>

      <section className="section">
        <div className="container">
          <h2 className="pixel">Explore</h2>
          <div className="explore">
            {EXPLORE.map((e) => (
              <a className="explore-card" href={e.href} key={e.href}>
                <span className="icon" aria-hidden="true">{e.icon}</span>
                <span className="pixel">{e.title}</span>
                <span>{e.text}</span>
              </a>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
