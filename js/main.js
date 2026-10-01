// Smilingbee — loads content/*.json and renders each section.
// You normally don't need to edit this file: change the JSON files in /content instead.

(function () {
  "use strict";

  // Small helper: create an element with text (text is never parsed as HTML).
  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) {
      node.textContent = text;
      if (String(text).indexOf("PLACEHOLDER") !== -1) node.classList.add("placeholder-tag");
    }
    return node;
  }

  function load(name) {
    return fetch("content/" + name + ".json", { cache: "no-cache" }).then(function (r) {
      if (!r.ok) throw new Error(name + ".json: HTTP " + r.status);
      return r.json();
    });
  }

  function showError(where, err) {
    var box = el("div", "load-error", "Could not load content (" + err.message + "). If you opened index.html directly from your disk, run a local server instead — see README.md.");
    where.appendChild(box);
    console.error(err);
  }

  // ---------- Home ----------
  function renderSite(data) {
    document.querySelectorAll("[data-site]").forEach(function (node) {
      var key = node.getAttribute("data-site");
      if (data[key] != null) {
        node.textContent = data[key];
        if (String(data[key]).indexOf("PLACEHOLDER") !== -1) node.classList.add("placeholder-tag");
      }
    });
    if (data.serverName) document.title = data.serverName;

    var welcome = document.getElementById("welcome");
    (data.welcome || []).forEach(function (p) { welcome.appendChild(el("p", null, p)); });

    var hl = document.getElementById("highlights");
    (data.highlights || []).forEach(function (h) {
      var box = el("div", "highlight");
      box.appendChild(el("div", "icon", h.icon || ""));
      box.appendChild(el("h3", null, h.title));
      box.appendChild(el("p", null, h.text));
      hl.appendChild(box);
    });
  }

  // ---------- History ----------
  function renderHistory(data) {
    var list = document.getElementById("timeline");
    (data.entries || []).forEach(function (e) {
      var li = el("li");
      li.appendChild(el("div", "date", e.date));
      li.appendChild(el("h3", null, e.title));
      li.appendChild(el("p", null, e.text));
      list.appendChild(li);
    });
  }

  // ---------- Lore ----------
  function card(title, text, image, alt) {
    var c = el("article", "card");
    if (image) {
      var img = el("img");
      img.src = image; img.alt = alt || title || ""; img.loading = "lazy";
      c.appendChild(img);
    }
    var body = el("div", "body");
    body.appendChild(el("h4", null, title));
    body.appendChild(el("p", null, text));
    c.appendChild(body);
    return c;
  }

  function renderLore(data) {
    var stories = document.getElementById("lore-stories");
    (data.stories || []).forEach(function (s) { stories.appendChild(card(s.title, s.text, s.image)); });

    var places = document.getElementById("lore-places");
    (data.places || []).forEach(function (p) { places.appendChild(card(p.name, p.text, p.image)); });

    var factions = document.getElementById("lore-factions");
    (data.factions || []).forEach(function (f) {
      var c = card(f.name, f.text, f.image);
      c.classList.add("faction");
      if (f.color) c.style.borderLeftColor = f.color;
      factions.appendChild(c);
    });
  }

  // ---------- Records ----------
  function renderRecords(data) {
    var list = document.getElementById("records-list");
    (data.records || []).forEach(function (r) {
      var box = el("div", "record");
      var head;
      if (r.skin) {
        head = el("img", "head");
        head.src = "https://mc-heads.net/avatar/" + encodeURIComponent(r.skin) + "/56";
        head.alt = r.skin + "'s Minecraft head";
        head.loading = "lazy";
      } else {
        head = el("div", "head", "🏆");
        head.setAttribute("aria-hidden", "true");
      }
      box.appendChild(head);
      var info = el("div");
      info.appendChild(el("div", "title", r.title));
      info.appendChild(el("div", "player", r.player));
      info.appendChild(el("p", "detail", r.detail));
      box.appendChild(info);
      list.appendChild(box);
    });
  }

  // ---------- Gallery + lightbox ----------
  var images = [];
  var current = 0;
  var lb = document.getElementById("lightbox");
  var lbImg = document.getElementById("lb-img");
  var lbCap = document.getElementById("lb-caption");
  var lastFocus = null;

  function renderGallery(data) {
    images = data.images || [];
    var grid = document.getElementById("gallery-grid");
    images.forEach(function (item, i) {
      var btn = el("button");
      btn.type = "button";
      btn.setAttribute("aria-label", "View image: " + (item.caption || "screenshot " + (i + 1)));
      var img = el("img");
      img.src = item.thumb || item.src;
      img.alt = item.caption || "";
      img.loading = "lazy";
      btn.appendChild(img);
      btn.addEventListener("click", function () { openLightbox(i); });
      grid.appendChild(btn);
    });
  }

  function show(i) {
    current = (i + images.length) % images.length;
    var item = images[current];
    lbImg.src = item.src;
    lbImg.alt = item.caption || "";
    lbCap.textContent = item.caption || "";
  }

  function openLightbox(i) {
    lastFocus = document.activeElement;
    show(i);
    lb.hidden = false;
    document.body.style.overflow = "hidden";
    lb.querySelector(".lb-close").focus();
  }

  function closeLightbox() {
    lb.hidden = true;
    lbImg.removeAttribute("src");
    document.body.style.overflow = "";
    if (lastFocus) lastFocus.focus();
  }

  lb.querySelector(".lb-close").addEventListener("click", closeLightbox);
  lb.querySelector(".lb-prev").addEventListener("click", function () { show(current - 1); });
  lb.querySelector(".lb-next").addEventListener("click", function () { show(current + 1); });
  lb.addEventListener("click", function (e) { if (e.target === lb) closeLightbox(); });
  document.addEventListener("keydown", function (e) {
    if (lb.hidden) return;
    if (e.key === "Escape") closeLightbox();
    else if (e.key === "ArrowLeft") show(current - 1);
    else if (e.key === "ArrowRight") show(current + 1);
  });
  // Swipe on phones
  var touchX = null;
  lb.addEventListener("touchstart", function (e) { touchX = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener("touchend", function (e) {
    if (touchX == null) return;
    var dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 50) show(current + (dx < 0 ? 1 : -1));
    touchX = null;
  });

  // ---------- Nav ----------
  var toggle = document.querySelector(".nav-toggle");
  var links = document.getElementById("nav-links");
  toggle.addEventListener("click", function () {
    var open = links.classList.toggle("open");
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
  });
  links.addEventListener("click", function (e) {
    if (e.target.tagName === "A") {
      links.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    }
  });

  // Highlight the nav link for the section currently on screen
  if ("IntersectionObserver" in window) {
    var navAnchors = links.querySelectorAll("a");
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navAnchors.forEach(function (a) {
          a.classList.toggle("active", a.getAttribute("href") === "#" + entry.target.id);
        });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    document.querySelectorAll("main section[id]").forEach(function (s) { observer.observe(s); });
  }

  // ---------- Load everything ----------
  var jobs = [
    ["site", renderSite, "home"],
    ["history", renderHistory, "history"],
    ["lore", renderLore, "lore"],
    ["records", renderRecords, "records"],
    ["gallery", renderGallery, "gallery"]
  ];
  jobs.forEach(function (job) {
    load(job[0]).then(job[1]).catch(function (err) {
      showError(document.getElementById(job[2]), err);
    });
  });
})();
