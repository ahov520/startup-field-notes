(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) =>
    String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const asList = (v) => {
    if (Array.isArray(v)) return v;
    if (v == null || v === "") return [];
    return String(v).split(/[·|,，、]/).map((s) => s.trim()).filter(Boolean);
  };
  const joinList = (v, sep = " · ") => asList(v).join(sep);


  const boot = JSON.parse($("#boot").textContent);
  const stats = boot.meta?.stats || {};

  // KPIs
  const kpiEl = $("#kpis");
  const kpis = [
    { n: stats.cases ?? "219", l: "案例" },
    { n: stats.failed ?? "166", l: "关停" },
    { n: stats.success ?? "23", l: "存活" },
  ];
  kpiEl.innerHTML = kpis
    .map((k) => `<div class="kpi"><span class="kpi__n">${esc(k.n)}</span><span class="kpi__l">${esc(k.l)}</span></div>`)
    .join("");

  // pills
  $$("#homePills .pill").forEach((btn) => {
    btn.addEventListener("click", () => {
      const go = btn.dataset.go;
      if (!go) return;
      if (go.startsWith("#")) location.hash = go;
      else location.href = go;
    });
  });

  $("#homeSearch")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const q = e.target.value.trim();
      location.href = q ? `cases.html?q=${encodeURIComponent(q)}` : "cases.html";
    }
  });

  // weekly
  fetch("data/weekly.json")
    .then((r) => r.json())
    .then((w) => {
      $("#weeklyMeta").textContent = `${w.week || ""} · 更新 ${String(w.updated_at || "").slice(0, 16)}`;
      const items = w.suggestions || [];
      $("#weeklyFeed").innerHTML = items
        .map(
          (it, i) => `
        <article class="week-card">
          <span class="week-card__n">0${i + 1}</span>
          <h3>${esc(it.title)}</h3>
          <p>${esc(it.why)}</p>
          <p><strong>行动</strong> ${esc(it.action)}</p>
          ${it.link ? `<a href="${esc(it.link)}" target="_blank" rel="noopener">来源 →</a>` : ""}
          ${it.href ? `<a href="${esc(it.href)}">对照档案 →</a>` : ""}
        </article>`
        )
        .join("");
    })
    .catch(() => {
      $("#weeklyFeed").innerHTML = `<p class="muted">周刊暂未加载</p>`;
    });

  // fail highlights rail
  fetch("data/failures-highlight.json")
    .then((r) => r.json())
    .then((d) => {
      const items = d.highlights || [];
      $("#failRail").innerHTML = items
        .map((c) => {
          const badge =
            c.outcome === "成功"
              ? "ok"
              : c.outcome === "转型"
                ? "pivot"
                : "fail";
          return `
          <button type="button" class="tomb" data-name="${esc(c.name)}" data-href="cases.html?q=${encodeURIComponent(c.name)}">
            <div class="tomb__head">
              <span class="tomb__icon is-fail">🪦</span>
              <span class="tomb__badge ${badge}">${esc(c.outcome || "失败")}</span>
            </div>
            <div class="tomb__name">${esc(c.name)}</div>
            <div class="tomb__cause">${esc((c.tags && c.tags[0]) || c.sector || "")}</div>
            <p class="tomb__story">${esc(c.story || c.lesson || "")}</p>
          </button>`;
        })
        .join("");
      $$("#failRail .tomb").forEach((el) => {
        el.addEventListener("click", () => {
          location.href = el.dataset.href;
        });
      });
    });

  // conclusions
  $("#conclGrid").innerHTML = (boot.conclusions || [])
    .map(
      (c) => `
    <article class="card">
      <span class="card__tag">${esc(c.id || "")}</span>
      <h3>${esc(c.title)}</h3>
      <p>${esc(c.body)}</p>
      <p class="card__meta">${esc(joinList(c.cases))}</p>
    </article>`
    )
    .join("");

  // failure modes
  $("#failBoard").innerHTML = (boot.failures || [])
    .map(
      (f) => `
    <article class="card">
      <span class="card__tag">${esc(f.tag)}</span>
      <p>${esc(f.desc)}</p>
      <p class="card__meta">${esc(typeof f.ex === "string" ? f.ex : joinList(f.ex))}</p>
    </article>`
    )
    .join("");

  // lexicon
  const paintLex = (items) => {
    $("#lexGrid").innerHTML = (items || [])
      .map(
        (L) => `
        <article class="lex">
          <div class="lex__head">
            <span class="lex__id">${esc(L.id)}</span>
            <span class="lex__tag">${esc(L.tag)}</span>
          </div>
          <div class="lex__body">
            <div class="lex__row"><strong>症状</strong>${esc(L.symptom)}</div>
            <div class="lex__row"><strong>尸检</strong>${esc(L.autopsy)}</div>
            <div class="lex__row"><strong>解药</strong>${esc(L.cure)}</div>
            <div class="lex__cases">${asList(L.cases).map((x) => `<span>${esc(x)}</span>`).join("")}</div>
          </div>
        </article>`
      )
      .join("");
  };
  if (boot.lexicon?.length) paintLex(boot.lexicon);
  fetch("data/lexicon.json")
    .then((r) => r.json())
    .then((d) => paintLex(d.items || []))
    .catch(() => {
      if (!$("#lexGrid").innerHTML) $("#lexGrid").innerHTML = `<p class="muted">词典暂未加载</p>`;
    });

  // hot
  $("#hotList").innerHTML = (boot.hot || [])
    .map(
      (h) => `
    <article class="card">
      <h3>${esc(h.n)}</h3>
      <p><strong>机会</strong> ${esc(h.opp)}</p>
      <p><strong>坑</strong> ${esc(h.pit)}</p>
    </article>`
    )
    .join("");

  // actions
  const actions = boot.actions || {};
  const tabs = Object.keys(actions);
  const tabsEl = $("#actionTabs");
  const panel = $("#actionPanel");
  let active = tabs[0];
  const renderActions = () => {
    $$(".pill", tabsEl).forEach((p) => p.classList.toggle("is-on", p.dataset.k === active));
    panel.innerHTML = (actions[active] || []).map((t) => `<li>${esc(t)}</li>`).join("");
  };
  tabsEl.innerHTML = tabs
    .map((k) => `<button type="button" class="pill" data-k="${esc(k)}">${esc(k)}</button>`)
    .join("");
  tabsEl.addEventListener("click", (e) => {
    const b = e.target.closest("[data-k]");
    if (!b) return;
    active = b.dataset.k;
    renderActions();
  });
  renderActions();

  // reads
  $("#readsList").innerHTML = (boot.reads || [])
    .map(
      (r) => `
    <a class="card" href="${esc(r.u || "#")}" target="_blank" rel="noopener" style="text-decoration:none">
      <h3>${esc(r.t)}</h3>
      <p class="card__meta">${esc(r.a || "")}</p>
      <p>${esc(r.why || "")}</p>
    </a>`
    )
    .join("");

  $("#limitsText").textContent = boot.limits || "";
})();
