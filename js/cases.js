(() => {
  const grid = document.getElementById('grid');
  const count = document.getElementById('count');
  const q = document.getElementById('q');
  const region = document.getElementById('region');
  const outcome = document.getElementById('outcome');
  const chips = document.getElementById('sectorChips');
  const drawer = document.getElementById('caseDrawer');
  const backdrop = document.getElementById('drawerBackdrop');
  const drawerBody = document.getElementById('drawerBody');
  const drawerClose = document.getElementById('drawerClose');
  let cases = [];
  let total = 0;
  let sector = '';
  let lastFocus = null;
  let favOnly = false;
  const FAV_KEY = 'startup-guide-favs-v1';

  function loadFavs() {
    try { return JSON.parse(localStorage.getItem(FAV_KEY) || '[]') || []; }
    catch (e) { return []; }
  }
  function saveFavs(arr) {
    try { localStorage.setItem(FAV_KEY, JSON.stringify(arr)); } catch (e) {}
  }
  function isFav(name) {
    return loadFavs().includes(name);
  }
  function toggleFav(name) {
    const arr = loadFavs();
    const i = arr.indexOf(name);
    if (i >= 0) arr.splice(i, 1);
    else arr.push(name);
    saveFavs(arr);
    return arr.includes(name);
  }
  function syncFavBtn() {
    const btn = document.getElementById('favOnly');
    if (!btn) return;
    const n = loadFavs().length;
    btn.classList.toggle('active', favOnly);
    btn.setAttribute('aria-pressed', favOnly ? 'true' : 'false');
    btn.textContent = favOnly ? `★ 只看收藏（${n}）` : `☆ 只看收藏${n ? ' · ' + n : ''}`;
  }

  if (grid) {
    grid.innerHTML = Array.from({ length: 8 }, () => '<div class="case-skel" aria-hidden="true"></div>').join('');
  }

  function badge(o) {
    if (/成功|Success|pivot|进行中/i.test(o)) return 'badge-ok';
    if (/失败|Fail|关|崩|解散|清算|退场|尸检|Wind|Sunset|Killed|Closing|Liquidation|exit/i.test(o)) return 'badge-bad';
    return 'badge-mid';
  }

  function pillClass(o) {
    const b = badge(o);
    return b === 'badge-ok' ? 'ok' : b === 'badge-bad' ? 'bad' : 'mid';
  }

  function escapeHtml(s) {
    return String(s || '').replace(/[&<>"']/g, m => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[m]);
  }

  function syncUrl() {
    const params = new URLSearchParams();
    const qq = (q && q.value || '').trim();
    const r = region && region.value || '';
    const o = outcome && outcome.value || '';
    if (qq) params.set('q', qq);
    if (r) params.set('region', r);
    if (o) params.set('outcome', o);
    if (sector) params.set('sector', sector);
    if (favOnly) params.set('fav', '1');
    const sortEl = document.getElementById('sort');
    if (sortEl && sortEl.value && sortEl.value !== 'default') params.set('sort', sortEl.value);
    const qs = params.toString();
    const next = qs ? `?${qs}` : location.pathname;
    history.replaceState(null, '', next);
  }

  function readUrl() {
    const params = new URLSearchParams(location.search);
    if (q && params.has('q')) q.value = params.get('q') || '';
    if (region && params.has('region')) region.value = params.get('region') || '';
    if (outcome && params.has('outcome')) outcome.value = params.get('outcome') || '';
    if (params.has('sector')) sector = params.get('sector') || '';
    favOnly = params.get('fav') === '1';
  }

  function sectorKey(s) {
    return (s || '').split(/[·,/|]/)[0].trim();
  }

  function relatedCases(c, limit) {
    const key = sectorKey(c.sector);
    if (!key) return [];
    return cases.filter(x => x.name !== c.name && sectorKey(x.sector) === key).slice(0, limit || 4);
  }

  function caseMarkdown(c) {
    return [
      `## ${c.name}`,
      '',
      `- 地区：${c.region || '—'}`,
      `- 结果：${c.outcome || '—'}`,
      `- 人物：${c.who || '—'}`,
      `- 赛道：${c.sector || '—'}`,
      `- 来源：${c.src || '—'}`,
      c.timeline ? `- 时间线：${c.timeline}` : '',
      c.story ? `\n## 具体经历\n${c.story}` : '',
      c.lesson ? `\n## 教训\n${c.lesson}` : '',
      c.source_url ? `\n来源：${c.source_url}` : '',
      ''
    ].filter(Boolean).join('\n');
  }

  function openDrawer(c) {
    if (!drawer || !drawerBody) return;
    lastFocus = document.activeElement;
    const starred = isFav(c.name);
    const related = relatedCases(c, 4);
    const relatedHtml = related.length
      ? `<div class="drawer-related">
          <p class="drawer-related-label">同赛道 · ${escapeHtml(sectorKey(c.sector))}</p>
          <div class="drawer-related-list">
            ${related.map(r => `<button type="button" class="related-chip" data-name="${escapeHtml(r.name)}"><span class="related-name">${escapeHtml(r.name)}</span><span class="related-out ${pillClass(r.outcome)}">${escapeHtml(r.outcome || '')}</span></button>`).join('')}
          </div>
        </div>`
      : '';
    drawerBody.innerHTML = `
      <div class="drawer-top">
        <div>
          <p class="drawer-kicker">Case detail</p>
          <h2 id="drawerTitle">${escapeHtml(c.name)}</h2>
        </div>
        <button type="button" class="fav-btn drawer-fav${starred ? ' on' : ''}" data-name="${escapeHtml(c.name)}" aria-pressed="${starred ? 'true' : 'false'}" aria-label="${starred ? '取消收藏' : '收藏'}">${starred ? '★' : '☆'}</button>
      </div>
      <div class="drawer-meta">
        <span class="pill">${escapeHtml(c.region || '')}</span>
        <span class="pill ${pillClass(c.outcome)}">${escapeHtml(c.outcome || '')}</span>
        <span class="pill">${escapeHtml(c.src || '')}</span>
      </div>
      <dl>
        <div><dt>人物</dt><dd>${escapeHtml(c.who || '—')}</dd></div>
        <div><dt>赛道</dt><dd>${escapeHtml(c.sector || '—')}</dd></div>
        <div><dt>结果标签</dt><dd>${escapeHtml(c.outcome || '—')}</dd></div>
        ${c.timeline ? `<div><dt>时间线</dt><dd>${escapeHtml(c.timeline)}</dd></div>` : ''}
        ${c.cause ? `<div><dt>主因</dt><dd>${escapeHtml(c.cause)}</dd></div>` : ''}
        ${c.lifespan ? `<div><dt>存活</dt><dd>${escapeHtml(c.lifespan)}</dd></div>` : ''}
        ${c.capital ? `<div><dt>资金</dt><dd>${escapeHtml(c.capital)}</dd></div>` : ''}
        ${c.country ? `<div><dt>地区</dt><dd>${escapeHtml(c.country)}</dd></div>` : ''}
      </dl>
      ${c.story || c.lesson || c.source_url ? `<div class="story-block">
        ${c.story ? `<h4>具体经历</h4><p>${escapeHtml(c.story)}</p>` : ''}
        ${c.lesson ? `<h4>教训</h4><p>${escapeHtml(c.lesson)}</p>` : ''}
        ${Array.isArray(c.tags)&&c.tags.length ? `<p style="margin-top:.6rem">${c.tags.map(x=>`<span class="pill">${escapeHtml(x)}</span>`).join(' ')}</p>` : ''}
        ${c.source_url ? `<p style="margin-top:.6rem"><a href="${escapeHtml(c.source_url)}" target="_blank" rel="noopener">来源原文</a></p>` : ''}
      </div>` : ''}
      <div class="drawer-actions">
        <button type="button" class="drawer-copy" id="copyCaseMd" data-name="${escapeHtml(c.name)}">复制 Markdown</button>
      </div>
      ${relatedHtml}
      <p class="drawer-hint">条目来自通宵档案索引。j / k 浏览卡片，Enter 打开。收藏只保存在本机。</p>
    `;
    drawer.classList.add('open');
    if (backdrop) backdrop.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    if (drawerClose) drawerClose.focus();
    const copyBtn = document.getElementById('copyCaseMd');
    if (copyBtn) {
      copyBtn.addEventListener('click', async () => {
        const md = caseMarkdown(c);
        try {
          await navigator.clipboard.writeText(md);
          toast('已复制案例 Markdown');
        } catch (err) {
          toast('复制失败，请手动选中');
        }
      });
    }
  }

  function closeDrawer() {
    if (!drawer) return;
    drawer.classList.remove('open');
    if (backdrop) backdrop.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function render(list) {
    const favN = loadFavs().length;
    count.textContent = favOnly
      ? `收藏 ${list.length} / 本机 ${favN} · 点星标管理`
      : `显示 ${list.length} / 索引 ${total} 条 · 点卡片看详情 · 点星收藏`;
    if (!list.length) {
      grid.innerHTML = favOnly
        ? '<p class="count">还没有收藏。点卡片右上角的 ☆ 即可加入本机收藏。</p>'
        : '<p class="count">没有匹配的案例，试试换个关键词。</p>';
      return;
    }
    grid.innerHTML = list.map((c, i) => {
      const starred = isFav(c.name);
      return `
      <article class="case${starred ? ' is-fav' : ''}" tabindex="0" role="button" aria-haspopup="dialog" data-i="${i}">
        <button type="button" class="fav-btn card-fav${starred ? ' on' : ''}" data-name="${escapeHtml(c.name)}" aria-pressed="${starred ? 'true' : 'false'}" aria-label="${starred ? '取消收藏' : '收藏'}" title="本机收藏">${starred ? '★' : '☆'}</button>
        <div class="meta"><span>${escapeHtml(c.region)}</span><span class="${badge(c.outcome)}">${escapeHtml(c.outcome)}</span></div>
        <h3>${escapeHtml(c.name)}</h3>
        <p class="who">${escapeHtml(c.who || '')}</p>
        <p class="sector">${escapeHtml(c.sector || '')}</p>
        ${c.story ? `<p class="kb-story">${escapeHtml(c.story)}</p>` : ''}
        ${c.lesson ? `<p class="kb-lesson">${escapeHtml(c.lesson)}</p>` : ''}
        ${Array.isArray(c.tags)&&c.tags.length ? `<div class="tags">${c.tags.slice(0,3).map(x=>`<span>${escapeHtml(x)}</span>`).join('')}</div>` : ''}
      </article>`;
    }).join('');
    grid._list = list;
  }

  function topSectors(list) {
    const map = new Map();
    list.forEach(c => {
      const s = (c.sector || '').split(/[·,/|]/)[0].trim();
      if (!s || s.length > 18) return;
      map.set(s, (map.get(s) || 0) + 1);
    });
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([s]) => s);
  }

  function renderChips() {
    if (!chips) return;
    const secs = topSectors(cases);
    chips.innerHTML = `<button type="button" data-s="" class="${sector ? '' : 'active'}">全部赛道</button>` +
      secs.map(s => `<button type="button" data-s="${escapeHtml(s)}" class="${sector === s ? 'active' : ''}">${escapeHtml(s)}</button>`).join('');
  }

  function filter() {
    const qq = q.value.trim().toLowerCase();
    const r = region.value;
    const o = outcome.value;
    const sortEl = document.getElementById('sort');
    const sort = (sortEl && sortEl.value) || 'default';
    const favs = new Set(loadFavs());
    let list = cases.filter(c => {
      if (favOnly && !favs.has(c.name)) return false;
      if (r && c.region !== r) return false;
      if (o && !c.outcome.includes(o) && !(o === '关' && /关|停|退|清算|解散|风|farewell|wind|Sunset|Closing|Liquidation|exit/i.test(c.outcome))) return false;
      if (sector && !(c.sector || '').includes(sector)) return false;
      if (qq) {
        const blob = (c.name + c.who + c.sector + c.outcome).toLowerCase();
        if (!blob.includes(qq)) return false;
      }
      return true;
    });
    if (sort === 'name') {
      list = list.slice().sort((a, b) => (a.name || '').localeCompare(b.name || '', 'zh'));
    } else if (sort === 'outcome') {
      const rank = o => {
        if (/成功|Success|pivot|进行中/i.test(o || '')) return 0;
        if (/失败|Fail|关|崩|解散|清算|退|Wind|Sunset|Closing|exit|Killed|Liquidation|farewell/i.test(o || '')) return 2;
        return 1;
      };
      list = list.slice().sort((a, b) => rank(a.outcome) - rank(b.outcome) || (a.name || '').localeCompare(b.name || '', 'zh'));
    } else if (sort === 'sector') {
      list = list.slice().sort((a, b) => (a.sector || '').localeCompare(b.sector || '', 'zh') || (a.name || '').localeCompare(b.name || '', 'zh'));
    }
    render(list);
    syncFavBtn();
    syncUrl();
  }

  if (chips) {
    chips.addEventListener('click', e => {
      const b = e.target.closest('button');
      if (!b) return;
      sector = b.dataset.s || '';
      renderChips();
      filter();
    });
  }
  [q, region, outcome].forEach(el => el && el.addEventListener('input', filter));
  const sortSel = document.getElementById('sort');
  if (sortSel) sortSel.addEventListener('change', filter);

  const favOnlyBtn = document.getElementById('favOnly');
  if (favOnlyBtn) {
    favOnlyBtn.addEventListener('click', () => {
      favOnly = !favOnly;
      filter();
    });
  }

  if (drawerBody) {
    drawerBody.addEventListener('click', e => {
      const rel = e.target.closest('.related-chip');
      if (rel) {
        e.preventDefault();
        const name = rel.dataset.name;
        const next = cases.find(x => x.name === name);
        if (next) openDrawer(next);
        return;
      }
      const b = e.target.closest('.fav-btn');
      if (!b) return;
      e.stopPropagation();
      const name = b.dataset.name;
      const on = toggleFav(name);
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      b.setAttribute('aria-label', on ? '取消收藏' : '收藏');
      b.textContent = on ? '★' : '☆';
      filter();
    });
  }

  if (grid) {
    grid.addEventListener('click', e => {
      const fav = e.target.closest('.fav-btn');
      if (fav) {
        e.preventDefault();
        e.stopPropagation();
        const name = fav.dataset.name;
        const on = toggleFav(name);
        fav.classList.toggle('on', on);
        fav.setAttribute('aria-pressed', on ? 'true' : 'false');
        fav.setAttribute('aria-label', on ? '取消收藏' : '收藏');
        fav.textContent = on ? '★' : '☆';
        filter();
        return;
      }
      const card = e.target.closest('.case');
      if (!card || !grid._list) return;
      const i = +card.dataset.i;
      const c = grid._list[i];
      if (c) openDrawer(c);
    });
    grid.addEventListener('keydown', e => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const card = e.target.closest('.case');
      if (!card || !grid._list) return;
      e.preventDefault();
      const i = +card.dataset.i;
      const c = grid._list[i];
      if (c) openDrawer(c);
    });
  }
  if (drawerClose) drawerClose.addEventListener('click', closeDrawer);
  if (backdrop) backdrop.addEventListener('click', closeDrawer);
  window.addEventListener('keydown', e => {
    if (e.key === 'Escape' && drawer && drawer.classList.contains('open')) closeDrawer();
  });

  // mobile nav + backdrop
  const toggle = document.getElementById('navToggle');
  const nav = document.getElementById('nav');
  const navBackdrop = document.getElementById('navBackdrop');
  function setNavOpen(open) {
    if (!toggle || !nav) return;
    nav.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.setAttribute('aria-label', open ? '关闭菜单' : '打开菜单');
    if (navBackdrop) {
      if (open) navBackdrop.removeAttribute('hidden');
      else navBackdrop.setAttribute('hidden', '');
    }
  }
  if (toggle && nav) {
    toggle.addEventListener('click', () => setNavOpen(!nav.classList.contains('open')));
    nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setNavOpen(false)));
    if (navBackdrop) navBackdrop.addEventListener('click', () => setNavOpen(false));
  }

  const toTop = document.getElementById('toTop');
  if (toTop) {
    window.addEventListener('scroll', () => {
      toTop.classList.toggle('show', window.scrollY > 480);
    }, { passive: true });
    toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }


  function classifyOutcome(o) {
    o = o || '';
    if (/成功|Success|pivot|进行中/i.test(o)) return 'ok';
    if (/失败|Fail|关|崩|解散|清算|退|Wind|Sunset|Closing|exit|Killed|Liquidation|farewell/i.test(o)) return 'bad';
    return 'mid';
  }

  function paintPulse(list) {
    const bars = document.getElementById('pulseBars');
    const legend = document.getElementById('pulseLegend');
    if (!bars) return;
    let ok = 0, bad = 0, mid = 0;
    list.forEach(c => {
      const k = classifyOutcome(c.outcome);
      if (k === 'ok') ok += 1;
      else if (k === 'bad') bad += 1;
      else mid += 1;
    });
    const total = Math.max(1, ok + bad + mid);
    const parts = [
      { k: 'ok', n: ok, label: '偏成功', outcome: '成功' },
      { k: 'bad', n: bad, label: '偏失败/关停', outcome: '失败' },
      { k: 'mid', n: mid, label: '进行中/其他', outcome: '' }
    ];
    bars.innerHTML = parts.map(p => {
      const pct = p.n / total * 100;
      return `<button type="button" class="pulse-seg ${p.k}" style="width:${pct}%" data-outcome="${p.outcome}" title="${p.label} ${p.n}" aria-label="${p.label} ${p.n} 条"></button>`;
    }).join('');
    if (legend) {
      legend.innerHTML = parts.map(p =>
        `<button type="button" data-outcome="${p.outcome}"><span class="pulse-dot ${p.k}" aria-hidden="true"></span>${p.label} ${p.n}</button>`
      ).join('');
    }
    const apply = e => {
      const b = e.target.closest('[data-outcome]');
      if (!b || !outcome) return;
      outcome.value = b.dataset.outcome || '';
      filter();
    };
    bars.onclick = apply;
    if (legend) legend.onclick = apply;
  }


  readUrl();
  syncFavBtn();

  fetch('data/cases.json')
    .then(r => r.json())
    .then(data => {
      cases = data.cases || [];
      total = data.total || cases.length;
      paintPulse(cases);
      renderChips();
      filter();
    })
    .catch(() => {
      if (count) count.textContent = '案例加载失败，请刷新重试';
      if (grid) grid.innerHTML = '';
    });


  // v11 comfort + toast (shared with homepage prefs)
  function toast(msg) {
    const host = document.getElementById('toastHost');
    if (!host) return;
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = msg;
    host.appendChild(el);
    setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 260); }, 1800);
  }
  window.__sgToast = toast;

  // v12 — j/k card browse + compact density
  let focusIdx = -1;
  function cards() {
    return grid ? [...grid.querySelectorAll('.case')] : [];
  }
  function setFocusIdx(i) {
    const list = cards();
    if (!list.length) return;
    focusIdx = Math.max(0, Math.min(list.length - 1, i));
    list.forEach((el, n) => el.classList.toggle('is-focus', n === focusIdx));
    const el = list[focusIdx];
    if (el) {
      el.focus({ preventScroll: false });
      el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }
  window.addEventListener('keydown', e => {
    const tag = (e.target && e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select' || (e.target && e.target.isContentEditable)) return;
    if (drawer && drawer.classList.contains('open')) return;
    if (e.key === 'j' || e.key === 'J') {
      e.preventDefault();
      setFocusIdx(focusIdx < 0 ? 0 : focusIdx + 1);
    } else if (e.key === 'k' || e.key === 'K') {
      e.preventDefault();
      setFocusIdx(focusIdx < 0 ? 0 : focusIdx - 1);
    }
  });

  (function density() {
    const KEY = 'startup-guide-density-v1';
    const btn = document.getElementById('densityToggle');
    const ROOT = document.documentElement;
    let compact = false;
    try { compact = localStorage.getItem(KEY) === '1'; } catch (e) {}
    function apply() {
      ROOT.setAttribute('data-density', compact ? 'compact' : 'comfy');
      if (btn) {
        btn.setAttribute('aria-pressed', compact ? 'true' : 'false');
        btn.textContent = compact ? '紧凑' : '舒展';
      }
    }
    apply();
    if (btn) btn.addEventListener('click', () => {
      compact = !compact;
      try { localStorage.setItem(KEY, compact ? '1' : '0'); } catch (e) {}
      apply();
      toast(compact ? '已开紧凑视图' : '已回舒展视图');
    });
  })();

  (function comfort() {
    const ROOT = document.documentElement;
    const KEY = 'startup-guide-comfort-v1';
    const STEPS = [0.9, 1, 1.08, 1.16, 1.25];
    function load() {
      try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; }
      catch (e) { return {}; }
    }
    function save(state) {
      try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
    }
    function apply(state) {
      const scale = STEPS.includes(state.scale) ? state.scale : 1;
      state.scale = scale;
      ROOT.style.setProperty('--font-scale', String(scale));
      if (state.paper) ROOT.setAttribute('data-paper', '1');
      else ROOT.removeAttribute('data-paper');
      const paperBtn = document.getElementById('paperToggle');
      if (paperBtn) paperBtn.setAttribute('aria-pressed', state.paper ? 'true' : 'false');
    }
    const state = Object.assign({ scale: 1, paper: false }, load());
    apply(state);
    function bump(dir) {
      let i = STEPS.indexOf(state.scale);
      if (i < 0) i = 1;
      i = Math.max(0, Math.min(STEPS.length - 1, i + dir));
      state.scale = STEPS[i];
      apply(state);
      save(state);
      toast(`字号 ${Math.round(state.scale * 100)}%`);
    }
    const down = document.getElementById('fontDown');
    const up = document.getElementById('fontUp');
    const paper = document.getElementById('paperToggle');
    if (down) down.addEventListener('click', () => bump(-1));
    if (up) up.addEventListener('click', () => bump(1));
    if (paper) paper.addEventListener('click', () => {
      state.paper = !state.paper;
      apply(state);
      save(state);
      toast(state.paper ? '已开纸质阅读模式' : '已回深色编辑室');
    });
  })();



  // v13: dual-select compare
  (function compareMode() {
    const toggle = document.getElementById('compareToggle');
    const tray = document.getElementById('compareTray');
    const chips = document.getElementById('compareChips');
    const countEl = document.getElementById('compareCount');
    const runBtn = document.getElementById('compareRun');
    const clearBtn = document.getElementById('compareClear');
    const panel = document.getElementById('comparePanel');
    const backdrop = document.getElementById('compareBackdrop');
    const gridEl = document.getElementById('compareGrid');
    const closeBtn = document.getElementById('compareClose');
    if (!toggle || !tray) return;

    let on = false;
    let picked = [];

    function byName(name) {
      return cases.find(c => c.name === name);
    }

    function syncTray() {
      if (countEl) countEl.textContent = String(picked.length);
      if (chips) {
        chips.innerHTML = picked.map(n => {
          const c = byName(n);
          return `<span class="compare-chip">${escapeHtml(c ? c.name : n)}<button type="button" data-rm="${escapeHtml(n)}" aria-label="移除">×</button></span>`;
        }).join('');
      }
      if (runBtn) runBtn.disabled = picked.length !== 2;
      if (grid) {
        grid.querySelectorAll('.case').forEach(card => {
          const list = grid._list || [];
          const i = +card.dataset.i;
          const item = list[i];
          const name = item && item.name;
          card.classList.toggle('compare-picked', !!(name && picked.includes(name)));
          card.classList.toggle('compare-pickable', on);
        });
      }
    }

    function setOn(v) {
      on = v;
      toggle.setAttribute('aria-pressed', on ? 'true' : 'false');
      toggle.classList.toggle('active', on);
      tray.hidden = !on;
      if (!on) {
        picked = [];
        closeCompare();
      }
      syncTray();
      toast(on ? '对比模式：点两张卡片' : '已退出对比');
    }

    function openCompare() {
      if (picked.length !== 2 || !panel || !gridEl) return;
      const a = byName(picked[0]);
      const b = byName(picked[1]);
      if (!a || !b) return;
      function col(c) {
        return `<div class="compare-col">
          <h3>${escapeHtml(c.name)}</h3>
          <div class="drawer-meta" style="margin-bottom:.75rem">
            <span class="pill">${escapeHtml(c.region || '')}</span>
            <span class="pill ${pillClass(c.outcome)}">${escapeHtml(c.outcome || '')}</span>
          </div>
          <dl>
            <div><dt>人物</dt><dd>${escapeHtml(c.who || '—')}</dd></div>
            <div><dt>赛道</dt><dd>${escapeHtml(c.sector || '—')}</dd></div>
            <div><dt>结果</dt><dd>${escapeHtml(c.outcome || '—')}</dd></div>
            <div><dt>来源</dt><dd>${escapeHtml(c.src || '—')}</dd></div>
          </dl>
        </div>`;
      }
      const sameSector = sectorKey(a.sector) && sectorKey(a.sector) === sectorKey(b.sector);
      const sameRegion = a.region && a.region === b.region;
      gridEl.innerHTML = col(a) + col(b) +
        `<p class="compare-diff" style="grid-column:1/-1">对照提示：${sameSector ? '同赛道切片 · ' : '跨赛道 · '}${sameRegion ? '同地区' : '跨地区'}。结果标签来自档案索引，非统一评级。</p>`;
      panel.hidden = false;
      if (backdrop) backdrop.hidden = false;
      document.body.style.overflow = 'hidden';
      if (closeBtn) closeBtn.focus();
    }

    function closeCompare() {
      if (panel) panel.hidden = true;
      if (backdrop) backdrop.hidden = true;
      if (!drawer || !drawer.classList.contains('open')) {
        document.body.style.overflow = '';
      }
    }

    toggle.addEventListener('click', () => setOn(!on));
    if (clearBtn) clearBtn.addEventListener('click', () => { picked = []; syncTray(); });
    if (runBtn) runBtn.addEventListener('click', openCompare);
    if (closeBtn) closeBtn.addEventListener('click', closeCompare);
    if (backdrop) backdrop.addEventListener('click', closeCompare);
    if (chips) chips.addEventListener('click', e => {
      const b = e.target.closest('[data-rm]');
      if (!b) return;
      picked = picked.filter(n => n !== b.dataset.rm);
      syncTray();
    });

    // intercept card click when compare on
    if (grid) {
      grid.addEventListener('click', e => {
        if (!on) return;
        if (e.target.closest('.fav-btn')) return;
        const card = e.target.closest('.case');
        if (!card || !grid._list) return;
        e.preventDefault();
        e.stopPropagation();
        const item = grid._list[+card.dataset.i];
        if (!item) return;
        const name = item.name;
        if (picked.includes(name)) {
          picked = picked.filter(n => n !== name);
        } else if (picked.length >= 2) {
          toast('先清空或移除一项再选');
          return;
        } else {
          picked.push(name);
        }
        syncTray();
        if (picked.length === 2) toast('已选满，可点并排对照');
      }, true);
    }

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && panel && !panel.hidden) {
        e.preventDefault();
        closeCompare();
      }
    });

    // re-sync pick styles after filter/render
    const _render = render;
    // wrap via MutationObserver on grid
    const mo = new MutationObserver(() => { if (on) syncTray(); });
    if (grid) mo.observe(grid, { childList: true });
  })();



  // v14: accent theme + focus mode (shared prefs with homepage)
  (function themeAndFocus() {
    const ROOT = document.documentElement;
    const KEY = 'startup-guide-theme-v1';
    const ACCENTS = ['coral', 'teal', 'gold', 'violet'];
    function load() {
      try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; }
      catch (e) { return {}; }
    }
    function save(state) {
      try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
    }
    function apply(state) {
      const accent = ACCENTS.includes(state.accent) ? state.accent : 'coral';
      state.accent = accent;
      if (accent === 'coral') ROOT.removeAttribute('data-accent');
      else ROOT.setAttribute('data-accent', accent);
      if (state.focus) ROOT.setAttribute('data-focus', '1');
      else ROOT.removeAttribute('data-focus');
      const focusBtn = document.getElementById('focusToggle');
      if (focusBtn) focusBtn.setAttribute('aria-pressed', state.focus ? 'true' : 'false');
      document.querySelectorAll('#accentSwatches .accent-dot').forEach(btn => {
        const on = btn.dataset.accent === accent;
        btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
    }
    const state = Object.assign({ accent: 'coral', focus: false }, load());
    apply(state);
    document.querySelectorAll('#accentSwatches .accent-dot').forEach(btn => {
      btn.addEventListener('click', () => {
        state.accent = btn.dataset.accent || 'coral';
        apply(state);
        save(state);
        if (window.__sgToast) {
          const labels = { coral: '珊瑚', teal: '青绿', gold: '琥珀', violet: '藤紫' };
          window.__sgToast(`强调色 · ${labels[state.accent] || state.accent}`);
        }
      });
    });
    function toggleFocus() {
      state.focus = !state.focus;
      apply(state);
      save(state);
      if (window.__sgToast) window.__sgToast(state.focus ? '已开专注阅读' : '已退出专注');
    }
    const focusBtn = document.getElementById('focusToggle');
    if (focusBtn) focusBtn.addEventListener('click', toggleFocus);
    window.addEventListener('keydown', e => {
      if (e.defaultPrevented) return;
      const tag = (e.target && e.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || (e.target && e.target.isContentEditable)) return;
      if (e.key === 'f' || e.key === 'F') {
        if (e.metaKey || e.ctrlKey || e.altKey) return;
        // avoid clash with fav filter letter if any — F alone is focus
        e.preventDefault();
        toggleFocus();
      }
    });
  })();




  // v15: export filtered cases as CSV
  (function exportCsv() {
    const btn = document.getElementById('exportCsv');
    if (!btn) return;
    function csvEscape(v) {
      const s = String(v == null ? '' : v);
      if (/[",\n\r]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
      return s;
    }
    btn.addEventListener('click', () => {
      const list = (grid && grid._list) ? grid._list : [];
      if (!list.length) {
        toast('当前没有可导出的案例');
        return;
      }
      const header = ['name', 'who', 'outcome', 'sector', 'region', 'src'];
      const rows = [header.join(',')].concat(list.map(c => header.map(k => csvEscape(c[k])).join(',')));
      const blob = new Blob(['\ufeff' + rows.join('\n')], { type: 'text/csv;charset=utf-8' });
      const a = document.createElement('a');
      const stamp = new Date().toISOString().slice(0, 10);
      a.href = URL.createObjectURL(blob);
      a.download = `startup-cases-${stamp}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 1500);
      toast(`已导出 ${list.length} 条 CSV`);
    });
  })();


})();


/* v22 story in drawer if panel exists */
window.__enrichCaseDetail = function(c, el){
  if (!el || !c) return;
  let block = el.querySelector('.story-block');
  if (!c.story && !c.lesson) { if (block) block.remove(); return; }
  if (!block) {
    block = document.createElement('div');
    block.className = 'story-block';
    el.appendChild(block);
  }
  block.innerHTML = `
    ${c.timeline ? `<p style="font-family:var(--mono);font-size:.75rem;color:var(--ink-faint)">${c.timeline}</p>` : ''}
    ${c.story ? `<h4>具体经历</h4><p>${c.story}</p>` : ''}
    ${c.lesson ? `<h4>教训</h4><p>${c.lesson}</p>` : ''}
    ${c.source_url ? `<p style="margin-top:.6rem"><a href="${c.source_url}" target="_blank" rel="noopener">来源</a></p>` : ''}
  `;
};
