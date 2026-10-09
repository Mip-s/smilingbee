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
          You are still using the starting password. Change it below.
        </p>
      )}

      <div className="adm-card adm-start">
        <h2 className="adm-sub first">Edit the website</h2>
        <p className="adm-hint">
          Open the website and click any text or picture to change it. Add, move and delete items with the buttons next to them.
          Save from the bar at the bottom of the page.
        </p>
        <button className="adm-btn" onClick={editWebsite}>Open the website to edit</button>
      </div>

      <Profile user={user} onUser={onUser} />
      <p className="adm-back"><a href="/">Back to the website</a></p>
    </div>
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
