(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) =>
    String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const params = new URLSearchParams(location.search);
  let filter = "all";
  let query = params.get("q") || "";
  const outcomeParam = params.get("outcome");
  if (outcomeParam) filter = outcomeParam;

  const qInput = $("#q");
  if (query) qInput.value = query;

  let cases = [];

  const badgeClass = (o) => (o === "成功" ? "ok" : o === "转型" ? "pivot" : "fail");
  const iconClass = (o) => (o === "成功" ? "is-ok" : "is-fail");
  const icon = (o) => (o === "成功" ? "✦" : o === "转型" ? "↻" : "🪦");

  const match = (c) => {
    if (filter === "失败" && c.outcome !== "失败") return false;
    if (filter === "成功" && c.outcome !== "成功") return false;
    if (filter === "转型" && c.outcome !== "转型") return false;
    if (filter === "国内" && !(c.region === "国内" || c.country === "中国" || /中国|国内/.test(c.region || "")))
      return false;
    if (filter === "海外" && (c.region === "国内" || c.country === "中国")) return false;
    if (!query) return true;
    const hay = [c.name, c.who, c.story, c.lesson, c.cause, c.sector, c.region, c.country, ...(c.tags || [])]
      .join(" ")
      .toLowerCase();
    return hay.includes(query.toLowerCase());
  };

  const render = () => {
    const list = cases.filter(match);
    $("#resultMeta").textContent = `显示 ${list.length} / ${cases.length}`;
    $("#caseCount").textContent = String(list.length);
    const empty = $("#empty");
    const grid = $("#grid");
    if (!list.length) {
      grid.innerHTML = "";
      empty.hidden = false;
      return;
    }
    empty.hidden = true;
    grid.innerHTML = list
      .map(
        (c, i) => `
      <button type="button" class="tomb" data-i="${i}" data-name="${esc(c.name)}">
        <div class="tomb__head">
          <span class="tomb__icon ${iconClass(c.outcome)}">${icon(c.outcome)}</span>
          <span class="tomb__badge ${badgeClass(c.outcome)}">${esc(c.outcome || "?")}</span>
        </div>
        <div class="tomb__name">${esc(c.name)}</div>
        <div class="tomb__cause">${esc(c.cause || c.sector || "")}</div>
        <p class="tomb__story">${esc(c.story || c.lesson || "")}</p>
      </button>`
      )
      .join("");
    // map index to filtered list
    grid._list = list;
    $$(".tomb", grid).forEach((el) => {
      el.addEventListener("click", () => openDrawer(grid._list[+el.dataset.i]));
    });
  };

  const drawer = $("#drawer");
  const body = $("#drawerBody");
  const openDrawer = (c) => {
    if (!c) return;
    body.innerHTML = `
      <h2>${esc(c.name)}</h2>
      <div class="meta-row">
        <span class="chip">${esc(c.outcome || "")}</span>
        ${c.sector ? `<span class="chip">${esc(c.sector)}</span>` : ""}
        ${c.region || c.country ? `<span class="chip">${esc(c.region || c.country)}</span>` : ""}
        ${c.lifespan ? `<span class="chip">寿命 ${esc(c.lifespan)}</span>` : ""}
        ${c.capital ? `<span class="chip">${esc(c.capital)}</span>` : ""}
      </div>
      ${c.cause ? `<div class="block"><strong>死因</strong>${esc(c.cause)}</div>` : ""}
      ${c.story ? `<div class="block"><strong>经历</strong>${esc(c.story)}</div>` : ""}
      ${c.lesson ? `<div class="block"><strong>教训</strong>${esc(c.lesson)}</div>` : ""}
      ${c.who ? `<div class="block"><strong>人物</strong>${esc(c.who)}</div>` : ""}
      ${c.timeline ? `<div class="block"><strong>时间线</strong>${esc(c.timeline)}</div>` : ""}
      ${(c.tags || []).length ? `<div class="block"><strong>标签</strong>${esc(c.tags.join(" · "))}</div>` : ""}
      ${
        c.source_url
          ? `<a class="btn btn--primary" href="${esc(c.source_url)}" target="_blank" rel="noopener">查看来源</a>`
          : c.src
            ? `<div class="block"><strong>出处</strong>${esc(c.src)}</div>`
            : ""
      }
    `;
    drawer.hidden = false;
    document.body.style.overflow = "hidden";
  };
  const closeDrawer = () => {
    drawer.hidden = true;
    document.body.style.overflow = "";
  };
  drawer.addEventListener("click", (e) => {
    if (e.target.matches("[data-close]")) closeDrawer();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeDrawer();
  });

  $$("#filters .pill").forEach((btn) => {
    btn.classList.toggle("is-on", btn.dataset.f === filter);
    btn.addEventListener("click", () => {
      filter = btn.dataset.f;
      $$("#filters .pill").forEach((b) => b.classList.toggle("is-on", b.dataset.f === filter));
      render();
    });
  });

  let t;
  qInput.addEventListener("input", () => {
    clearTimeout(t);
    t = setTimeout(() => {
      query = qInput.value.trim();
      render();
    }, 120);
  });

  fetch("data/cases.json")
    .then((r) => r.json())
    .then((d) => {
      cases = d.cases || [];
      render();
    })
    .catch(() => {
      $("#resultMeta").textContent = "档案加载失败";
    });
})();
