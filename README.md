# Smilingbee — server website

A one-page introduction to the Smilingbee Minecraft server: Home, History, Lore, Hall of Fame and Gallery.
Plain HTML/CSS/JS — no build step, no dependencies.

## Folder layout

```
index.html          page structure (rarely needs editing)
css/style.css       look & colors (colors are at the top of the file)
js/main.js          loads the content files and draws the page
content/            ← ALL the text lives here
  site.json         server name, tagline, welcome text, highlights, footer
  history.json      timeline entries
  lore.json         stories, places, factions
  records.json      hall of fame
  gallery.json      list of screenshots
images/gallery/     screenshots (placeholder-*.svg are temporary)
```

Everything marked **PLACEHOLDER** is example text. While it's still there, it shows a faint dashed
outline on the page so you can spot what's left to replace.

## Adding content

Edit the JSON files in `content/` with any text editor. Rules of JSON: keep the quotes, separate items
with commas, and no comma after the last item. If a file has a mistake, that section shows a red error
box — paste the file into https://jsonlint.com to find the problem. The `"_note"` lines are just notes.

- **History** — add an object to `entries`: `{ "date": "Season 3", "title": "...", "text": "..." }`.
  They show in the order listed.
- **Lore** — add to `stories`, `places` or `factions`. `image` is optional (a path like
  `images/gallery/my-town.png`). Factions take a `color` (e.g. `"#f5b82e"`) for the card edge.
- **Hall of Fame** — add to `records`. Put a Minecraft username in `skin` to show that player's head
  (loaded from mc-heads.net), or leave it `""` for a trophy icon.
- **Gallery** — copy screenshots into `images/gallery/`, then add
  `{ "src": "images/gallery/my-shot.png", "caption": "..." }` to `images`. Optionally add
  `"thumb"` pointing to a smaller copy for faster loading. Delete the `placeholder-*.svg` entries
  (and files) once you have real screenshots. Tip: keep screenshots under ~1 MB each (JPG/WebP).

## Previewing locally

Because the page loads the JSON with `fetch`, opening `index.html` by double-clicking won't work.
Run a tiny local server from this folder instead, then open http://localhost:8000:

```
python -m http.server 8000
```

(or `npx serve .` if you have Node.)

## Deploying to Cloudflare Pages

1. Commit and push this folder to `github.com/Mip-s/smilingbee`.
2. In Cloudflare: **Workers & Pages → Create → Pages → Connect to Git**, pick the `smilingbee` repo.
3. Build settings:
   - **Framework preset:** None
   - **Build command:** *(leave empty)*
   - **Build output directory:** `/`
   - **Root directory:** *(leave empty)*
4. Save and Deploy. Every push to the main branch redeploys automatically.
