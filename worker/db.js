// Database setup. The tables are created the first time the Worker handles an API request, and the
// starting admin account is added when the users table is empty. Nothing needs to be run by hand.

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS users (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     username TEXT NOT NULL,
     username_lc TEXT NOT NULL UNIQUE,
     password_hash TEXT NOT NULL,
     must_change_password INTEGER NOT NULL DEFAULT 0,
     failed_logins INTEGER NOT NULL DEFAULT 0,
     locked_until INTEGER NOT NULL DEFAULT 0
   )`,
  `CREATE TABLE IF NOT EXISTS sessions (
     token_hash TEXT PRIMARY KEY,
     user_id INTEGER NOT NULL,
     expires_at INTEGER NOT NULL
   )`,
  `CREATE TABLE IF NOT EXISTS content (
     key TEXT PRIMARY KEY,
     value TEXT NOT NULL,
     updated_at INTEGER NOT NULL,
     updated_by TEXT NOT NULL
   )`,
];

// The starting account. Only the hash of the starting password is stored here; it must be changed on first login.
const STARTING_ADMIN = {
  username: "MipElysium",
  passwordHash: "pbkdf2_sha256$100000$j0zMJmw1NHKDW8njYKBQAQ==$MKQKe6HZm+fmWPWz9YH33iQSXq8JgDrCW12qU4foZzM=",
};

let ready = null;

export function ensureDatabase(env) {
  if (!ready) {
    ready = (async () => {
      await env.DB.batch(SCHEMA.map((sql) => env.DB.prepare(sql)));
      await env.DB.prepare(
        `INSERT INTO users (username, username_lc, password_hash, must_change_password)
         SELECT ?, ?, ?, 1 WHERE NOT EXISTS (SELECT 1 FROM users)`
      )
        .bind(STARTING_ADMIN.username, STARTING_ADMIN.username.toLowerCase(), STARTING_ADMIN.passwordHash)
        .run();
    })().catch((err) => {
      ready = null; // try again on the next request
      throw err;
    });
  }
  return ready;
}
