// JSON API: public content, admin login, profile, content editing and picture uploads.

import { ensureDatabase } from "./db.js";
import { DEFAULTS, KEYS, upgradeSaved, validateContent } from "./content.js";
import {
  createSession,
  deleteSession,
  hashPassword,
  readSessionToken,
  requireUser,
  sessionCookie,
  tokenHash,
  verifyPassword,
} from "./auth.js";
import { HttpError, json, readJson, requireSameOrigin } from "./http.js";

const MAX_FAILED_LOGINS = 5;
const LOCK_MINUTES = 15;
const USERNAME = /^[A-Za-z0-9_]{3,16}$/; // the same rules as a Minecraft name
const MIN_PASSWORD = 8;
const MAX_PICTURE_BYTES = 10 * 1024 * 1024;
const PICTURE_TYPES = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};

export async function handleApi(request, env) {
  try {
    await ensureDatabase(env);
    return await route(request, env);
  } catch (err) {
    if (err instanceof HttpError) return json({ error: err.message }, err.status);
    console.error(err);
    return json({ error: "Something went wrong. Try again." }, 500);
  }
}

async function route(request, env) {
  const { pathname } = new URL(request.url);
  const method = request.method;

  if (method === "GET" && pathname === "/api/content") {
    return publicContent(env);
  }
  if (pathname === "/api/admin/login" && method === "POST") return login(request, env);
  if (pathname === "/api/admin/logout" && method === "POST") return logout(request, env);
  if (pathname === "/api/admin/me" && method === "GET") {
    const { user } = await requireUser(request, env);
    return json(profile(user));
  }
  if (pathname === "/api/admin/account" && method === "POST") return changeAccount(request, env);
  if (pathname === "/api/admin/media" && method === "POST") return uploadPicture(request, env);

  const match = pathname.match(/^\/api\/admin\/content\/([a-z]+)$/);
  if (match && method === "PUT") return saveContent(request, env, match[1]);

  throw new HttpError(404, "Not found.");
}

function profile(user) {
  return { username: user.username, mustChangePassword: user.must_change_password === 1 };
}

async function publicContent(env) {
  const { results } = await env.DB.prepare("SELECT key, value FROM content").all();
  const saved = Object.fromEntries(results.map((row) => [row.key, JSON.parse(row.value)]));
  const content = {};
  for (const key of KEYS) content[key] = saved[key] !== undefined ? upgradeSaved(key, saved[key]) : DEFAULTS[key];
  return json(content);
}

async function login(request, env) {
  requireSameOrigin(request);
  const body = await readJson(request);
  const username = String(body.username ?? "").trim();
  const password = String(body.password ?? "");
  const user = await env.DB.prepare("SELECT * FROM users WHERE username_lc = ?")
    .bind(username.toLowerCase())
    .first();

  const now = Date.now();
  if (user && user.locked_until > now) {
    const minutes = Math.ceil((user.locked_until - now) / 60000);
    throw new HttpError(429, `Too many failed attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`);
  }

  const ok = user && password !== "" && (await verifyPassword(password, user.password_hash));
  if (!ok) {
    if (user) {
      const failed = user.failed_logins + 1;
      const lockedUntil = failed >= MAX_FAILED_LOGINS ? now + LOCK_MINUTES * 60000 : 0;
      await env.DB.prepare("UPDATE users SET failed_logins = ?, locked_until = ? WHERE id = ?")
        .bind(failed >= MAX_FAILED_LOGINS ? 0 : failed, lockedUntil, user.id)
        .run();
    }
    throw new HttpError(401, "Wrong username or password.");
  }

  await env.DB.prepare("UPDATE users SET failed_logins = 0, locked_until = 0 WHERE id = ?").bind(user.id).run();
  await env.DB.prepare("DELETE FROM sessions WHERE expires_at <= ?").bind(now).run();
  const token = await createSession(env, user.id);
  return json(profile(user), 200, { "Set-Cookie": sessionCookie(token) });
}

async function logout(request, env) {
  requireSameOrigin(request);
  const token = readSessionToken(request);
  if (token) await deleteSession(env, token);
  return json({ ok: true }, 200, { "Set-Cookie": sessionCookie("", 0) });
}

async function changeAccount(request, env) {
  requireSameOrigin(request);
  const { user, token } = await requireUser(request, env);
  const body = await readJson(request);
  const currentPassword = String(body.currentPassword ?? "");
  if (!(await verifyPassword(currentPassword, user.password_hash))) {
    throw new HttpError(400, "The current password is wrong.");
  }

  const columns = [];
  const values = [];
  let newPasswordHash = null;

  if (body.username !== undefined) {
    const username = String(body.username).trim();
    if (!USERNAME.test(username)) {
      throw new HttpError(400, "Usernames use 3 to 16 letters, digits or underscores, like a Minecraft name.");
    }
    if (username !== user.username) {
      const taken = await env.DB.prepare("SELECT id FROM users WHERE username_lc = ? AND id != ?")
        .bind(username.toLowerCase(), user.id)
        .first();
      if (taken) throw new HttpError(409, "That username is already taken.");
      columns.push("username = ?", "username_lc = ?");
      values.push(username, username.toLowerCase());
    }
  }

  if (body.newPassword !== undefined) {
    const newPassword = String(body.newPassword);
    if (newPassword.length < MIN_PASSWORD) {
      throw new HttpError(400, `The new password must be at least ${MIN_PASSWORD} characters.`);
    }
    if (newPassword.length > 200) throw new HttpError(400, "The new password is too long.");
    newPasswordHash = await hashPassword(newPassword);
    columns.push("password_hash = ?", "must_change_password = 0");
    values.push(newPasswordHash);
  }

  if (columns.length === 0) throw new HttpError(400, "Nothing to change.");

  await env.DB.prepare(`UPDATE users SET ${columns.join(", ")} WHERE id = ?`)
    .bind(...values, user.id)
    .run();

  // A new password signs out every other browser; this one stays logged in.
  if (newPasswordHash) {
    await env.DB.prepare("DELETE FROM sessions WHERE user_id = ? AND token_hash != ?")
      .bind(user.id, await tokenHash(token))
      .run();
  }

  const updated = await env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(user.id).first();
  return json(profile(updated));
}

async function saveContent(request, env, key) {
  requireSameOrigin(request);
  const { user } = await requireUser(request, env);
  if (!KEYS.includes(key)) throw new HttpError(404, "Unknown section.");
  const body = await readJson(request);
  const value = validateContent(key, body);
  await env.DB.prepare(
    `INSERT INTO content (key, value, updated_at, updated_by) VALUES (?, ?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at, updated_by = excluded.updated_by`
  )
    .bind(key, JSON.stringify(value), Date.now(), user.username)
    .run();
  return json({ key, value });
}

async function uploadPicture(request, env) {
  requireSameOrigin(request);
  await requireUser(request, env);
  const ext = PICTURE_TYPES[(request.headers.get("Content-Type") || "").split(";")[0].trim()];
  if (!ext) throw new HttpError(415, "Pictures must be PNG, JPG, WebP or GIF.");
  const bytes = await request.arrayBuffer();
  if (bytes.byteLength === 0) throw new HttpError(400, "The picture is empty.");
  if (bytes.byteLength > MAX_PICTURE_BYTES) throw new HttpError(413, "Pictures can be at most 10 MB.");
  const name = `${crypto.randomUUID()}.${ext}`;
  await env.MEDIA.put(name, bytes, { httpMetadata: { contentType: request.headers.get("Content-Type").split(";")[0].trim() } });
  return json({ url: `/media/${name}` });
}
