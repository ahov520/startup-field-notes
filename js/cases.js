(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) =>
    String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const bucket = (o) => {
    const s = String(o || "");
    if (/转型|pivot|merge|重构|Success\+pivot|Success\/merge/i.test(s)) return "转型";
    if (/^(成功|Success|Success-in-progress|成功进行中|存活)/i.test(s) || (/成功|Success|survive|存活|重整成功/i.test(s) && !/失败|Fail|关停|破产|关闭|先成后败/i.test(s)))
      return "成功";
    if (/失败|Fail|关停|破产|关闭|清算|注销|停业|Sunset|Shut|Killed|Wind-down|Paused|停止|崩|跑路|解散|Bankruptcy|Liquidation|Closing|Market exit|Ops pause|Retreat|Relocate|Orderly|主动暂停|主动关闭|危机|巨亏|流量断崖|砍到|判决|停工|闪电|业务终止|日落|退卡|停做|postmortem|wind-down|IBC|solvent|voluntary|quiet close|founder capacity|collapse|Stopped|deliberate|回巢|供应链|青年线下/i.test(s))
      return "失败";
    if (/模式库|Pattern|Essay|进行中复盘/i.test(s)) return "其他";
    return "失败"; // default graveyard bias for ambiguous shutdown-ish labels
  };
  const isDomestic = (c) =>
    c.region === "国内" ||
    c.country === "中国" ||
    /中国|国内/.test(String(c.region || "")) ||
    /中国/.test(String(c.country || ""));

  const params = new URLSearchParams(location.search);
  let filter = params.get("outcome") || "all";
  let query = params.get("q") || "";
  let cause = params.get("cause") || "";
  let sort = params.get("sort") || "default";

  const qInput = $("#q");
  if (query) qInput.value = query;

  let cases = [];
  let didAutoOpen = false;

  const badgeClass = (b) => (b === "成功" ? "ok" : b === "转型" ? "pivot" : "fail");
  const icon = (b) => (b === "成功" ? "✦" : b === "转型" ? "↻" : "🪦");

  // progress + toTop
  const bar = $("#progress");
  const onScroll = () => {
    const h = document.documentElement;
    const max = h.scrollHeight - h.clientHeight;
    if (bar) bar.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + "%";
    $("#toTop")?.classList.toggle("is-show", h.scrollTop > 480);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  $("#toTop")?.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

  const match = (c) => {
    const b = bucket(c.outcome);
    if (filter === "失败" && b !== "失败") return false;
    if (filter === "成功" && b !== "成功") return false;
    if (filter === "转型" && b !== "转型") return false;
    if (filter === "国内" && !isDomestic(c)) return false;
    if (filter === "海外" && isDomestic(c)) return false;
    if (cause && c.cause != cause) return false;
    if (!query) return true;
    const hay = [c.name, c.who, c.story, c.lesson, c.cause, c.sector, c.region, c.country, ...(c.tags || [])]
      .join(" ")
      .toLowerCase();
    return hay.includes(query.toLowerCase());
  };

  const sorted = (list) => {
    const arr = list.slice();
    if (sort === "fail") {
      arr.sort((a, b) => (bucket(a.outcome) === "失败" ? 0 : 1) - (bucket(b.outcome) === "失败" ? 0 : 1));
    } else if (sort === "story") {
      arr.sort((a, b) => (b.story || "").length - (a.story || "").length);
    }
    return arr;
  };

  const syncUrl = () => {
    const p = new URLSearchParams();
    if (query) p.set("q", query);
    if (filter && filter !== "all") p.set("outcome", filter);
    if (cause) p.set("cause", cause);
    if (sort && sort !== "default") p.set("sort", sort);
    const qs = p.toString();
    history.replaceState(null, "", qs ? `?${qs}` : location.pathname);
  };

  const render = () => {
    const list = sorted(cases.filter(match));
    $("#resultMeta").textContent = `显示 ${list.length} / ${cases.length}${cause ? ` · 死因「${cause}」` : ""}`;
    $("#caseCount").textContent = String(list.length);
    const empty = $("#empty");
    const grid = $("#grid");
    if (!list.length) {
      grid.innerHTML = "";
      empty.hidden = false;
      syncUrl();
      return;
    }
    empty.hidden = true;
    grid.innerHTML = list
      .map((c, i) => {
        const b = bucket(c.outcome);
        return `
      <button type="button" class="tomb is-${badgeClass(b)}" data-i="${i}">
        <div class="tomb__head">
          <span class="tomb__icon ${b === "成功" ? "is-ok" : "is-fail"}">${icon(b)}</span>
          <span class="tomb__badge ${badgeClass(b)}">${esc(b)}</span>
        </div>
        <div class="tomb__name">${esc(c.name)}</div>
        <div class="tomb__cause">${esc(c.cause || c.sector || "")}</div>
        <p class="tomb__story">${esc(c.story || c.lesson || "")}</p>
      </button>`;
      })
      .join("");
    grid._list = list;
    $$(".tomb", grid).forEach((el) => {
      el.addEventListener("click", () => openDrawer(grid._list[+el.dataset.i]));
    });
    syncUrl();
    if (!didAutoOpen && query) {
      didAutoOpen = true;
      const exact = list.find((c) => c.name.toLowerCase() === query.toLowerCase());
      if (exact) openDrawer(exact);
      else if (list.length === 1) openDrawer(list[0]);
    }
  };

  const drawer = $("#drawer");
  const body = $("#drawerBody");
  const openDrawer = (c) => {
    if (!c) return;
    const b = bucket(c.outcome);
    body.innerHTML = `
      <h2>${esc(c.name)}</h2>
      <div class="meta-row">
        <span class="chip">${esc(b)} · ${esc(c.outcome || "")}</span>
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
      <div class="drawer__actions">
        ${
          c.source_url
            ? `<a class="btn btn--primary" href="${esc(c.source_url)}" target="_blank" rel="noopener">查看来源</a>`
            : c.src
              ? `<span class="chip">${esc(c.src)}</span>`
              : ""
        }
        <button type="button" class="btn" id="copyLesson">复制教训</button>
      </div>
    `;
    $("#copyLesson")?.addEventListener("click", async () => {
      const text = `${c.name}\n结局：${c.outcome || ""}\n死因：${c.cause || ""}\n教训：${c.lesson || c.story || ""}`;
      try {
        await navigator.clipboard.writeText(text);
        const btn = $("#copyLesson");
        btn.textContent = "已复制";
        setTimeout(() => (btn.textContent = "复制教训"), 1200);
      } catch {
        alert(text);
      }
    });
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
  $$("#sortPills .pill").forEach((btn) => {
    btn.classList.toggle("is-on", btn.dataset.s === sort);
    btn.addEventListener("click", () => {
      sort = btn.dataset.s;
      $$("#sortPills .pill").forEach((b) => b.classList.toggle("is-on", b.dataset.s === sort));
      render();
    });
  });

  let t;
  qInput.addEventListener("input", () => {
    clearTimeout(t);
    t = setTimeout(() => {
      query = qInput.value.trim();
      closeDrawer();
      render();
    }, 120);
  });

  const paintCauses = (top) => {
    const row = $("#causeRow");
    if (!row) return;
    const items = [{ cause: "", label: "全部死因" }, ...top.slice(0, 8).map((x) => ({ cause: x.cause, label: `${x.cause} ${x.count}` }))];
    row.innerHTML = items
      .map(
        (x) =>
          `<button type="button" class="pill${(x.cause || "") === cause ? " is-on" : ""}" data-c="${esc(x.cause)}">${esc(x.label)}</button>`
      )
      .join("");
    row.addEventListener("click", (e) => {
      const b = e.target.closest("[data-c]");
      if (!b) return;
      cause = b.dataset.c;
      $$("#causeRow .pill").forEach((p) => p.classList.toggle("is-on", p.dataset.c === cause));
      closeDrawer();
      render();
    });
  };

  Promise.all([
    fetch("data/cases.json").then((r) => r.json()),
    fetch("data/graveyard-stats.json").then((r) => r.json()).catch(() => ({ top_causes: [] })),
  ])
    .then(([d, g]) => {
      cases = d.cases || [];
      paintCauses(g.top_causes || []);
      render();
    })
    .catch(() => {
      $("#resultMeta").textContent = "档案加载失败";
    });
})();
