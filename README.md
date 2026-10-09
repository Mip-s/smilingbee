# Smilingbee — server website

The website for the Smilingbee Minecraft server: Home, History, Archives (formerly Realms and Lore), Councilors and Gallery.
Built with Vite + React. The site lives in `site/`.

## Folder layout

```
site/                 React source (edit here)
  src/content/        ← ALL the text lives here (JSON)
    site.json         server name, tagline, welcome text, highlights, Discord link, footer
    history.json      timeline entries
    lore.json         moments and factions (each can hold several pictures)
    councilors.json  the 9 council seats ("Vacant" marks an empty seat)
    gallery.json      list of pictures
  src/pages/          one file per page
  src/EditControls.jsx  in-place editing controls (admins only)
  src/admin/          the /admin login and My profile page
  public/             pictures and images served as-is (councilors/, gallery/, images/)
worker/               Worker code: JSON API, admin login, picture uploads (see below)
dist/                 built site (generated; this is what the Worker serves)
wrangler.jsonc        Cloudflare Worker config (serves dist/, binds D1 and R2)
```

## Admin area (hidden)

`/admin` is not linked anywhere on the site. It asks for a username and password. Starting account:
username `MipElysium`, starting password `123`, which must be changed on first login (My profile).

- **Editing happens on the real pages.** After logging in at `/admin`, press **Open the website to edit**
  (or open the site while logged in and press **Edit this website** in the bar at the bottom). Click any
  text or picture to change it. Use the ▲ ▼ and Delete buttons on items, and the **+ Add** buttons for new
  paragraphs, highlights, history entries, archives (moments and factions), history entries and gallery pictures. Cards and entries can hold several pictures; visitors flip through them with the arrows.
  Changes are kept as drafts until **Save changes** is pressed; **Discard** throws them away.
- **My profile** (on `/admin`): change username (3 to 16 letters, digits or underscores) and password (at least 8 characters).
- Councilors: always nine seats. A seat is emptied with **Empty this seat**, which makes it Vacant.

Where things live:
- D1 database `smilingbee-admin`: admin accounts (passwords stored as PBKDF2 hashes), login sessions, and saved website text. The tables are created automatically on the first request.
- R2 bucket `smilingbee-media`: uploaded pictures, served from `/media/...`.
- Website text that has never been saved from the admin tools comes from the JSON files in `site/src/content/`.
- After 5 wrong passwords an account is locked for 15 minutes.

Local testing: `npx wrangler dev` (uses a local copy of the database and bucket, not the live ones).

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
Changes made in the admin editor are saved to the database and do not need a rebuild.

## Previewing locally

```
cd site
npm run dev          # http://localhost:5173
```
