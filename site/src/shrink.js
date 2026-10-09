// Shrinks a large picture in the browser before it is uploaded, so the upload limit is rarely reached.
// Small files and animated GIFs are sent untouched. Pixel-art skins are small enough to skip this.
const SHRINK_OVER_BYTES = 2 * 1024 * 1024;
const MAX_EDGE = 2048;

export async function shrinkPicture(file) {
  if (file.size <= SHRINK_OVER_BYTES || file.type === "image/gif" || !file.type.startsWith("image/")) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close?.();
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/webp", 0.9));
    // Keep the original if re-encoding didn't make it smaller.
    if (!blob || blob.size >= file.size) return file;
    const ext = blob.type === "image/webp" ? "webp" : "png";
    return new File([blob], `${file.name.replace(/\.[^.]+$/, "")}.${ext}`, { type: blob.type });
  } catch {
    return file; // the browser couldn't read it; the server will check the size as before
  }
}
