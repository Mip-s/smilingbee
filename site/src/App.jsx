import { useState } from "react";
import { Text } from "./ui.jsx";
import { useContent, assetUrl } from "./ContentContext.jsx";
import Home from "./pages/Home.jsx";
import History from "./pages/History.jsx";
import Lore from "./pages/Lore.jsx";
import Councilors from "./pages/Councilors.jsx";
import Gallery from "./pages/Gallery.jsx";
import DiscordCard from "./DiscordCard.jsx";

// Each page is picked from the URL path (/history, /lore, ...). Unknown paths show a short message.
const PAGES = {
  "": { title: "Home", Component: Home },
  history: { title: "History", Component: History },
  lore: { title: "Lore", Component: Lore },
  councilors: { title: "Councilors", Component: Councilors },
  gallery: { title: "Gallery", Component: Gallery },
};

function currentPage() {
  const key = window.location.pathname.replace(/\.html$/, "").replace(/^\/+|\/+$/g, "");
  return PAGES[key] ? key : null;
}

export default function App() {
  const key = currentPage();
  const [menuOpen, setMenuOpen] = useState(false);
  const content = useContent();
  const page = key === null ? null : PAGES[key];
  const Page = page ? page.Component : null;

  return (
    <>
      <header className="site-header">
        <nav className="nav" aria-label="Main">
          <a className="brand" href="/">
            <img src={assetUrl("images/bee.png")} alt="" width="28" height="28" />
            <span>{content?.site.serverName}</span>
          </a>
          <button
            className="nav-toggle"
            aria-expanded={menuOpen}
            aria-controls="nav-links"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((open) => !open)}
          >
            ☰
          </button>
          <ul id="nav-links" className={`nav-links${menuOpen ? " open" : ""}`}>
            {Object.entries(PAGES).map(([path, { title }]) => (
              <li key={path}>
                <a href={`/${path}`} aria-current={path === key ? "page" : undefined}>{title}</a>
              </li>
            ))}
            <li>
              <a href={content?.site.discord} target="_blank" rel="noopener noreferrer">Discord</a>
            </li>
          </ul>
        </nav>
      </header>

      <main>{content && (Page ? <Page /> : <NotFound />)}</main>

      {content && <DiscordCard discord={content.site.discord} />}

      {content && (
        <footer className="site-footer">
          <Text value={content.site.footer} />
        </footer>
      )}
    </>
  );
}

function NotFound() {
  return (
    <section className="section page">
      <div className="container">
        <h2 className="pixel">Page not found</h2>
        <p><a href="/">Back to the home page</a></p>
      </div>
    </section>
  );
}
