import { useEffect, useState } from "react";
import data from "../content/gallery.json";
import { Text } from "../ui.jsx";

// Thumbnail grid. Clicking a picture opens it in a lightbox (arrow keys and Esc work too).
export default function Gallery() {
  const [current, setCurrent] = useState(null);
  const count = data.images.length;
  const base = import.meta.env.BASE_URL;

  useEffect(() => {
    if (current === null) return;
    function onKey(e) {
      if (e.key === "Escape") setCurrent(null);
      if (e.key === "ArrowRight") setCurrent((i) => (i + 1) % count);
      if (e.key === "ArrowLeft") setCurrent((i) => (i - 1 + count) % count);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [current, count]);

  const shot = current === null ? null : data.images[current];

  return (
    <section className="section page">
      <div className="container">
        <h2 className="pixel">Gallery</h2>
        <div className="gallery">
          {data.images.map((img, i) => (
            <button key={i} onClick={() => setCurrent(i)} aria-label={img.caption.replace("PLACEHOLDER — ", "")}>
              <img src={base + img.src} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      </div>

      {shot && (
        <div className="lightbox" role="dialog" aria-modal="true" aria-label="Image viewer">
          <button className="lb-close" aria-label="Close" onClick={() => setCurrent(null)}>✕</button>
          <button className="lb-prev" aria-label="Previous image" onClick={() => setCurrent((current - 1 + count) % count)}>‹</button>
          <figure>
            <img src={base + shot.src} alt="" />
            <Text value={shot.caption} as="figcaption" />
          </figure>
          <button className="lb-next" aria-label="Next image" onClick={() => setCurrent((current + 1) % count)}>›</button>
        </div>
      )}
    </section>
  );
}
