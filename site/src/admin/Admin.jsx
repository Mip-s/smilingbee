import { useEffect, useState } from "react";
import { api } from "./api.js";

function TextField({ label, value, onChange, max, type = "text" }) {
  return (
    <label className="adm-field">
      <span>{label}</span>
      <input type={type} value={value} maxLength={max} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

// The hidden admin page at /admin. Nothing on the public site links here.
export default function Admin() {
  const [user, setUser] = useState(undefined); // undefined: checking, null: logged out

  useEffect(() => {
    document.title = "Admin · Smilingbee";
    api("/api/admin/me").then(setUser).catch(() => setUser(null));
  }, []);

  if (user === undefined) return <div className="adm-wrap"><p>Loading…</p></div>;
  if (user === null) return <LoginForm onLogin={setUser} />;
  return <Dashboard user={user} onUser={setUser} onLogout={() => setUser(null)} />;
}

function LoginForm({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      onLogin(await api("/api/admin/login", { method: "POST", json: { username, password } }));
    } catch (err) {
      setError(err.message);
      setPassword("");
      setBusy(false);
    }
  }

  return (
    <div className="adm-wrap adm-login-wrap">
      <form className="adm-card" onSubmit={submit}>
        <h1 className="pixel">Admin login</h1>
        <TextField label="Username" value={username} onChange={setUsername} />
        <label className="adm-field">
          <span>Password</span>
          <input type="password" value={password} autoComplete="current-password" onChange={(e) => setPassword(e.target.value)} />
        </label>
        {error && <p className="adm-error" role="alert">{error}</p>}
        <button className="adm-btn" disabled={busy || !username || !password}>
          {busy ? "Logging in…" : "Log in"}
        </button>
      </form>
      <p className="adm-back"><a href="/">Back to the website</a></p>
    </div>
  );
}

function Dashboard({ user, onUser, onLogout }) {
  // Someone using the starting password only sees My profile until they choose their own.
  const [tab, setTab] = useState("website");
  const current = user.mustChangePassword ? "profile" : tab;
  const tabs = [
    ["website", "Edit the website"],
    ["profile", "My profile"],
    ...(user.isOwner ? [["users", "Users"]] : []),
  ];

  async function logout() {
    await api("/api/admin/logout", { method: "POST", json: {} }).catch(() => {});
    onLogout();
  }

  // The website itself is the editor: editing starts there, with the admin tools at the bottom of each page.
  function editWebsite() {
    try {
      sessionStorage.setItem("smilingbee-edit", "1");
    } catch {
      // Storage can be blocked; the website still opens, just not in edit mode.
    }
    window.location.href = "/";
  }

  return (
    <div className="adm-wrap">
      <header className="adm-top">
        <h1 className="pixel">Admin</h1>
        <span className="adm-who">Logged in as <b>{user.username}</b></span>
        <button className="adm-btn ghost small" onClick={logout}>Log out</button>
      </header>

      {user.mustChangePassword && (
        <p className="adm-notice" role="status">
          You are still using the starting password. Change it below before you can edit the website.
        </p>
      )}

      {!user.mustChangePassword && (
        <nav className="adm-tabs" aria-label="Admin sections">
          {tabs.map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={`adm-tab${current === key ? " on" : ""}`}
              aria-current={current === key ? "page" : undefined}
              onClick={() => setTab(key)}
            >
              {label}
            </button>
          ))}
        </nav>
      )}

      {current === "website" && (
        <div className="adm-card adm-start">
          <h2 className="adm-sub first">Edit the website</h2>
          <p className="adm-hint">
            Open the website and click any text or picture to change it. Add, move and delete items with the buttons next to them.
            Save from the bar at the bottom of the page.
          </p>
          <button className="adm-btn" onClick={editWebsite}>Open the website to edit</button>
        </div>
      )}

      {current === "profile" && <Profile user={user} onUser={onUser} />}
      {current === "users" && <Users />}

      <p className="adm-back"><a href="/">Back to the website</a></p>
    </div>
  );
}

// Owner only: add, reset and remove the accounts that can edit the website.
function Users() {
  const [list, setList] = useState(null);
  const [error, setError] = useState("");

  async function load() {
    try {
      setList(await api("/api/admin/users"));
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <>
      <AddUser onAdded={load} />
      <div className="adm-card">
        <h2 className="adm-sub first">Users</h2>
        <p className="adm-hint">
          Users can edit the website and change their own password. Only you can add, reset or remove users.
          A new user or a reset password must be changed at their next login.
        </p>
        {error && <p className="adm-error" role="alert">{error}</p>}
        {list === null && !error && <p>Loading…</p>}
        {list && (
          <ul className="adm-users">
            {list.map((u) => (
              <UserRow key={u.id} u={u} onChanged={load} />
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

function AddUser({ onAdded }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState(null);
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const added = await api("/api/admin/users", { method: "POST", json: { username, password } });
      setMessage({ ok: true, text: `Added ${added.username}. Give them the temporary password; they must change it at first login.` });
      setUsername("");
      setPassword("");
      onAdded();
    } catch (err) {
      setMessage({ ok: false, text: err.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="adm-card" onSubmit={submit}>
      <h2 className="adm-sub first">Add a user</h2>
      <p className="adm-hint">Use their Minecraft name. Set a temporary password of at least 8 characters and tell it to them.</p>
      <TextField label="Minecraft name" value={username} max={16} onChange={setUsername} />
      <TextField label="Temporary password" value={password} onChange={setPassword} />
      <div className="adm-savebar">
        <button className="adm-btn" disabled={busy || !username || !password}>Add user</button>
        {message && <span className={message.ok ? "adm-ok" : "adm-error"} role="status">{message.text}</span>}
      </div>
    </form>
  );
}

function UserRow({ u, onChanged }) {
  const [resetting, setResetting] = useState(false);
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState(null);

  async function reset(e) {
    e.preventDefault();
    setMessage(null);
    try {
      await api(`/api/admin/users/${u.id}/password`, { method: "POST", json: { password } });
      setResetting(false);
      setPassword("");
      onChanged();
    } catch (err) {
      setMessage({ ok: false, text: err.message });
    }
  }

  async function remove() {
    if (!window.confirm(`Remove ${u.username}? They will be logged out and can't log in again.`)) return;
    setMessage(null);
    try {
      await api(`/api/admin/users/${u.id}`, { method: "DELETE" });
      onChanged();
    } catch (err) {
      setMessage({ ok: false, text: err.message });
    }
  }

  const notes = [u.owner ? "Owner" : "Editor"];
  if (u.mustChangePassword) notes.push("must change password");
  if (u.locked) notes.push("locked after failed logins");

  return (
    <li className="adm-user">
      <div className="adm-user-row">
        <span className="adm-user-who">
          <b>{u.username}</b> <span className="adm-hint">{notes.join(" · ")}</span>
        </span>
        {!u.owner && (
          <span className="adm-user-actions">
            <button type="button" className="adm-btn ghost small" onClick={() => setResetting((r) => !r)}>Reset password</button>
            <button type="button" className="adm-btn danger small" onClick={remove}>Remove</button>
          </span>
        )}
      </div>
      {resetting && (
        <form className="adm-user-reset" onSubmit={reset}>
          <TextField label={`New temporary password for ${u.username}`} value={password} onChange={setPassword} />
          <button className="adm-btn small" disabled={!password}>Set password</button>
        </form>
      )}
      {message && <p className={message.ok ? "adm-ok" : "adm-error"} role="status">{message.text}</p>}
    </li>
  );
}

function Profile({ user, onUser }) {
  return (
    <div className="adm-profile">
      <UsernameForm user={user} onUser={onUser} />
      <PasswordForm onUser={onUser} />
    </div>
  );
}

function UsernameForm({ user, onUser }) {
  const [username, setUsername] = useState(user.username);
  const [currentPassword, setCurrentPassword] = useState("");
  const [message, setMessage] = useState(null);
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const updated = await api("/api/admin/account", { method: "POST", json: { username, currentPassword } });
      onUser(updated);
      setUsername(updated.username);
      setCurrentPassword("");
      setMessage({ ok: true, text: `Your username is now ${updated.username}.` });
    } catch (err) {
      setMessage({ ok: false, text: err.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="adm-card" onSubmit={submit}>
      <h2 className="adm-sub first">Username</h2>
      <p className="adm-hint">Use 3 to 16 letters, digits or underscores, like your Minecraft name.</p>
      <TextField label="New username" value={username} max={16} onChange={setUsername} />
      <TextField label="Current password" type="password" value={currentPassword} onChange={setCurrentPassword} />
      <div className="adm-savebar">
        <button className="adm-btn" disabled={busy || !currentPassword || username === user.username}>
          Change username
        </button>
        {message && <span className={message.ok ? "adm-ok" : "adm-error"} role="status">{message.text}</span>}
      </div>
    </form>
  );
}

function PasswordForm({ onUser }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState(null);
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setMessage(null);
    if (newPassword !== confirm) {
      setMessage({ ok: false, text: "The new passwords don't match." });
      return;
    }
    setBusy(true);
    try {
      const updated = await api("/api/admin/account", { method: "POST", json: { currentPassword, newPassword } });
      onUser(updated);
      setCurrentPassword("");
      setNewPassword("");
      setConfirm("");
      setMessage({ ok: true, text: "Password changed. Other logged-in browsers were signed out." });
    } catch (err) {
      setMessage({ ok: false, text: err.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="adm-card" onSubmit={submit}>
      <h2 className="adm-sub first">Password</h2>
      <p className="adm-hint">At least 8 characters.</p>
      <TextField label="Current password" type="password" value={currentPassword} onChange={setCurrentPassword} />
      <TextField label="New password" type="password" value={newPassword} onChange={setNewPassword} />
      <TextField label="Repeat new password" type="password" value={confirm} onChange={setConfirm} />
      <div className="adm-savebar">
        <button className="adm-btn" disabled={busy || !currentPassword || !newPassword || !confirm}>
          Change password
        </button>
        {message && <span className={message.ok ? "adm-ok" : "adm-error"} role="status">{message.text}</span>}
      </div>
    </form>
  );
}
