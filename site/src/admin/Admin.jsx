import { useEffect, useState } from "react";
import { api } from "./api.js";
import { CouncilorsEditor, GalleryEditor, HistoryEditor, LoreEditor, SiteEditor, TextField } from "./editors.jsx";

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
  const [tab, setTab] = useState("edit");

  async function logout() {
    await api("/api/admin/logout", { method: "POST", json: {} }).catch(() => {});
    onLogout();
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
          You are still using the starting password. Change it in the <b>My profile</b> tab.
        </p>
      )}

      <nav className="adm-tabs" aria-label="Admin">
        <button className={tab === "edit" ? "on" : ""} aria-current={tab === "edit"} onClick={() => setTab("edit")}>
          Edit website
        </button>
        <button className={tab === "profile" ? "on" : ""} aria-current={tab === "profile"} onClick={() => setTab("profile")}>
          My profile
        </button>
      </nav>

      {tab === "edit" ? <EditWebsite /> : <Profile user={user} onUser={onUser} />}
      <p className="adm-back"><a href="/">Back to the website</a></p>
    </div>
  );
}

const SECTIONS = [
  { key: "site", title: "Home & header", Editor: SiteEditor },
  { key: "history", title: "History", Editor: HistoryEditor },
  { key: "lore", title: "Lore", Editor: LoreEditor },
  { key: "councilors", title: "Councilors", Editor: CouncilorsEditor },
  { key: "gallery", title: "Gallery", Editor: GalleryEditor },
];

// Holds the saved website text and an unsaved draft for each section, so switching sections loses nothing.
function EditWebsite() {
  const [saved, setSaved] = useState(null);
  const [drafts, setDrafts] = useState({});
  const [section, setSection] = useState("site");
  const [status, setStatus] = useState({ key: null, text: "", error: false });
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api("/api/content")
      .then((content) => {
        setSaved(content);
        setDrafts(content);
      })
      .catch((err) => setLoadError(err.message));
  }, []);

  if (loadError) return <p className="adm-error" role="alert">{loadError}</p>;
  if (!saved) return <p>Loading the website text…</p>;

  const current = SECTIONS.find((s) => s.key === section);
  const dirty = JSON.stringify(drafts[section]) !== JSON.stringify(saved[section]);

  async function save() {
    setSaving(true);
    setStatus({ key: section, text: "", error: false });
    try {
      const { value } = await api(`/api/admin/content/${section}`, { method: "PUT", json: drafts[section] });
      setSaved((s) => ({ ...s, [section]: value }));
      setDrafts((d) => ({ ...d, [section]: value }));
      setStatus({ key: section, text: "Saved. The website is updated.", error: false });
    } catch (err) {
      setStatus({ key: section, text: err.message, error: true });
    } finally {
      setSaving(false);
    }
  }

  function discard() {
    setDrafts((d) => ({ ...d, [section]: saved[section] }));
    setStatus({ key: null, text: "", error: false });
  }

  const Editor = current.Editor;
  const message = status.key === section ? status : null;

  return (
    <div className="adm-edit">
      <nav className="adm-sections" aria-label="Sections">
        {SECTIONS.map((s) => (
          <button key={s.key} className={s.key === section ? "on" : ""} onClick={() => setSection(s.key)}>
            {s.title}
            {JSON.stringify(drafts[s.key]) !== JSON.stringify(saved[s.key]) && <span className="adm-dot" title="Unsaved changes" />}
          </button>
        ))}
      </nav>

      <div className="adm-card">
        <h2 className="adm-sub first">{current.title}</h2>
        <Editor value={drafts[section]} onChange={(value) => setDrafts((d) => ({ ...d, [section]: value }))} />

        <div className="adm-savebar">
          <button className="adm-btn" onClick={save} disabled={!dirty || saving}>
            {saving ? "Saving…" : "Save changes"}
          </button>
          <button className="adm-btn ghost" onClick={discard} disabled={!dirty || saving}>
            Discard changes
          </button>
          {dirty && !saving && <span className="adm-muted">Unsaved changes</span>}
          {message && (
            <span className={message.error ? "adm-error" : "adm-ok"} role={message.error ? "alert" : "status"}>
              {message.text}
            </span>
          )}
        </div>
      </div>
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
