// The editable website content. The JSON files in site/src/content/ are the defaults. When an admin saves a
// section, the saved copy in the database takes its place. Every save is checked here before it is stored.

import site from "../site/src/content/site.json";
import history from "../site/src/content/history.json";
import lore from "../site/src/content/lore.json";
import councilors from "../site/src/content/councilors.json";
import gallery from "../site/src/content/gallery.json";
import { HttpError } from "./http.js";

export const DEFAULTS = { site, history, lore, councilors, gallery };
export const KEYS = Object.keys(DEFAULTS);

// A picture is either an uploaded file (/media/<id>.<ext>) or a file that ships with the site (folder/name.ext).
const UPLOADED = /^\/media\/[a-f0-9-]{36}\.(png|jpg|webp|gif)$/;
const SHIPPED = /^[a-z]+\/[A-Za-z0-9._-]+$/;
const COLOR = /^#[0-9a-fA-F]{6}$/;
const SEAT_NAME = /^[A-Za-z0-9_]{1,32}$/;
const SEATS = 9;

function fail(message) {
  throw new HttpError(400, message);
}

function asObject(value, where) {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail(`${where} is missing.`);
  return value;
}

function text(value, where, { max, min = 0 }) {
  if (typeof value !== "string") fail(`${where} must be text.`);
  const trimmed = value.trim();
  if (trimmed.length < min) fail(`${where} can't be empty.`);
  if (trimmed.length > max) fail(`${where} is too long (at most ${max} characters).`);
  return trimmed;
}

function list(value, where, max, item) {
  if (!Array.isArray(value)) fail(`${where} must be a list.`);
  if (value.length > max) fail(`${where} can have at most ${max} items.`);
  return value.map((entry, i) => item(entry, `${where} ${i + 1}`));
}

function picture(value, where, { required = false } = {}) {
  if (value === undefined || value === null || value === "") {
    if (required) fail(`${where} needs a picture.`);
    return "";
  }
  const path = text(value, where, { max: 200 });
  if (!UPLOADED.test(path) && !SHIPPED.test(path)) fail(`${where} is not a valid picture path.`);
  return path;
}

const validators = {
  site(value) {
    const s = asObject(value, "Site");
    const discord = text(s.discord, "Discord link", { max: 200 });
    if (!discord.startsWith("https://")) fail("The Discord link must start with https://");
    return {
      serverName: text(s.serverName, "Server name", { max: 60, min: 1 }),
      tagline: text(s.tagline, "Tagline", { max: 300 }),
      welcome: list(s.welcome, "Welcome paragraph", 10, (p, w) => text(p, w, { max: 1000 })),
      highlights: list(s.highlights, "Highlight", 6, (h, w) => {
        h = asObject(h, w);
        return {
          icon: text(h.icon, `${w} icon`, { max: 8 }),
          title: text(h.title, `${w} title`, { max: 80 }),
          text: text(h.text, `${w} text`, { max: 300 }),
        };
      }),
      discord,
      footer: text(s.footer, "Footer", { max: 500 }),
    };
  },

  history(value) {
    const h = asObject(value, "History");
    return {
      entries: list(h.entries, "History entry", 100, (e, w) => {
        e = asObject(e, w);
        return {
          date: text(e.date, `${w} date`, { max: 60 }),
          title: text(e.title, `${w} title`, { max: 120, min: 1 }),
          text: text(e.text, `${w} text`, { max: 2000 }),
        };
      }),
    };
  },

  lore(value) {
    const l = asObject(value, "Lore");
    return {
      stories: list(l.stories, "Story", 50, (s, w) => {
        s = asObject(s, w);
        return { title: text(s.title, `${w} title`, { max: 120, min: 1 }), text: text(s.text, `${w} text`, { max: 2000 }) };
      }),
      places: list(l.places, "Place", 50, (p, w) => {
        p = asObject(p, w);
        return {
          name: text(p.name, `${w} name`, { max: 120, min: 1 }),
          text: text(p.text, `${w} text`, { max: 2000 }),
          image: picture(p.image, `${w} picture`),
        };
      }),
      factions: list(l.factions, "Faction", 50, (f, w) => {
        f = asObject(f, w);
        const color = text(f.color, `${w} color`, { max: 7 });
        if (!COLOR.test(color)) fail(`${w} color must look like #f5b82e.`);
        return {
          name: text(f.name, `${w} name`, { max: 120, min: 1 }),
          color,
          text: text(f.text, `${w} text`, { max: 2000 }),
        };
      }),
    };
  },

  councilors(value) {
    const c = asObject(value, "Councilors");
    const seats = list(c.councilors, "Seat", SEATS, (s, w) => {
      s = asObject(s, w);
      const name = text(s.name, `${w} name`, { max: 32, min: 1 });
      if (!SEAT_NAME.test(name)) fail(`${w} name may only use letters, digits and underscores.`);
      return {
        name,
        territory: text(s.territory, `${w} territory`, { max: 80 }),
        description: text(s.description, `${w} description`, { max: 500 }),
        picture: picture(s.picture, `${w} picture`),
      };
    });
    if (seats.length !== SEATS) fail(`The council has exactly ${SEATS} seats. Type Vacant as the name for an empty seat.`);
    return { councilors: seats };
  },

  gallery(value) {
    const g = asObject(value, "Gallery");
    return {
      images: list(g.images, "Picture", 200, (img, w) => {
        img = asObject(img, w);
        return { src: picture(img.src, `${w}`, { required: true }), caption: text(img.caption, `${w} caption`, { max: 200 }) };
      }),
    };
  },
};

export function validateContent(key, value) {
  return validators[key](value);
}
