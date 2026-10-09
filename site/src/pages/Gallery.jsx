import { useEffect, useState } from "react";
import { Text } from "../ui.jsx";
import { assetUrl, useContent } from "../ContentContext.jsx";
import { AddPicture, EditPicture, EditText, ItemControls, moveItem, patchItem, removeItem } from "../EditControls.jsx";

// Thumbnail grid. Clicking a picture opens it in a lightbox (arrow keys and Esc work too).
// While an admin is editing, pictures show their captions and controls instead, and the lightbox is off.
export default function Gallery() {
  const { content, editing, setSection } = useContent();
  const [current, setCurrent] = useState(null);
  const images = content.gallery.images;
  const count = images.length;
  const edit = (change) => setSection("gallery", change);

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

  const shot = current === null || editing ? null : images[current] ?? null;

  return (
    <section className="section page">
      <div className="container">
        <h2 className="pixel">Gallery</h2>
        <div className="gallery">
          {images.map((img, i) =>
            editing ? (
              <figure className="gallery-edit" key={i}>
                <EditPicture
                  required
                  src={img.src}
                  alt=""
                  onChange={(v) => edit((g) => ({ ...g, images: patchItem(g.images, i, { src: v }) }))}
                />
                <EditText value={img.caption} max={200} label="Caption" onChange={(v) => edit((g) => ({ ...g, images: patchItem(g.images, i, { caption: v }) }))} />
                <ItemControls
                  label="picture"
                  index={i}
                  count={count}
                  onMove={(step) => edit((g) => ({ ...g, images: moveItem(g.images, i, step) }))}
                  onRemove={() => edit((g) => ({ ...g, images: removeItem(g.images, i) }))}
                />
              </figure>
            ) : (
              <button key={i} onClick={() => setCurrent(i)} aria-label={img.caption.replace("PLACEHOLDER — ", "")}>
                <img src={assetUrl(img.src)} alt="" loading="lazy" />
              </button>
            )
          )}
        </div>
        <AddPicture label="+ Add a picture" onAdd={(url) => edit((g) => ({ ...g, images: [...g.images, { src: url, caption: "" }] }))} />
      </div>

      {shot && (
        <div className="lightbox" role="dialog" aria-modal="true" aria-label="Image viewer">
          <button className="lb-close" aria-label="Close" onClick={() => setCurrent(null)}>✕</button>
          <button className="lb-prev" aria-label="Previous image" onClick={() => setCurrent((current - 1 + count) % count)}>‹</button>
          <figure>
            <img src={assetUrl(shot.src)} alt="" />
            <Text value={shot.caption} as="figcaption" />
          </figure>
          <button className="lb-next" aria-label="Next image" onClick={() => setCurrent((current + 1) % count)}>›</button>
        </div>
      )}
    </section>
  );
}
