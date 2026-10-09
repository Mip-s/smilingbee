import { useEffect, useState } from "react";
import { assetUrl } from "./ContentContext.jsx";

const TAGS = [
  { icon: "⛏️", label: "Minecraft" },
  { icon: "🌲", label: "FPS" },
  { icon: "🤖", label: "Roblox" },
  { icon: "🎤", label: "Vtuber" },
  { icon: "😎", label: "Chill" },
];

// Discord invite code is the last part of the link, e.g. https://discord.gg/6xBfGfckma -> 6xBfGfckma
function inviteCode(url) {
  return String(url).replace(/\/+$/, "").split("/").pop();
}

// Shows the server like a Discord server card. Online and member counts come from Discord's public
// invite API; if that can't be reached, the counts are simply left out.
export default function DiscordCard({ discord }) {
  const [counts, setCounts] = useState(null);

  useEffect(() => {
    let alive = true;
    fetch(`https://discord.com/api/v10/invites/${inviteCode(discord)}?with_counts=true`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))))
      .then((data) => {
        if (alive && data.approximate_presence_count != null && data.approximate_member_count != null) {
          setCounts({ online: data.approximate_presence_count, members: data.approximate_member_count });
        }
      })
      .catch(() => {});
    return () => { alive = false; };
  }, [discord]);

  return (
    <section className="discord-section" aria-label="Join the Discord">
      <div className="container">
        <p className="discord-welcome">Welcome to Smilingbee! To join the server, apply through our Discord. We'd love to see you there.</p>
        <article className="discord-card">
          <div className="discord-banner" aria-hidden="true" />
          <div className="discord-body">
            <img className="discord-icon" src={assetUrl("images/bee.png")} alt="" width="72" height="72" />
            <h3 className="discord-name">•°•Smiling Bee•°• <span aria-hidden="true">✪</span></h3>
            {counts && (
              <p className="discord-counts">
                <span className="dot online" aria-hidden="true" /> {counts.online} Online
                <span className="sep" aria-hidden="true">•</span>
                <span className="dot" aria-hidden="true" /> {counts.members} Members
              </p>
            )}
            <p className="discord-est">Est. Feb 2025</p>
            <ul className="discord-tags">
              {TAGS.map((t) => (
                <li key={t.label}><span aria-hidden="true">{t.icon}</span> {t.label}</li>
              ))}
            </ul>
            <a className="discord-go" href={discord} target="_blank" rel="noopener noreferrer">Go to Server</a>
          </div>
        </article>
      </div>
    </section>
  );
}
