# Smilingbee — server website

The website for the Smilingbee Minecraft server: Home, History, Lore, Councilors and Gallery.
Built with Vite + React. The site lives in `site/`.

## Folder layout

```
site/                 React source (edit here)
  src/content/        ← ALL the text lives here (JSON)
    site.json         server name, tagline, welcome text, highlights, Discord link, footer
    history.json      timeline entries
    lore.json         stories, places, factions
    councilors.json  the 7 council seats ("Vacant" marks an empty seat)
    gallery.json      list of pictures
  src/pages/          one file per page
  public/             pictures and images served as-is (councilors/, gallery/, images/)
worker/               Worker code: JSON API, admin login, picture uploads (see below)
dist/                 built site (generated; this is what the Worker serves)
wrangler.jsonc        Cloudflare Worker config (serves dist/, binds D1 and R2)
```

## Admin area (hidden)

`/admin` is not linked anywhere on the site. It asks for a username and password. Starting account:
username `MipElysium`, starting password `123`, which must be changed on first login (My profile tab).

- **Edit website**: home text and highlights, history, lore, councilors (seven seats, type `Vacant` to empty one), gallery. Save each section; pictures are uploaded from the page.
- **My profile**: change username (3 to 16 letters, digits or underscores) and password (at least 8 characters).

Where things live:
- D1 database `smilingbee-admin`: admin accounts (passwords stored as PBKDF2 hashes), login sessions, and saved website text. The tables are created automatically on the first request.
- R2 bucket `smilingbee-media`: uploaded pictures, served from `/media/...`.
- Website text that has never been saved from the admin page comes from the JSON files in `site/src/content/`.
- After 5 wrong passwords an account is locked for 15 minutes.

Local testing: `npx wrangler dev` (uses a local copy of the database and bucket, not the live ones).

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
Changes made in the admin page are saved to the database and do not need a rebuild.

## Previewing locally

```
cd site
npm run dev          # http://localhost:5173
```
