(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const params = new URLSearchParams(location.search);
  const slug = params.get("slug") || "";
  const nameQ = params.get("name") || "";
  const stage = $("#stage");
  const loading = $("#loading");
  const dots = $("#dots");
  const titleEl = $("#deckTitle");
  const pageInd = $("#pageInd");
  const back = $("#back");

  const backHref = `cases.html${nameQ ? `?q=${encodeURIComponent(nameQ)}` : ""}`;
  back.href = backHref;

  let cards = [];
  let idx = 0;

  const sync = () => {
    pageInd.textContent = `${idx + 1} / ${Math.max(cards.length, 1)}`;
    [...dots.children].forEach((d, i) => d.classList.toggle("is-on", i === idx));
  };

  const go = (n) => {
    if (!cards.length) return;
    idx = Math.max(0, Math.min(cards.length - 1, n));
    cards[idx].scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
    sync();
  };

  stage.addEventListener("scroll", () => {
    if (!cards.length) return;
    const w = stage.clientWidth || 1;
    idx = Math.round(stage.scrollLeft / w);
    sync();
  }, { passive: true });

  $("#prev")?.addEventListener("click", () => go(idx - 1));
  $("#next")?.addEventListener("click", () => {
    if (idx >= cards.length - 1) {
      location.href = backHref;
      return;
    }
    go(idx + 1);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") go(idx - 1);
    if (e.key === "ArrowRight") go(idx + 1);
    if (e.key === "Escape") location.href = backHref;
  });

  const buildCard = (sec, i, total) => {
    const card = document.createElement("article");
    card.className = "deck-card";
    const h = sec.querySelector("h2");
    const kill = sec.querySelector(".kill");
    const viz = document.createElement("div");
    viz.className = "deck-viz";
    viz.innerHTML = `<span class="deck-viz__tag">${String(i + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}</span>`;
    card.appendChild(viz);
    const badge = document.createElement("span");
    badge.className = "deck-card__badge";
    badge.textContent = i === 0 ? "KILL LINE" : "CASE CUT";
    card.appendChild(badge);
    if (h) {
      const hh = document.createElement("h2");
      hh.textContent = h.textContent.trim();
      card.appendChild(hh);
    }
    if (kill) {
      const p = document.createElement("p");
      p.className = "kill";
      p.textContent = kill.textContent.trim();
      card.appendChild(p);
    }
    sec.querySelectorAll("p:not(.kill), ul, table").forEach((node) => {
      card.appendChild(node.cloneNode(true));
    });
    return card;
  };

  const boot = async () => {
    if (!slug) {
      loading.textContent = "缺少 slug";
      return;
    }
    let meta = null;
    try {
      const idxJson = await fetch("data/decks-index.json").then((r) => r.json());
      meta = (idxJson.decks || []).find((d) => d.slug === slug);
      titleEl.textContent = meta?.name || slug;
      document.title = `${meta?.name || slug} · 翻页复盘`;
    } catch {}
    const file = meta?.file || `${slug}.html`;
    let html;
    try {
      const enc = file.split('/').map(encodeURIComponent).join('/');
      html = await fetch(`decks/${enc}`).then((r) => {
        if (!r.ok) throw new Error("missing");
        return r.text();
      });
    } catch {
      loading.textContent = "这份翻页复盘还没接上";
      return;
    }
    const doc = new DOMParser().parseFromString(html, "text/html");
    let sections = [...doc.querySelectorAll("section.slide")];
    if (!sections.length) sections = [...doc.querySelectorAll(".slide")];
    if (!sections.length) {
      loading.textContent = "这份复盘没有可翻页的章节";
      return;
    }
    loading.remove();
    stage.innerHTML = "";
    sections.forEach((sec, i) => stage.appendChild(buildCard(sec, i, sections.length)));
    cards = [...stage.querySelectorAll(".deck-card")];
    dots.innerHTML = cards.map(() => "<span></span>").join("");
    // next button label on last
    const next = $("#next");
    const refreshNext = () => {
      next.textContent = idx >= cards.length - 1 ? "回档案" : "›";
    };
    stage.addEventListener("scroll", refreshNext, { passive: true });
    sync();
    refreshNext();
  };

  boot();
})();
