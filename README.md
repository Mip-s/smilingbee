# Smilingbee — server website

The website for the Smilingbee Minecraft server: Home, History, Lore, Councillors and Gallery.
Built with Vite + React. The site lives in `site/`.

## Folder layout

```
site/                 React source (edit here)
  src/content/        ← ALL the text lives here (JSON)
    site.json         server name, tagline, welcome text, highlights, Discord link, footer
    history.json      timeline entries
    lore.json         stories, places, factions
    councillors.json  the 7 council seats ("Vacant" marks an empty seat)
    gallery.json      list of pictures
  src/pages/          one file per page
  public/             pictures and images served as-is (councillors/, gallery/, images/)
dist/                 built site (generated; this is what the Worker serves)
wrangler.jsonc        Cloudflare Worker config (serves dist/)
```

Anything marked **PLACEHOLDER** is example text and shows a dashed outline until replaced.

## Editing content

Edit the JSON files in `site/src/content/`. Keep the quotes, separate items with commas, and no comma
after the last item. Paste a file into https://jsonlint.com if the site stops loading.

## Build and deploy

```
cd site
npm install
npm run build        # writes ../dist
```

Commit the updated `dist/` together with the source. The Cloudflare Worker `smilingbee` deploys the
repo root on every push to `main` (`npx wrangler deploy`, no build step), so `dist/` must be up to date.

## Previewing locally

```
cd site
npm run dev          # http://localhost:5173
```
