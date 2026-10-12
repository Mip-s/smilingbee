import { useState } from "react";
import { assetUrl, useContent } from "../ContentContext.jsx";
import { AddPicture, EditPicture, EditText, ItemControls, moveItem, patchItem, removeItem } from "../EditControls.jsx";
import { Lightbox } from "../Lightbox.jsx";

// Thumbnail grid. Clicking a picture opens it in a lightbox (arrow keys and Esc work too).
// While an admin is editing, pictures show their captions and controls instead, and the lightbox is off.
export default function Gallery() {
  const { content, editing, setSection } = useContent();
  const [current, setCurrent] = useState(null);
  const images = content.gallery.images;
  const count = images.length;
  const edit = (change) => setSection("gallery", change);

  const viewing = current !== null && !editing;

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
                <EditText value={img.caption} max={200} multiline label="Caption" onChange={(v) => edit((g) => ({ ...g, images: patchItem(g.images, i, { caption: v }) }))} />
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

      {viewing && (
        <Lightbox pictures={images} index={current} onIndex={setCurrent} onClose={() => setCurrent(null)} />
      )}
    </section>
  );
}
