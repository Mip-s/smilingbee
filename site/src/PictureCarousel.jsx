// A row of pictures on one card or history entry. Visitors flip through them with the arrows.
// While an admin is editing, the same pictures can be moved, removed and added to here.
import { useState } from "react";
import { assetUrl, useContent } from "./ContentContext.jsx";
import { api } from "./admin/api.js";
import { shrinkPicture } from "./shrink.js";

const PICTURE_TYPES = "image/png,image/jpeg,image/webp,image/gif";

export function PictureCarousel({ images = [], alt = "", onChange }) {
  const { editing } = useContent();
  const [index, setIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const count = images.length;
  if (!editing && count === 0) return null;

  const i = count ? Math.min(index, count - 1) : 0;
  const shown = images[i];

  function step(by) {
    setIndex((i + by + count) % count);
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
        <div className="carousel-stage">
          <img src={assetUrl(shown)} alt={count > 1 ? `${alt} (picture ${i + 1} of ${count})` : alt} loading="lazy" />
          {count > 1 && (
            <>
              <button type="button" className="carousel-arrow prev" aria-label="Previous picture" onClick={() => step(-1)}>‹</button>
              <button type="button" className="carousel-arrow next" aria-label="Next picture" onClick={() => step(1)}>›</button>
              <span className="carousel-count" aria-hidden="true">{i + 1} / {count}</span>
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
