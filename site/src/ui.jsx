// Shared bits used by every page.

// Any text containing "PLACEHOLDER" gets a dashed outline, so unfinished content is easy to spot.
export function Text({ value, as: Tag = "p", className = "" }) {
  const placeholder = String(value).includes("PLACEHOLDER");
  const classes = [className, placeholder ? "placeholder-tag" : ""].filter(Boolean).join(" ");
  return <Tag className={classes || undefined}>{value}</Tag>;
}
