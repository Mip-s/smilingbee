// A row of pictures on one card or history entry. Visitors flip through them with the arrows, a swipe, or
// let them change by themselves every few seconds. While an admin is editing, the same pictures can be
// moved, removed and added to here, and the automatic change is paused.
import { useEffect, useState } from "react";
import { assetUrl, useContent } from "./ContentContext.jsx";
import { api } from "./admin/api.js";
import { shrinkPicture } from "./shrink.js";

const PICTURE_TYPES = "image/png,image/jpeg,image/webp,image/gif";
const CHANGE_EVERY_MS = 3000;
const SWIPE_PX = 40;

export function PictureCarousel({ images = [], alt = "", onChange }) {
  const { editing } = useContent();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false); // hovered or focused
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [touchX, setTouchX] = useState(null);

  const count = images.length;
  const i = count ? Math.min(index, count - 1) : 0;
  const shown = images[i];

  // Change the picture every few seconds. Stops while hovered, focused, editing, or if the visitor asked for less motion.
  // Restarts after each manual change, so a click gets a full pause before the next automatic change.
  useEffect(() => {
    if (count < 2 || editing || paused) return undefined;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return undefined;
    const timer = setInterval(() => setIndex((n) => (n + 1) % count), CHANGE_EVERY_MS);
    return () => clearInterval(timer);
  }, [count, editing, paused, index]);

  if (!editing && count === 0) return null;

  function step(by) {
    setIndex((i + by + count) % count);
  }

  function swipe(endX) {
    if (touchX === null || count < 2) return;
    const dx = endX - touchX;
    if (Math.abs(dx) >= SWIPE_PX) step(dx < 0 ? 1 : -1);
    setTouchX(null);
  }

  function move(by) {
    const to = i + by;
    if (to < 0 || to >= count) return;
    const copy = [...images];
    [copy[i], copy[to]] = [copy[to], copy[i]];
    onChange(copy);
    setIndex(to);
  }

  function remove() {
    if (!window.confirm("Remove this picture?")) return;
    onChange(images.filter((_, j) => j !== i));
    setIndex(Math.max(0, i - 1));
  }

  async function add(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const { url } = await api("/api/admin/media", { method: "POST", file: await shrinkPicture(file) });
      onChange([...images, url]);
      setIndex(count);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="carousel">
      {shown ? (
        <div
          className="carousel-stage"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocus={() => setPaused(true)}
          onBlur={() => setPaused(false)}
          onTouchStart={(e) => setTouchX(e.touches[0].clientX)}
          onTouchEnd={(e) => swipe(e.changedTouches[0].clientX)}
        >
          <img src={assetUrl(shown)} alt={count > 1 ? `${alt} (picture ${i + 1} of ${count})` : alt} loading="lazy" />
          {count > 1 && (
            <>
              <button type="button" className="carousel-arrow prev" aria-label="Previous picture" onClick={() => step(-1)}>‹</button>
              <button type="button" className="carousel-arrow next" aria-label="Next picture" onClick={() => step(1)}>›</button>
            </>
          )}
        </div>
      ) : (
        <div className="carousel-empty">No pictures yet</div>
      )}

      {editing && (
        <div className="edit-controls" role="group" aria-label="Pictures">
          <button type="button" className="edit-chip" onClick={() => move(-1)} disabled={!shown || i === 0}>◀ Move left</button>
          <button type="button" className="edit-chip" onClick={() => move(1)} disabled={!shown || i === count - 1}>Move right ▶</button>
          <button type="button" className="edit-chip danger" onClick={remove} disabled={!shown}>Remove picture</button>
          <label className="edit-chip">
            {busy ? "Uploading…" : "+ Add picture"}
            <input type="file" accept={PICTURE_TYPES} onChange={add} disabled={busy} hidden />
          </label>
        </div>
      )}
      {error && <p className="edit-error" role="alert">{error}</p>}
    </div>
  );
}
