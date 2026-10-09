// Passwords and sessions for the admin area.
//
// Passwords are stored as PBKDF2-SHA256 hashes (see hashPassword). Login sessions use a random token that
// lives in an HttpOnly cookie; only a SHA-256 of the token is kept in the database.

import { HttpError } from "./http.js";

const ITERATIONS = 100000; // the most PBKDF2 iterations Workers allow
export const SESSION_COOKIE = "sb_admin";
export const SESSION_SECONDS = 60 * 60 * 24 * 7;

const enc = new TextEncoder();

function toBase64(bytes) {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

function fromBase64(text) {
  return Uint8Array.from(atob(text), (c) => c.charCodeAt(0));
}

function toHex(bytes) {
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function derive(password, salt, iterations) {
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations }, key, 256);
  return new Uint8Array(bits);
}

function sameBytes(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

export async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derive(password, salt, ITERATIONS);
  return `pbkdf2_sha256$${ITERATIONS}$${toBase64(salt)}$${toBase64(hash)}`;
}

export async function verifyPassword(password, stored) {
  const [scheme, iterations, salt, hash] = stored.split("$");
  if (scheme !== "pbkdf2_sha256") return false;
  const actual = await derive(password, fromBase64(salt), Number(iterations));
  return sameBytes(actual, fromBase64(hash));
}

async function sha256Hex(text) {
  return toHex(new Uint8Array(await crypto.subtle.digest("SHA-256", enc.encode(text))));
}

export function newSessionToken() {
  const token = toBase64(crypto.getRandomValues(new Uint8Array(32)));
  return token.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function tokenHash(token) {
  return sha256Hex(token);
}

export function readSessionToken(request) {
  const cookies = request.headers.get("Cookie") || "";
  const match = cookies.split(";").map((c) => c.trim()).find((c) => c.startsWith(`${SESSION_COOKIE}=`));
  return match ? match.slice(SESSION_COOKIE.length + 1) : null;
}

export function sessionCookie(token, maxAge = SESSION_SECONDS) {
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`;
}

// Returns the logged-in user row, or throws a 401.
export async function requireUser(request, env) {
  const token = readSessionToken(request);
  if (token) {
    const row = await env.DB.prepare(
      `SELECT users.* FROM sessions JOIN users ON users.id = sessions.user_id
       WHERE sessions.token_hash = ? AND sessions.expires_at > ?`
    )
      .bind(await tokenHash(token), Date.now())
      .first();
    if (row) return { user: row, token };
  }
  throw new HttpError(401, "Log in to continue.");
}

export async function createSession(env, userId) {
  const token = newSessionToken();
  await env.DB.prepare("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)")
    .bind(await tokenHash(token), userId, Date.now() + SESSION_SECONDS * 1000)
    .run();
  return token;
}

export async function deleteSession(env, token) {
  await env.DB.prepare("DELETE FROM sessions WHERE token_hash = ?").bind(await tokenHash(token)).run();
}
