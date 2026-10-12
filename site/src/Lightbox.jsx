// A full-screen picture viewer, shared by the gallery, history entries and archive cards.
// Clicking a picture opens it; the arrows (or the arrow keys) step through that card's pictures; Escape closes it.
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { assetUrl } from "./ContentContext.jsx";

export function Lightbox({ pictures, index, onIndex, onClose }) {
  const count = pictures.length;
  const shot = pictures[index];

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
      if (count > 1 && e.key === "ArrowRight") onIndex((index + 1) % count);
      if (count > 1 && e.key === "ArrowLeft") onIndex((index - 1 + count) % count);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [count, index, onIndex, onClose]);

  return createPortal(
    <div className="lightbox" role="dialog" aria-modal="true" aria-label="Image viewer">
      <button className="lb-close" aria-label="Close" onClick={onClose}>✕</button>
      {count > 1 && (
        <button className="lb-prev" aria-label="Previous image" onClick={() => onIndex((index - 1 + count) % count)}>‹</button>
      )}
      <figure>
        <img src={assetUrl(shot.src)} alt={shot.alt ?? ""} />
        {shot.caption && <figcaption className="pre-line">{shot.caption}</figcaption>}
      </figure>
      {count > 1 && (
        <button className="lb-next" aria-label="Next image" onClick={() => onIndex((index + 1) % count)}>›</button>
      )}
    </div>,
    document.body
  );
}
