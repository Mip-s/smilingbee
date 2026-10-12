// Shows the text of a multi-line field with its formatting. The admin marks text with a few simple signs:
//   **bold**   *italic*   [large]bigger text[/large]   [small]smaller text[/small]
//   "# " at the start of a line: heading;  "## ": smaller heading;  "- " or "* " at the start: bullet point.
// Line breaks typed in the field are kept. Nothing is read as HTML: React escapes the text, and only the
// elements listed here are created, so no script or markup from the field can reach the page.
const BLOCK = /^(#{1,2} |[-*] )/;

// Breaks plain text into lines, with a <br /> where each new line starts.
function plainLines(text, key) {
  const parts = text.split("\n");
  const out = [];
  parts.forEach((part, i) => {
    if (i > 0) out.push(<br key={`${key}-br${i}`} />);
    if (part !== "") out.push(part);
  });
  return out;
}

// Handles the inline marks. Each mark can hold other marks, so **bold [large]text[/large]** works.
function inline(text, key = "") {
  const pattern = /\*\*([\s\S]+?)\*\*|\*(?!\s)([^*\n]+?)(?<!\s)\*|\[large\]([\s\S]+?)\[\/large\]|\[small\]([\s\S]+?)\[\/small\]/g;
  const out = [];
  let last = 0;
  let n = 0;
  let match;
  while ((match = pattern.exec(text))) {
    if (match.index > last) out.push(...plainLines(text.slice(last, match.index), `${key}t${n}`));
    const k = `${key}m${n++}`;
    if (match[1] !== undefined) out.push(<strong key={k}>{inline(match[1], k)}</strong>);
    else if (match[2] !== undefined) out.push(<em key={k}>{inline(match[2], k)}</em>);
    else if (match[3] !== undefined) out.push(<span key={k} className="md-large">{inline(match[3], k)}</span>);
    else out.push(<span key={k} className="md-small">{inline(match[4], k)}</span>);
    last = pattern.lastIndex;
  }
  if (last < text.length) out.push(...plainLines(text.slice(last), `${key}t${n}`));
  return out;
}

// Turns the text of a field into React elements: headings, bullet lists and lines of inline text.
export function richNodes(value) {
  const rows = String(value ?? "").split("\n");
  while (rows.length && rows[rows.length - 1].trim() === "") rows.pop();

  const out = [];
  let items = null;
  const flushList = () => {
    if (items) out.push(<ul className="md-list" key={`list${out.length}`}>{items}</ul>);
    items = null;
  };

  rows.forEach((row, i) => {
    const key = `r${i}`;
    const bullet = /^[-*] (.*)$/.exec(row);
    if (bullet) {
      items = [...(items ?? []), <li key={key}>{inline(bullet[1], key)}</li>];
      return;
    }
    flushList();
    const heading = /^(#{1,2}) (.*)$/.exec(row);
    if (heading) {
      const level = heading[1].length;
      const Tag = level === 1 ? "h3" : "h4";
      out.push(<Tag key={key} className={`md-heading md-${level}`}>{inline(heading[2], key)}</Tag>);
      return;
    }
    out.push(...inline(row, key));
    // A line break between two lines of text; blocks already start on a new line.
    if (i < rows.length - 1 && !BLOCK.test(rows[i + 1])) out.push(<br key={`${key}-end`} />);
  });
  flushList();
  return out;
}

// Drop-in for Text, for fields that can hold several lines and formatting.
export function Rich({ value, as: Tag = "p", className = "" }) {
  const text = String(value ?? "");
  const hasBlocks = text.split("\n").some((row) => BLOCK.test(row));
  // Headings and lists cannot sit inside a paragraph, so such text uses a plain box instead.
  const Wrapper = hasBlocks && Tag === "p" ? "div" : Tag;
  const classes = [className, hasBlocks ? "rich-blocks" : "", text.includes("PLACEHOLDER") ? "placeholder-tag" : ""].filter(Boolean);
  return <Wrapper className={classes.join(" ") || undefined}>{richNodes(text)}</Wrapper>;
}
