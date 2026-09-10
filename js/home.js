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
    return String(v)
      .split(/[·|,，、]/)
      .map((s) => s.trim())
      .filter(Boolean);
  };
  const joinList = (v, sep = " · ") => asList(v).join(sep);
  const ls = {
    get(k, fb) {
      try {
        const v = localStorage.getItem(k);
        return v == null ? fb : JSON.parse(v);
      } catch {
        return fb;
      }
    },
    set(k, v) {
      try {
        localStorage.setItem(k, JSON.stringify(v));
      } catch {}
    },
  };

  const boot = JSON.parse($("#boot").textContent);
  const stats = boot.meta?.stats || {};

  // reading progress
  const bar = $("#progress");
  const onScroll = () => {
    const h = document.documentElement;
    const max = h.scrollHeight - h.clientHeight;
    const p = max > 0 ? (h.scrollTop / max) * 100 : 0;
    if (bar) bar.style.width = p + "%";
    const top = $("#toTop");
    if (top) top.classList.toggle("is-show", h.scrollTop > 480);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  $("#toTop")?.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

  // font size
  const FS_KEY = "sfn-fs";
  let fs = ls.get(FS_KEY, 16);
  const applyFs = () => {
    document.documentElement.style.setProperty("--fs", fs + "px");
    ls.set(FS_KEY, fs);
  };
  applyFs();
  $("#fsDown")?.addEventListener("click", () => {
    fs = Math.max(14, fs - 1);
    applyFs();
  });
  $("#fsUp")?.addEventListener("click", () => {
    fs = Math.min(20, fs + 1);
    applyFs();
  });

  // KPIs (+ top cause async)
  const kpiEl = $("#kpis");
  const paintKpis = (extra = []) => {
    const kpis = [
      { n: stats.cases ?? "219", l: "案例" },
      { n: stats.failed ?? "166", l: "关停" },
      { n: stats.success ?? "23", l: "存活" },
      ...extra,
    ];
    kpiEl.innerHTML = kpis
      .map(
        (k) =>
          `<div class="kpi"><span class="kpi__n">${esc(k.n)}</span><span class="kpi__l">${esc(k.l)}</span></div>`
      )
      .join("");
  };
  paintKpis();
  fetch("data/graveyard-stats.json")
    .then((r) => r.json())
    .then((g) => {
      const top = (g.top_causes && g.top_causes[0]) || null;
      if (!top) return;
      // keep 3-col on mobile: replace nothing, add note under kpis
      const note = document.createElement("p");
      note.className = "muted mono";
      note.style.margin = "10px 0 0";
      note.textContent = `高频死因 · ${top.cause}（${top.count}）`;
      kpiEl.after(note);
    })
    .catch(() => {});

  $$("#homePills .pill").forEach((btn) => {
    btn.addEventListener("click", () => {
      const go = btn.dataset.go;
      if (!go) return;
      if (go.startsWith("#")) location.hash = go;
      else location.href = go;
    });
  });

  const goSearch = () => {
    const q = ($("#homeSearch")?.value || "").trim();
    location.href = q ? `cases.html?q=${encodeURIComponent(q)}` : "cases.html";
  };
  $("#homeSearch")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") goSearch();
  });
  $("#homeSearchGo")?.addEventListener("click", goSearch);

  // weekly + checkboxes
  const WEEK_KEY = "sfn-week-done";
  fetch("data/weekly.json")
    .then((r) => r.json())
    .then((w) => {
      $("#weeklyMeta").textContent = `${w.week || ""} · 更新 ${String(w.updated_at || "").slice(0, 16)}`;
      const items = w.suggestions || [];
      const doneMap = ls.get(WEEK_KEY, {});
      const weekId = w.week || "w";
      const done = new Set(doneMap[weekId] || []);
      const paint = () => {
        $("#weeklyFeed").innerHTML = items
          .map((it, i) => {
            const id = String(i);
            const is = done.has(id);
            return `
        <article class="week-card${is ? " is-done" : ""}" data-i="${id}">
          <button type="button" class="week-card__check" aria-label="勾选完成">${is ? "✓" : ""}</button>
          <span class="week-card__n">0${i + 1}</span>
          <h3>${esc(it.title)}</h3>
          <p>${esc(it.why)}</p>
          <p><strong>行动</strong> ${esc(it.action)}</p>
          ${it.link ? `<a href="${esc(it.link)}" target="_blank" rel="noopener">来源 →</a>` : ""}
          ${it.href ? `<a href="${esc(it.href)}">对照档案 →</a>` : ""}
        </article>`;
          })
          .join("");
        $$("#weeklyFeed .week-card__check").forEach((btn) => {
          btn.addEventListener("click", (e) => {
            e.preventDefault();
            const card = btn.closest(".week-card");
            const id = card.dataset.i;
            if (done.has(id)) done.delete(id);
            else done.add(id);
            doneMap[weekId] = [...done];
            ls.set(WEEK_KEY, doneMap);
            paint();
          });
        });
      };
      paint();
    })
    .catch(() => {
      $("#weeklyFeed").innerHTML = `<p class="muted">周刊暂未加载</p>`;
    });

  // fail highlights
  fetch("data/failures-highlight.json")
    .then((r) => r.json())
    .then((d) => {
      const items = d.highlights || [];
      $("#failRail").innerHTML = items
        .map((c) => {
          const badge = /成功|Success/i.test(c.outcome || "")
            ? "ok"
            : /转型|pivot/i.test(c.outcome || "")
              ? "pivot"
              : "fail";
          return `
          <button type="button" class="tomb is-${badge}" data-href="cases.html?q=${encodeURIComponent(c.name)}">
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

  // lexicon + read state
  const LEX_KEY = "sfn-lex-read";
  const readSet = new Set(ls.get(LEX_KEY, []));
  const updateLexProgress = (n) => {
    const el = $("#lexProgress");
    if (!el) return;
    el.textContent = `已识 ${readSet.size} / ${n}`;
  };
  const paintLex = (items) => {
    const list = items || [];
    updateLexProgress(list.length);
    $("#lexGrid").innerHTML = list
      .map((L) => {
        const on = readSet.has(L.id);
        return `
        <article class="lex${on ? " is-read" : ""}" data-id="${esc(L.id)}">
          <div class="lex__head">
            <span class="lex__id">${esc(L.id)}</span>
            <span class="lex__tag">${esc(L.tag)}</span>
          </div>
          <div class="lex__body">
            <div class="lex__row"><strong>症状</strong>${esc(L.symptom)}</div>
            <div class="lex__row"><strong>尸检</strong>${esc(L.autopsy)}</div>
            <div class="lex__row"><strong>解药</strong>${esc(L.cure)}</div>
            <div class="lex__cases">${asList(L.cases)
              .map((x) => `<a href="cases.html?q=${encodeURIComponent(x)}">${esc(x)}</a>`)
              .join("")}</div>
            <div class="lex__foot">
              <button type="button" class="btn" data-read>${on ? "取消已识" : "标为已识"}</button>
            </div>
          </div>
        </article>`;
      })
      .join("");
    $$("#lexGrid [data-read]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.closest(".lex").dataset.id;
        if (readSet.has(id)) readSet.delete(id);
        else readSet.add(id);
        ls.set(LEX_KEY, [...readSet]);
        paintLex(list);
      });
    });
  };
  if (boot.lexicon?.length) paintLex(boot.lexicon);
  fetch("data/lexicon.json")
    .then((r) => r.json())
    .then((d) => paintLex(d.items || []))
    .catch(() => {
      if (!$("#lexGrid").querySelector(".lex"))
        $("#lexGrid").innerHTML = `<p class="muted">词典暂未加载</p>`;
    });

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

  // actions with checkboxes
  const ACT_KEY = "sfn-actions";
  const actDone = new Set(ls.get(ACT_KEY, []));
  const actions = boot.actions || {};
  const tabs = Object.keys(actions);
  const tabsEl = $("#actionTabs");
  const panel = $("#actionPanel");
  let active = tabs[0];
  const renderActions = () => {
    $$(".pill", tabsEl).forEach((p) => p.classList.toggle("is-on", p.dataset.k === active));
    panel.innerHTML = (actions[active] || [])
      .map((t, i) => {
        const id = `${active}:${i}`;
        const on = actDone.has(id);
        return `<li class="${on ? "is-done" : ""}" data-id="${esc(id)}"><input type="checkbox" ${on ? "checked" : ""}/><span>${esc(t)}</span></li>`;
      })
      .join("");
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
  panel.addEventListener("click", (e) => {
    const li = e.target.closest("li[data-id]");
    if (!li) return;
    const id = li.dataset.id;
    if (actDone.has(id)) actDone.delete(id);
    else actDone.add(id);
    ls.set(ACT_KEY, [...actDone]);
    renderActions();
  });
  renderActions();

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
