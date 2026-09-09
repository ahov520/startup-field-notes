(() => {
  const boot = document.getElementById('boot-data');
  let data = null;
  try { data = boot ? JSON.parse(boot.textContent) : null; } catch (e) {}

  const ACTIONS = data ? data.actions : null;
  const tabs = document.getElementById('actionTabs');
  const panel = document.getElementById('actionPanel');
  const progressEl = document.getElementById('actionProgress');
  const CHECK_KEY = 'startup-guide-checks-v1';

  function loadChecks() {
    try { return JSON.parse(localStorage.getItem(CHECK_KEY) || '{}') || {}; }
    catch (e) { return {}; }
  }
  function saveChecks(map) {
    try { localStorage.setItem(CHECK_KEY, JSON.stringify(map)); } catch (e) {}
  }

  function countAllDone(map) {
    if (!ACTIONS) return { done: 0, total: 0 };
    let done = 0, total = 0;
    Object.keys(ACTIONS).forEach(key => {
      (ACTIONS[key] || []).forEach((text, i) => {
        total += 1;
        if (map[`${key}::${i}`]) done += 1;
      });
    });
    return { done, total };
  }

  function updateProgress(map) {
    if (!progressEl) return;
    const { done, total } = countAllDone(map);
    if (!total) { progressEl.textContent = ''; return; }
    const pct = Math.round((done / total) * 100);
    progressEl.textContent = done
      ? `已勾选 ${done} / ${total}（${pct}%）· 保存在本机`
      : `共 ${total} 项可勾选 · 进度保存在本机`;
  }

  function showAction(key) {
    if (!tabs || !panel || !ACTIONS) return;
    [...tabs.querySelectorAll('.tab')].forEach(b => b.classList.toggle('active', b.dataset.key === key));
    const map = loadChecks();
    const items = ACTIONS[key] || [];
    panel.innerHTML = items.map((text, i) => {
      const id = `${key}::${i}`;
      const done = !!map[id];
      return `<li class="checkable${done ? ' done' : ''}" data-id="${id}" role="checkbox" aria-checked="${done ? 'true' : 'false'}" tabindex="0">
        <span class="check" aria-hidden="true"><svg viewBox="0 0 12 12"><polyline points="2,6 5,9 10,3"/></svg></span>
        <span class="check-text">${text}</span>
      </li>`;
    }).join('');
    updateProgress(map);
  }

  if (tabs && panel && ACTIONS) {
    const first = tabs.querySelector('.tab.active') || tabs.querySelector('.tab');
    if (first) showAction(first.dataset.key);
    tabs.addEventListener('click', e => {
      const b = e.target.closest('.tab');
      if (b) showAction(b.dataset.key);
    });
    panel.addEventListener('click', e => {
      const li = e.target.closest('li.checkable');
      if (!li) return;
      const map = loadChecks();
      const id = li.dataset.id;
      map[id] = !map[id];
      if (!map[id]) delete map[id];
      saveChecks(map);
      li.classList.toggle('done', !!map[id]);
      li.setAttribute('aria-checked', map[id] ? 'true' : 'false');
      updateProgress(map);
    });
    panel.addEventListener('keydown', e => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const li = e.target.closest('li.checkable');
      if (!li) return;
      e.preventDefault();
      li.click();
    });
  }

  function setNavOpen(open) {
    const toggle = document.getElementById('navToggle');
    const nav = document.getElementById('nav');
    const backdrop = document.getElementById('navBackdrop');
    if (!toggle || !nav) return;
    nav.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.setAttribute('aria-label', open ? '关闭菜单' : '打开菜单');
    if (backdrop) {
      if (open) backdrop.removeAttribute('hidden');
      else backdrop.setAttribute('hidden', '');
    }
  }

  const toggle = document.getElementById('navToggle');
  const nav = document.getElementById('nav');
  const backdrop = document.getElementById('navBackdrop');
  if (toggle && nav) {
    toggle.addEventListener('click', () => setNavOpen(!nav.classList.contains('open')));
    nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setNavOpen(false)));
    if (backdrop) backdrop.addEventListener('click', () => setNavOpen(false));
  }

  // reveal: only after paint, and never hide forever
  requestAnimationFrame(() => {
    const els = document.querySelectorAll('.concl, .fail, .hot, .read, .section-head, .limit-card, .stat, .screener, .scr-q, .lex-card, .mirror-card, .mirror-lesson, .week-inner, .fp-inner');
    els.forEach(el => el.classList.add('reveal'));
    if (!('IntersectionObserver' in window)) {
      els.forEach(el => el.classList.add('in'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('in'); });
    }, { threshold: 0.08, rootMargin: '0px 0px -20px 0px' });
    els.forEach(el => io.observe(el));
    setTimeout(() => els.forEach(el => el.classList.add('in')), 1200);
  });

  const search = document.getElementById('siteSearch');
  const hitsEl = document.getElementById('searchHits');
  if (search) {
    function applySearch(q) {
      q = (q || '').trim().toLowerCase();
      let hit = 0, total = 0;
      ['.concl', '.fail', '.hot', '.read', '.lex-card', '.mirror-card', '.mirror-lesson'].forEach(s => {
        document.querySelectorAll(s).forEach(el => {
          total += 1;
          const ok = !q || el.textContent.toLowerCase().includes(q);
          el.classList.toggle('is-dim', !ok);
          if (ok) hit += 1;
        });
      });
      if (hitsEl) {
        if (!q) {
          hitsEl.hidden = true;
          hitsEl.textContent = '';
        } else {
          hitsEl.hidden = false;
          hitsEl.textContent = hit ? `${hit}/${total}` : '无结果';
        }
      }
    }
    search.addEventListener('input', e => applySearch(e.target.value));
    window.addEventListener('keydown', e => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        search.focus();
        search.select();
      }
      if (e.key === 'Escape' && document.activeElement === search) {
        search.value = '';
        applySearch('');
        search.blur();
      }
    });
  }

  const bar = document.getElementById('progress');
  const ticksEl = document.getElementById('progressTicks');
  const TICK_SECS = [
    { id: 'weekBoard', lab: '周' },
    { id: 'screener', lab: '筛' },
    { id: 'conclusions', lab: '结' },
    { id: 'failures', lab: '败' },
    { id: 'mirror', lab: '照' },
    { id: 'lexicon', lab: '典' },
    { id: 'hot', lab: '热' },
    { id: 'actions', lab: '单' },
    { id: 'premortem', lab: '检' },
    { id: 'reads', lab: '读' }
  ];
  function layoutProgressTicks() {
    if (!ticksEl) return;
    const h = document.documentElement;
    const max = Math.max(1, h.scrollHeight - h.clientHeight);
    ticksEl.innerHTML = TICK_SECS.map(s => {
      const el = document.getElementById(s.id);
      if (!el) return '';
      const top = el.getBoundingClientRect().top + window.scrollY;
      const pct = Math.min(98, Math.max(2, (top / (h.scrollHeight || 1)) * 100));
      return `<span class="progress-tick" data-id="${s.id}" data-lab="${s.lab}" style="left:${pct}%"></span>`;
    }).join('');
  }
  function paintProgress() {
    if (!bar) return;
    const h = document.documentElement;
    const max = h.scrollHeight - h.clientHeight;
    const pct = (max > 0 ? h.scrollTop / max : 0) * 100;
    bar.style.width = pct + '%';
    if (ticksEl) {
      const y = window.scrollY + 110;
      ticksEl.querySelectorAll('.progress-tick').forEach(t => {
        const el = document.getElementById(t.getAttribute('data-id'));
        t.classList.toggle('is-active', !!(el && el.offsetTop <= y));
      });
    }
  }
  if (bar || ticksEl) {
    layoutProgressTicks();
    paintProgress();
    window.addEventListener('scroll', paintProgress, { passive: true });
    window.addEventListener('resize', () => { layoutProgressTicks(); paintProgress(); }, { passive: true });
    setTimeout(() => { layoutProgressTicks(); paintProgress(); }, 400);
  }

  function sectionSpy() {
    const links = [...document.querySelectorAll('.nav a[href^="#"]')];
    const rail = [...document.querySelectorAll('.toc-rail a[data-sec]')];
    const map = links.map(a => {
      const id = a.getAttribute('href').slice(1);
      return { a, el: document.getElementById(id) };
    }).filter(x => x.el);
    const onScroll = () => {
      let cur = null;
      const y = window.scrollY + 96;
      map.forEach(({ a, el }) => {
        if (el.offsetTop <= y) cur = a;
      });
      links.forEach(a => a.removeAttribute('aria-current'));
      rail.forEach(a => a.removeAttribute('aria-current'));
      if (cur) {
        cur.setAttribute('aria-current', 'true');
        const id = cur.getAttribute('href').slice(1);
        const r = rail.find(a => a.dataset.sec === id);
        if (r) r.setAttribute('aria-current', 'true');
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }
  sectionSpy();

  const toTop = document.getElementById('toTop');
  if (toTop) {
    window.addEventListener('scroll', () => {
      toTop.classList.toggle('show', window.scrollY > 480);
    }, { passive: true });
    toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  // v8: conclusion chips → case library search
  document.querySelectorAll('.concl .chip').forEach(chip => {
    const name = (chip.textContent || '').trim();
    if (!name) return;
    chip.setAttribute('role', 'link');
    chip.tabIndex = 0;
    chip.title = `在案例库搜「${name}」`;
    const go = () => { location.href = `cases.html?q=${encodeURIComponent(name)}`; };
    chip.addEventListener('click', go);
    chip.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); }
    });
  });

  // v8: 今日一案
  const dailyBody = document.getElementById('dailyBody');
  const reshuffle = document.getElementById('dailyReshuffle');
  const DAY_KEY = 'startup-guide-daily-v1';

  function daySeed() {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
  }
  function pickCase(list, forceRandom) {
    if (!list.length) return null;
    if (forceRandom) return list[Math.floor(Math.random() * list.length)];
    try {
      const saved = JSON.parse(localStorage.getItem(DAY_KEY) || 'null');
      if (saved && saved.day === daySeed() && saved.name) {
        const hit = list.find(c => c.name === saved.name);
        if (hit) return hit;
      }
    } catch (e) {}
    // stable pick by date
    let h = 0;
    const s = daySeed();
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    const c = list[h % list.length];
    try { localStorage.setItem(DAY_KEY, JSON.stringify({ day: daySeed(), name: c.name })); } catch (e) {}
    return c;
  }
  function badgeCls(o) {
    if (/成功|Success|pivot|进行中/i.test(o || '')) return 'ok';
    if (/失败|Fail|关|崩|解散|清算|退|Wind|Sunset|Closing|exit/i.test(o || '')) return 'bad';
    return 'mid';
  }
  function esc(s) {
    return String(s || '').replace(/[&<>"']/g, m => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    })[m]);
  }
  function renderDaily(c) {
    if (!dailyBody || !c) return;
    dailyBody.innerHTML = `
      <h3>${esc(c.name)}</h3>
      <div class="daily-meta">
        <span>${esc(c.region || '')}</span>
        <span class="${badgeCls(c.outcome)}">${esc(c.outcome || '')}</span>
        <span>${esc(c.sector || '')}</span>
      </div>
      <p>${esc(c.who ? c.who + ' · ' : '')}点进案例库可筛选同赛道更多样本。</p>
      <a class="daily-link" href="cases.html?q=${encodeURIComponent(c.name)}">在案例库打开</a>
    `;
  }
  function loadDaily(forceRandom) {
    if (!dailyBody) return;
    const stage = document.getElementById('dailyStage');
    const apply = (c) => {
      if (forceRandom && c) {
        try { localStorage.setItem(DAY_KEY, JSON.stringify({ day: daySeed(), name: c.name })); } catch (e) {}
      }
      renderDaily(c);
    };
    const fetchPick = () => fetch('data/cases.json')
      .then(r => r.json())
      .then(data => {
        const list = data.cases || [];
        return pickCase(list, forceRandom);
      });

    if (forceRandom && stage && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      stage.classList.add('is-flipping');
      const mid = setTimeout(() => {
        fetchPick()
          .then(c => {
            apply(c);
            requestAnimationFrame(() => stage.classList.remove('is-flipping'));
          })
          .catch(() => {
            dailyBody.innerHTML = '<p class="daily-loading">今日一案暂不可用</p>';
            stage.classList.remove('is-flipping');
          });
      }, 220);
      void mid;
      return;
    }

    fetchPick()
      .then(apply)
      .catch(() => {
        dailyBody.innerHTML = '<p class="daily-loading">今日一案暂不可用</p>';
      });
  }
  loadDaily(false);
  if (reshuffle) reshuffle.addEventListener('click', () => loadDaily(true));



  // v9: estimated reading time
  (function readTime() {
    const el = document.getElementById('readTime');
    if (!el) return;
    const main = document.querySelector('main');
    if (!main) return;
    const text = main.innerText || '';
    const chars = text.replace(/\s+/g, '').length;
    // Chinese ~400 chars/min reading pace for dense editorial
    const mins = Math.max(4, Math.min(20, Math.round(chars / 400)));
    el.textContent = `约 ${mins} 分钟读完本页 · ${chars.toLocaleString('zh-CN')} 字`;
  })();

  // v9: copy section deep links
  (function sectionCopy() {
    document.querySelectorAll('main section.section[id]').forEach(sec => {
      const head = sec.querySelector('.section-head');
      if (!head || head.querySelector('.copy-link')) return;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'copy-link';
      btn.textContent = '复制链接';
      btn.setAttribute('aria-label', '复制本节链接');
      btn.addEventListener('click', async () => {
        const url = `${location.origin}${location.pathname}#${sec.id}`;
        try {
          await navigator.clipboard.writeText(url);
          btn.textContent = '已复制';
          btn.classList.add('ok');
          if (window.__sgToast) window.__sgToast('已复制本节链接');
          setTimeout(() => { btn.textContent = '复制链接'; btn.classList.remove('ok'); }, 1400);
        } catch (e) {
          btn.textContent = '失败';
          setTimeout(() => { btn.textContent = '复制链接'; }, 1400);
        }
      });
      head.appendChild(btn);
    });
  })();



  // v10: archive pulse + fail/hot jumps + shortcuts
  (function archivePulse() {
    const bars = document.getElementById('pulseBars');
    const legend = document.getElementById('pulseLegend');
    const sub = document.getElementById('pulseSub');
    if (!bars) return;

    function classify(o) {
      o = o || '';
      if (/成功|Success|pivot|进行中/i.test(o)) return 'ok';
      if (/失败|Fail|关|崩|解散|清算|退|Wind|Sunset|Closing|exit|Killed|Liquidation|farewell/i.test(o)) return 'bad';
      return 'mid';
    }
    function go(kind) {
      const map = { ok: '成功', bad: '失败', mid: '' };
      const outcome = map[kind] || '';
      const url = outcome ? `cases.html?outcome=${encodeURIComponent(outcome)}` : 'cases.html';
      location.href = url;
    }
    function paint(list) {
      let ok = 0, bad = 0, mid = 0;
      list.forEach(c => {
        const k = classify(c.outcome);
        if (k === 'ok') ok += 1;
        else if (k === 'bad') bad += 1;
        else mid += 1;
      });
      const total = Math.max(1, ok + bad + mid);
      const parts = [
        { k: 'ok', n: ok, label: '偏成功' },
        { k: 'bad', n: bad, label: '偏失败/关停' },
        { k: 'mid', n: mid, label: '进行中/其他' }
      ];
      bars.innerHTML = parts.map(p => {
        const pct = (p.n / total * 100);
        return `<button type="button" class="pulse-seg ${p.k}" style="width:${pct}%" data-kind="${p.k}" title="${p.label} ${p.n}（${pct.toFixed(0)}%）" aria-label="${p.label} ${p.n} 条"></button>`;
      }).join('');
      if (legend) {
        legend.innerHTML = parts.map(p =>
          `<button type="button" data-kind="${p.k}"><span class="pulse-dot ${p.k}" aria-hidden="true"></span>${p.label} ${p.n}</button>`
        ).join('');
      }
      if (sub) sub.textContent = `案例库 ${list.length} 条 · 偏失败/关停约占 ${Math.round(bad/total*100)}% · 点色块筛选`;
      const click = e => {
        const b = e.target.closest('[data-kind]');
        if (b) go(b.dataset.kind);
      };
      bars.addEventListener('click', click);
      if (legend) legend.addEventListener('click', click);
    }
    fetch('data/cases.json')
      .then(r => r.json())
      .then(d => paint(d.cases || []))
      .catch(() => {
        bars.innerHTML = '';
        if (sub) sub.textContent = '档案速览暂不可用';
      });
  })();

  (function jumpCards() {
    function bind(sel) {
      document.querySelectorAll(sel).forEach(el => {
        const q = el.getAttribute('data-jump');
        if (!q) return;
        const go = () => { location.href = `cases.html?q=${encodeURIComponent(q)}`; };
        el.addEventListener('click', go);
        el.addEventListener('keydown', e => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); }
        });
      });
    }
    bind('.fail[data-jump]');
    bind('.hot[data-jump]');
  })();

  (function shortcuts() {
    const modal = document.getElementById('keysModal');
    const backdrop = document.getElementById('keysBackdrop');
    const closeBtn = document.getElementById('keysClose');
    if (!modal) return;
    let chord = null;
    let chordTimer = null;

    function open() {
      modal.hidden = false;
      if (backdrop) backdrop.hidden = false;
      document.body.style.overflow = 'hidden';
      if (closeBtn) closeBtn.focus();
    }
    function close() {
      modal.hidden = true;
      if (backdrop) backdrop.hidden = true;
      if (!document.getElementById('caseDrawer')?.classList.contains('open')) {
        document.body.style.overflow = '';
      }
    }
    function isTyping() {
      const t = document.activeElement;
      if (!t) return false;
      const tag = (t.tagName || '').toLowerCase();
      return tag === 'input' || tag === 'textarea' || tag === 'select' || t.isContentEditable;
    }
    if (closeBtn) closeBtn.addEventListener('click', close);
    if (backdrop) backdrop.addEventListener('click', close);

    window.addEventListener('keydown', e => {
      if (e.key === 'Escape' && !modal.hidden) {
        e.preventDefault();
        close();
        return;
      }
      if (isTyping()) return;
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        if (modal.hidden) open(); else close();
        return;
      }
      const k = e.key.toLowerCase();
      if (k === 'g' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        chord = 'g';
        clearTimeout(chordTimer);
        chordTimer = setTimeout(() => { chord = null; }, 800);
        return;
      }
      if (chord === 'g') {
        chord = null;
        clearTimeout(chordTimer);
        if (k === 'c') { e.preventDefault(); location.href = 'cases.html'; }
        else if (k === 'h') { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
        else if (k === 's') {
          e.preventDefault();
          const el = document.getElementById('screener');
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        else if (k === 'p') {
          e.preventDefault();
          const el = document.getElementById('premortem');
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            const first = document.getElementById('pmPolicy');
            if (first) setTimeout(() => first.focus(), 350);
          }
        }
        else if (k === 'l') {
          e.preventDefault();
          const el = document.getElementById('lexicon');
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            const inp = document.getElementById('lexFilter');
            if (inp) setTimeout(() => inp.focus(), 350);
          }
        }
        else if (k === 'm') {
          e.preventDefault();
          const el = document.getElementById('mirror');
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            const btn = document.getElementById('mirrorNext');
            if (btn) setTimeout(() => btn.focus(), 350);
          }
        }
        else if (k === 'n') {
          e.preventDefault();
          const el = document.getElementById('fieldProgress');
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            const first = el.querySelector('.fp-card');
            if (first) setTimeout(() => first.focus(), 350);
          }
        }
        else if (k === 'w') {
          e.preventDefault();
          const el = document.getElementById('weekBoard');
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            const btn = document.getElementById('weekPick');
            if (btn) setTimeout(() => btn.focus(), 350);
          }
        }
        else if (k === 'o') {
          e.preventDefault();
          if (window.__sgOpenOnePager) window.__sgOpenOnePager();
        }
      }
    });
  })();



  // v11: toast + reading comfort + checklist export
  function toast(msg) {
    const host = document.getElementById('toastHost');
    if (!host) return;
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = msg;
    host.appendChild(el);
    setTimeout(() => {
      el.classList.add('out');
      setTimeout(() => el.remove(), 260);
    }, 1800);
  }
  window.__sgToast = toast;

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
      toast(dir > 0 ? `字号 ${Math.round(state.scale * 100)}%` : `字号 ${Math.round(state.scale * 100)}%`);
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

  (function exportChecks() {
    const btn = document.getElementById('exportChecks');
    if (!btn || !ACTIONS) return;
    btn.addEventListener('click', () => {
      const map = loadChecks();
      const lines = ['# 行动清单（本机勾选）', ''];
      let any = false;
      Object.keys(ACTIONS).forEach(key => {
        const items = ACTIONS[key] || [];
        const done = [];
        items.forEach((text, i) => {
          if (map[`${key}::${i}`]) done.push(`- [x] ${text}`);
        });
        if (done.length) {
          any = true;
          lines.push(`## ${key}`, ...done, '');
        }
      });
      if (!any) {
        toast('还没有勾选项');
        return;
      }
      const md = lines.join('\n');
      const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'startup-checklist.md';
      a.click();
      URL.revokeObjectURL(a.href);
      toast('已导出勾选清单');
    });
  })();




  // v13: continue reading + reads checklist
  (function resumeReading() {
    const KEY = 'startup-guide-resume-v1';
    const SECTIONS = [
      { id: 'weekBoard', label: '本周三事' },
      { id: 'conclusions', label: '结论' },
      { id: 'failures', label: '失败地图' },
      { id: 'mirror', label: '成败对照' },
      { id: 'lexicon', label: '死法词典' },
      { id: 'hot', label: '热点' },
      { id: 'actions', label: '行动清单' },
      { id: 'premortem', label: 'Premortem' },
      { id: 'reads', label: '必读' }
    ];
    const bar = document.getElementById('resumeBar');
    const go = document.getElementById('resumeGo');
    const labelEl = document.getElementById('resumeLabel');
    const dismiss = document.getElementById('resumeDismiss');
    if (!bar || !go) return;

    function load() {
      try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { return null; }
    }
    function save(state) {
      try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
    }

    let dismissed = false;
    const saved = load();
    if (saved && saved.id && !location.hash) {
      const hit = SECTIONS.find(s => s.id === saved.id);
      if (hit && (saved.y || 0) > 280) {
        if (labelEl) labelEl.textContent = hit.label;
        bar.hidden = false;
      }
    }

    go.addEventListener('click', () => {
      const cur = load();
      const id = (cur && cur.id) || 'conclusions';
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      bar.hidden = true;
      dismissed = true;
    });
    if (dismiss) dismiss.addEventListener('click', () => {
      bar.hidden = true;
      dismissed = true;
    });

    let tick = null;
    function remember() {
      if (dismissed) return;
      const y = window.scrollY || 0;
      let current = SECTIONS[0];
      for (const s of SECTIONS) {
        const el = document.getElementById(s.id);
        if (!el) continue;
        const top = el.getBoundingClientRect().top;
        if (top <= 140) current = s;
      }
      save({ id: current.id, y, t: Date.now() });
      if (y > 420 && !bar.hidden) {
        // hide after user scrolls away from top resume offer
        if (y > (saved && saved.y ? saved.y + 80 : 99999)) bar.hidden = true;
      }
    }
    window.addEventListener('scroll', () => {
      clearTimeout(tick);
      tick = setTimeout(remember, 180);
    }, { passive: true });
    // hide resume once user scrolls a bit
    window.addEventListener('scroll', () => {
      if (!bar.hidden && (window.scrollY || 0) > 120) {
        // keep visible until they click or scroll deep past saved point
      }
    }, { passive: true });
  })();

  (function readsChecklist() {
    const KEY = 'startup-guide-reads-v1';
    const list = document.getElementById('readsList');
    const progress = document.getElementById('readsProgress');
    if (!list) return;
    function load() {
      try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { return []; }
    }
    function save(arr) {
      try { localStorage.setItem(KEY, JSON.stringify(arr)); } catch (e) {}
    }
    const done = new Set(load());
    const cards = [...list.querySelectorAll('a.read')];
    function syncProgress() {
      if (progress) progress.textContent = `已读 ${done.size} / ${cards.length}`;
    }
    cards.forEach((a, i) => {
      const id = a.getAttribute('href') || String(i);
      a.dataset.readId = id;
      if (done.has(id)) a.classList.add('is-read');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'read-mark';
      btn.setAttribute('aria-label', done.has(id) ? '取消已读' : '标记已读');
      btn.setAttribute('aria-pressed', done.has(id) ? 'true' : 'false');
      btn.textContent = done.has(id) ? '✓' : '○';
      btn.title = '本机标记已读';
      a.style.position = a.style.position || 'relative';
      a.appendChild(btn);
      btn.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        if (done.has(id)) {
          done.delete(id);
          a.classList.remove('is-read');
          btn.textContent = '○';
          btn.setAttribute('aria-pressed', 'false');
          btn.setAttribute('aria-label', '标记已读');
          if (window.__sgToast) window.__sgToast('已取消标记');
        } else {
          done.add(id);
          a.classList.add('is-read');
          btn.textContent = '✓';
          btn.setAttribute('aria-pressed', 'true');
          btn.setAttribute('aria-label', '取消已读');
          if (window.__sgToast) window.__sgToast('已标记已读');
        }
        save([...done]);
        syncProgress();
      });
    });
    syncProgress();
  })();



  // v14: accent theme + focus mode + fresh strip
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
        e.preventDefault();
        toggleFocus();
      }
    });
  })();

  (function freshStrip() {
    const track = document.getElementById('freshTrack');
    if (!track) return;
    track.innerHTML = Array.from({ length: 5 }, () => '<div class="fresh-skel" aria-hidden="true"></div>').join('');

    function pillCls(o) {
      if (/成功|Success|pivot|进行中|重整成功/i.test(o || '')) return 'ok';
      if (/失败|Fail|关|崩|解散|清算|退场|尸检|Wind|Sunset|Killed|Closing|Liquidation|exit|Shut/i.test(o || '')) return 'bad';
      return 'mid';
    }
    function esc(s) {
      return String(s || '').replace(/[&<>"']/g, m => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
      })[m]);
    }

    fetch('data/cases.json')
      .then(r => r.json())
      .then(data => {
        const list = (data.cases || []).slice(-10).reverse();
        track.innerHTML = list.map(c => {
          const q = encodeURIComponent(c.name);
          const pill = pillCls(c.outcome);
          return `<a class="fresh-card" href="cases.html?q=${q}">
            <span class="pill ${pill}">${esc(c.region || '')}</span>
            <span class="fresh-name">${esc(c.name)}</span>
            <span class="fresh-meta">${esc(c.sector || '')}</span>
            <span class="fresh-out">${esc(c.outcome || '')}</span>
          </a>`;
        }).join('');
      })
      .catch(() => {
        track.innerHTML = '<p class="fresh-meta">新入库加载失败，稍后再试</p>';
      });
  })();




  // v15: Premortem board + G then P
  (function premortemBoard() {
    const fields = [
      { id: 'pmPolicy', key: 'policy', label: '政策 / 补贴' },
      { id: 'pmCac', key: 'cac', label: 'CAC / 获客' },
      { id: 'pmCompliance', key: 'compliance', label: '合规 / 交付' },
      { id: 'pmExit', key: 'exit', label: '退款 / 退出' },
    ];
    const KEY = 'startup-guide-premortem-v1';
    const board = document.getElementById('premortemBoard');
    if (!board) return;

    function load() {
      try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; }
      catch (e) { return {}; }
    }
    function save(state) {
      try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
    }
    const state = load();
    fields.forEach(f => {
      const el = document.getElementById(f.id);
      if (!el) return;
      if (state[f.key]) el.value = state[f.key];
      el.addEventListener('input', () => {
        state[f.key] = el.value;
        save(state);
        const hint = document.getElementById('pmHint');
        if (hint) hint.textContent = '已自动保存到本机';
      });
    });

    const copyBtn = document.getElementById('pmCopy');
    if (copyBtn) {
      copyBtn.addEventListener('click', async () => {
        const lines = ['# Premortem 速写', ''];
        fields.forEach(f => {
          const el = document.getElementById(f.id);
          const v = (el && el.value || '').trim() || '（未写）';
          lines.push(`## ${f.label}`, v, '');
        });
        const md = lines.join('\n');
        try {
          await navigator.clipboard.writeText(md);
          if (window.__sgToast) window.__sgToast('Premortem 已复制');
          const hint = document.getElementById('pmHint');
          if (hint) hint.textContent = '已复制 Markdown';
        } catch (e) {
          if (window.__sgToast) window.__sgToast('复制失败，请手动选中');
        }
      });
    }

    const clearBtn = document.getElementById('pmClear');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        fields.forEach(f => {
          const el = document.getElementById(f.id);
          if (el) el.value = '';
          delete state[f.key];
        });
        save(state);
        if (window.__sgToast) window.__sgToast('Premortem 已清空');
        const hint = document.getElementById('pmHint');
        if (hint) hint.textContent = '本机稿已清空';
      });
    }
  })();




  // v16: 立项快筛
  (function screener() {
    const board = document.getElementById('screenerBoard');
    const qsEl = document.getElementById('scrQs');
    const resultEl = document.getElementById('scrResult');
    const progressEl = document.getElementById('scrProgress');
    const resetBtn = document.getElementById('scrReset');
    if (!board || !qsEl) return;

    const KEY = 'startup-guide-screener-v1';
    const QUESTIONS = [
      {
        id: 'pay',
        q: '有没有人已经反复付钱？',
        why: '陈述偏好很甜；没闭环就别扩团队。',
        opts: [
          { id: 'yes', label: '有，至少 3 人付过两次', risk: 0 },
          { id: 'once', label: '只有问卷/点赞/试用', risk: 2 },
          { id: 'na', label: '还没测', risk: 1 }
        ],
        cases: ['抱抱窝', 'Lemon', 'Centeni']
      },
      {
        id: 'cac',
        q: '获客主要靠什么？',
        why: '履约打平也救不了——尤其关系租自平台。',
        opts: [
          { id: 'organic', label: '熟场景口碑 / 自有渠道', risk: 0 },
          { id: 'ads', label: '单一平台广告或补贴', risk: 2 },
          { id: 'mix', label: '混合，但没算清 CAC', risk: 1 }
        ],
        cases: ['Klydo', '探鹿', 'Dashdot']
      },
      {
        id: 'halo',
        q: '你现在拿什么当主证据？',
        why: '适航、金奖、融资叙事 ≠ 客户与现金流。',
        opts: [
          { id: 'cash', label: '复购 / 预付 / 合同', risk: 0 },
          { id: 'prize', label: '奖杯 / 适航 /「融资顺利」', risk: 2 },
          { id: 'demo', label: 'Demo 能跑 / 媒体曝光', risk: 1 }
        ],
        cases: ['后会友期', '亿航', '毫末智行']
      },
      {
        id: 'runway',
        q: '现金与融资结构怎样？',
        why: '叙事领先现金几个月时，往往突然停工。',
        opts: [
          { id: 'ok', label: '有止损日，且不靠单一 LP', risk: 0 },
          { id: 'single', label: '单一天使/大股东输血', risk: 2 },
          { id: 'hope', label: '还没写止损日', risk: 1 }
        ],
        cases: ['景恩', '极越', 'Snaphunt']
      },
      {
        id: 'exit',
        q: '退出与退款路径写了吗？',
        why: '体面退出是能力；硬撑通常更贵。',
        opts: [
          { id: 'yes', label: '有时间表 + 退款/对员工口径', risk: 0 },
          { id: 'no', label: '没有，先做起来再说', risk: 2 },
          { id: 'draft', label: '想过，还没落笔', risk: 1 }
        ],
        cases: ['Yupp', '森合', 'Warikoo']
      }
    ];

    function load() {
      try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; }
      catch (e) { return {}; }
    }
    function save(state) {
      try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
    }

    function paint() {
      const state = load();
      qsEl.innerHTML = QUESTIONS.map((item, idx) => {
        const chosen = state[item.id];
        const opts = item.opts.map(o => {
          const pressed = chosen === o.id ? 'true' : 'false';
          return `<button type="button" class="scr-opt" data-qid="${item.id}" data-oid="${o.id}" aria-pressed="${pressed}">${o.label}</button>`;
        }).join('');
        return `<li class="scr-q${chosen ? ' is-done' : ''} reveal in" data-qid="${item.id}">
          <h3><span class="scr-num">${String(idx + 1).padStart(2, '0')}</span> ${item.q}</h3>
          <p class="scr-why">${item.why}</p>
          <div class="scr-opts" role="group" aria-label="${item.q}">${opts}</div>
        </li>`;
      }).join('');

      const answered = QUESTIONS.filter(q => state[q.id]).length;
      const pct = Math.round((answered / QUESTIONS.length) * 100);
      if (progressEl) {
        const bar = progressEl.querySelector('i');
        if (bar) bar.style.width = pct + '%';
        progressEl.setAttribute('aria-valuenow', String(pct));
      }

      if (answered === QUESTIONS.length) showResult(state);
      else if (resultEl) {
        resultEl.hidden = true;
        resultEl.innerHTML = '';
      }
    }

    function showResult(state) {
      if (!resultEl) return;
      let risk = 0;
      const hits = [];
      QUESTIONS.forEach(q => {
        const opt = q.opts.find(o => o.id === state[q.id]);
        if (!opt) return;
        risk += opt.risk;
        if (opt.risk >= 1) hits.push(...q.cases.slice(0, 2));
      });
      const uniq = [...new Set(hits)].slice(0, 6);
      let band, verdict, tips;
      if (risk <= 2) {
        band = '低风险';
        verdict = '可以小步继续验证，别提前扩团队。';
        tips = [
          '把「反复付钱」样本再压实一轮',
          '顺手写完 Premortem 四行',
          '对照成功结构：熟悉场景 + 不可规模化早期动作'
        ];
      } else if (risk <= 5) {
        band = '中风险';
        verdict = '先补验证，再谈融资与扩编。';
        tips = [
          '做付费/预付实验，禁止只用问卷',
          '算清真实 CAC，别把平台关系当资产',
          '奖杯与「融资顺利」降级为彩蛋'
        ];
      } else {
        band = '高风险';
        verdict = '建议先停扩：档案里同类死法很密。';
        tips = [
          '停掉未验证渠道上的烧钱',
          '写止损日与退款路径，再决定是否继续',
          '若已融资叙事领先现金——按关停四件套预案演练'
        ];
      }
      resultEl.hidden = false;
      resultEl.innerHTML = `
        <div class="scr-score"><b>${risk}/10</b><span>${band} · 分数越高越像档案里的关停路径</span></div>
        <p class="scr-verdict">${verdict}</p>
        <ul class="scr-tips">${tips.map(t => `<li>${t}</li>`).join('')}</ul>
        <div class="scr-cases">${uniq.map(n =>
          `<a href="cases.html?q=${encodeURIComponent(n)}">${n}</a>`
        ).join('')}</div>
      `;
      if (window.__sgToast) window.__sgToast(`立项快筛：${band}（${risk}/10）`);
    }

    qsEl.addEventListener('click', e => {
      const btn = e.target.closest('.scr-opt');
      if (!btn) return;
      const state = load();
      state[btn.dataset.qid] = btn.dataset.oid;
      save(state);
      paint();
    });

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        save({});
        paint();
        if (window.__sgToast) window.__sgToast('快筛已重置');
        board.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }

    paint();
  })();


  // v17: 死法词典
  (function lexicon() {
    const grid = document.getElementById('lexGrid');
    if (!grid) return;
    const filterEl = document.getElementById('lexFilter');
    const knownBtn = document.getElementById('lexKnownOnly');
    const countEl = document.getElementById('lexCount');
    const KEY = 'startup-guide-lex-known-v1';

    const ENTRIES = [
      {
        id: 'survey',
        code: 'L01',
        title: '问卷幻觉',
        symptom: '调研很好看，点赞一堆，没人反复付钱。',
        autopsy: '陈述偏好被当成需求；扩团队发生在付费闭环之前。',
        antidote: '至少 3 人付过两次再谈编制；问卷只能当线索。',
        cases: ['抱抱窝', 'Lemon', 'Centeni']
      },
      {
        id: 'narrative',
        code: 'L02',
        title: '叙事超车',
        symptom: '内部信还在写「融资顺利」，现金表已经见底。',
        autopsy: '承诺被当成到账；叙事领先现金几个月时最危险。',
        antidote: '到账才算结束；写止损日；拒绝单一 LP 输血叙事。',
        cases: ['毫末智行', '景恩', '极越', 'Snaphunt']
      },
      {
        id: 'cac',
        code: 'L03',
        title: 'CAC 地板',
        symptom: '履约打平了，一买量就亏；关系租自平台。',
        autopsy: '单位经济只算了履约，没算真实获客地板与涨价风险。',
        antidote: '先算含广告/补贴的全成本 CAC；熟场景口碑优先。',
        cases: ['Klydo', '探鹿', 'Dashdot', 'Qtrove']
      },
      {
        id: 'halo',
        code: 'L04',
        title: '光环替代',
        symptom: '适航、金奖、媒体通稿成了主证据。',
        autopsy: '能飞/能拿奖 ≠ 客户与现金流；评审加权概念项目。',
        antidote: '奖杯降级为彩蛋；主表只留复购、预付、合同。',
        cases: ['后会友期', '亿航', 'Guardian eVTOL', '大创赛落地~8.5%']
      },
      {
        id: 'paradigm',
        code: 'L05',
        title: '范式杀',
        symptom: '账上还有钱，赛道已经贬值或被免费碾压。',
        autopsy: '同质化 Wrapper、模型厂降维、范式迁移同时发生。',
        antidote: '垂直工作流 + 成本工程；Demo≠生产级护城河。',
        cases: ['妙鸭', 'Yupp', 'Stormy', '景恩']
      },
      {
        id: 'policy',
        code: 'L06',
        title: '政策 β',
        symptom: '安审、退坡、审计日一夜改写故事。',
        autopsy: '补贴/园区/空壳被写成确定收入；合规当事后补丁。',
        antidote: '补贴不进确定收入表；Premortem 先写政策行。',
        cases: ['Manus', '杭州补贴中介', 'OPC', 'ResumoFII']
      },
      {
        id: 'hardware',
        code: 'L07',
        title: '硬件鸿沟',
        symptom: '众筹/预购火了，交付、认证、售后把公司拖死。',
        autopsy: '把制造与合规复杂度当成软件迭代节奏来跑。',
        antidote: '众筹前写死退款；优先外围卖铲，别先扛整机。',
        cases: ['森合', 'K-Scale', 'Moxie', '雷柏/零度无人机']
      },
      {
        id: 'singlelp',
        code: 'L08',
        title: '股东断供',
        symptom: '大股东/单一天使一停输血，系统同时爆。',
        autopsy: '造血模型从未成立；员工、供应商、用户三角共振。',
        antidote: '勿单一 LP；顺风时反而小步验证到账节奏。',
        cases: ['极越', '毫末智行', '景恩', 'BionicHIVE']
      },
      {
        id: 'undercap',
        code: 'L09',
        title: '启动金悬崖',
        symptom: '产品被夸，租金与备货把现金流一次抽干。',
        autopsy: '固定成本从第一天就锁死；促销悬崖后无储备。',
        antidote: '把租金/备货当最大风险项；可延期开支优先于面子。',
        cases: ['Strait Grains', '后会友期', '十盛奶茶']
      },
      {
        id: 'exit',
        code: 'L10',
        title: '硬撑更贵',
        symptom: '明知该停，还在烧面子与人情。',
        autopsy: '没有止损日与退款路径；退出被视为失败而非能力。',
        antidote: '关停四件套：时间表·退款·导出·对员工口径。',
        cases: ['Yupp', 'Ula', 'Warikoo', 'Wahine Capital']
      }
    ];

    function loadKnown() {
      try {
        const arr = JSON.parse(localStorage.getItem(KEY) || '[]');
        return new Set(Array.isArray(arr) ? arr : []);
      } catch (e) { return new Set(); }
    }
    function saveKnown(set) {
      try { localStorage.setItem(KEY, JSON.stringify([...set])); } catch (e) {}
    }
    function esc(s) {
      return String(s || '').replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
      })[c]);
    }

    let knownOnly = false;
    let openId = null;

    function paint() {
      const known = loadKnown();
      const q = ((filterEl && filterEl.value) || '').trim().toLowerCase();
      let list = ENTRIES.filter(e => {
        if (knownOnly && !known.has(e.id)) return false;
        if (!q) return true;
        const blob = [e.title, e.symptom, e.autopsy, e.antidote, ...(e.cases || [])].join(' ').toLowerCase();
        return blob.includes(q);
      });
      if (countEl) {
        countEl.textContent = knownOnly
          ? `已识 ${known.size} · 展示 ${list.length}`
          : `${list.length} / ${ENTRIES.length} · 已识 ${known.size}`;
      }
      if (!list.length) {
        grid.innerHTML = '<p class="lex-empty">没有匹配的死法条目，换个词试试。</p>';
        return;
      }
      grid.innerHTML = list.map(e => {
        const isKnown = known.has(e.id);
        const isOpen = openId === e.id;
        const cases = (e.cases || []).map(n =>
          `<a href="cases.html?q=${encodeURIComponent(n)}">${esc(n)}</a>`
        ).join('');
        return `<article class="lex-card reveal in${isOpen ? ' is-open' : ''}${isKnown ? ' is-known' : ''}" role="listitem" data-id="${e.id}">
          <div class="lex-top">
            <span class="lex-code">${e.code}</span>
            <button type="button" class="lex-headbtn" aria-expanded="${isOpen ? 'true' : 'false'}" data-toggle="${e.id}">
              <h3 class="lex-title">${esc(e.title)}</h3>
              <p class="lex-sym">${esc(e.symptom)}</p>
            </button>
            <span class="lex-chev" aria-hidden="true">▾</span>
          </div>
          <div class="lex-body">
            <div class="lex-row"><span class="lex-lab">尸检</span><p>${esc(e.autopsy)}</p></div>
            <div class="lex-row"><span class="lex-lab">解药</span><p>${esc(e.antidote)}</p></div>
            <div class="lex-row"><span class="lex-lab">对照案例</span><div class="lex-cases">${cases}</div></div>
            <div class="lex-foot">
              <button type="button" class="lex-mark" data-mark="${e.id}" aria-pressed="${isKnown ? 'true' : 'false'}">${isKnown ? '取消已识' : '标为已识'}</button>
            </div>
          </div>
        </article>`;
      }).join('');
    }

    grid.addEventListener('click', e => {
      const toggle = e.target.closest('[data-toggle]');
      if (toggle) {
        const id = toggle.dataset.toggle;
        openId = openId === id ? null : id;
        paint();
        return;
      }
      const mark = e.target.closest('[data-mark]');
      if (mark) {
        const id = mark.dataset.mark;
        const known = loadKnown();
        if (known.has(id)) known.delete(id);
        else known.add(id);
        saveKnown(known);
        paint();
        if (window.__sgToast) {
          window.__sgToast(known.has(id) ? '已记入本机「已识」' : '已取消已识');
        }
      }
    });

    if (filterEl) {
      filterEl.addEventListener('input', () => paint());
    }
    if (knownBtn) {
      knownBtn.addEventListener('click', () => {
        knownOnly = !knownOnly;
        knownBtn.setAttribute('aria-pressed', knownOnly ? 'true' : 'false');
        knownBtn.textContent = knownOnly ? '看全部' : '只看已识';
        paint();
      });
    }

    paint();
  })();


  // v18: 成败对照台
  (function mirrorBench() {
    const stage = document.getElementById('mirrorStage');
    if (!stage) return;
    const prev = document.getElementById('mirrorPrev');
    const next = document.getElementById('mirrorNext');
    const dots = document.getElementById('mirrorDots');
    const idxEl = document.getElementById('mirrorIdx');
    const lesson = document.getElementById('mirrorLesson');
    const markBtn = document.getElementById('mirrorMark');
    const shuffleBtn = document.getElementById('mirrorShuffle');
    const KEY = 'startup-guide-mirror-known-v1';
    const IDX_KEY = 'startup-guide-mirror-idx-v1';

    const PAIRS = [
      {
        id: 'pay-loop',
        axis: '付费闭环',
        win: {
          name: '饿了么',
          why: '从最熟校园场景打穿，先有反复下单再扩城。',
          sector: '外卖 / 本地生活'
        },
        lose: {
          name: '抱抱窝',
          why: '孤独感叙事与问卷很好看，没人反复付钱仍扩团队。',
          sector: 'AI 社交'
        },
        lesson: '陈述偏好再甜，也不等于付费闭环。至少先看见「同一批人第二次付钱」。'
      },
      {
        id: 'unit-econ',
        axis: '单位经济',
        win: {
          name: '影石 Insta360',
          why: '筛赛道三标准清晰，硬件也先证明愿付溢价的人群。',
          sector: '消费硬件'
        },
        lose: {
          name: 'Klydo',
          why: '履约打平仍死在 Meta 租来的获客地板。',
          sector: '即时时尚'
        },
        lesson: '把含广告/补贴的真实 CAC 写进主表；平台一涨价，故事就要能站住。'
      },
      {
        id: 'cash-vs-story',
        axis: '现金 vs 叙事',
        win: {
          name: 'Stripe',
          why: '开发者真正在用、在付钱，融资叙事跟在现金后面。',
          sector: 'Fintech'
        },
        lose: {
          name: '景恩 AI 剪辑',
          why: '单一天使叙事领先现金；断供后三天关停。',
          sector: 'AI 工具'
        },
        lesson: '到账才算结束。拒绝单一 LP，并给自己写死止损日。'
      },
      {
        id: 'halo',
        axis: '光环 vs 订单',
        win: {
          name: '普渡机器人',
          why: '商服场景有真实履约与复购，奖杯不是主证据。',
          sector: '商用机器人'
        },
        lose: {
          name: 'Guardian Agriculture',
          why: 'FAA 授权与发明奖齐全，农场采购周期对不上 VC 时钟，付费客户近乎为零。',
          sector: '农用 eVTOL'
        },
        lesson: '能飞、能拿奖、能上通稿，都不自动变成合同与现金流。'
      },
      {
        id: 'paradigm',
        axis: '范式迁移',
        win: {
          name: 'Supabase',
          why: '深耕开发者工作流与成本结构，不只做一层薄 Wrapper。',
          sector: 'Devtools'
        },
        lose: {
          name: 'Yupp.ai',
          why: '账上还有钱，chatbot 评测层已被范式贬值。',
          sector: 'AI 评测'
        },
        lesson: 'Demo ≠ 护城河。垂直工作流 + 成本工程，才扛得住免费碾压。'
      },
      {
        id: 'exit',
        axis: '体面退出',
        win: {
          name: 'Ula',
          why: '仍有现金时主动清算，优先偿付与归还资本。',
          sector: 'SEA 零售基建'
        },
        lose: {
          name: '极越汽车',
          why: '股东输血一断，员工/供应商/用户三角同时爆。',
          sector: '智能电动车'
        },
        lesson: '退出是能力：时间表、退款、导出、对员工口径——关停四件套要预写。'
      },
      {
        id: 'hardware',
        axis: '硬件鸿沟',
        win: {
          name: '宇树科技',
          why: '从四足等可交付产品线推进，不把众筹当量产捷径。',
          sector: '机器人'
        },
        lose: {
          name: '森合创新 Oasa R1',
          why: '众筹火了之后，交付与售后把公司拖进解散。',
          sector: '消费机器人出海'
        },
        lesson: '众筹前写死退款与交付边界；优先外围卖铲，别先扛整机。'
      },
      {
        id: 'devtools-sunset',
        axis: '关停礼仪',
        win: {
          name: 'InstantDB',
          why: '关云有迁出窗口、退款规则与自托管指南，把用户善待写进日落。',
          sector: 'Devtools'
        },
        lose: {
          name: 'Banana.dev',
          why: '烧到身心见底才停；提醒创业不是无限透支身体的比赛。',
          sector: 'AI infra'
        },
        lesson: '关停信也是产品：时间表、退款、导出；同时把心理健康写进止损条件。'
      }
    ];

    // Note: Buffer may not be in cases.json as a case card; InstantDB is. Links still search cases.html.

    function loadKnown() {
      try {
        const arr = JSON.parse(localStorage.getItem(KEY) || '[]');
        return new Set(Array.isArray(arr) ? arr : []);
      } catch (e) { return new Set(); }
    }
    function saveKnown(set) {
      try { localStorage.setItem(KEY, JSON.stringify([...set])); } catch (e) {}
    }
    function esc(s) {
      return String(s || '').replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
      })[c]);
    }

    let i = 0;
    try {
      const saved = parseInt(localStorage.getItem(IDX_KEY) || '0', 10);
      if (!Number.isNaN(saved) && saved >= 0 && saved < PAIRS.length) i = saved;
    } catch (e) {}

    function paintDots() {
      if (!dots) return;
      const known = loadKnown();
      dots.innerHTML = PAIRS.map((p, n) =>
        `<button type="button" class="mirror-dot" role="tab" aria-selected="${n === i ? 'true' : 'false'}" aria-label="第 ${n + 1} 组${known.has(p.id) ? '（已悟）' : ''}" data-i="${n}"></button>`
      ).join('');
    }

    function cardHtml(side, kind) {
      const q = encodeURIComponent(side.name);
      return `<article class="mirror-card ${kind} reveal in">
        <span class="mirror-badge">${kind === 'win' ? '成 · 结构可抄' : '败 · 对照样本'}</span>
        <h3>${esc(side.name)}</h3>
        <p class="mirror-meta">${esc(side.sector || '')}</p>
        <p class="mirror-why">${esc(side.why)}</p>
        <a class="mirror-link" href="cases.html?q=${q}">在案例库查看 →</a>
      </article>`;
    }

    function paint() {
      const p = PAIRS[i];
      const known = loadKnown();
      stage.classList.remove('is-swap');
      void stage.offsetWidth;
      stage.classList.add('is-swap');
      stage.innerHTML = cardHtml(p.win, 'win')
        + `<div class="mirror-vs" aria-hidden="true">VS</div>`
        + cardHtml(p.lose, 'lose');
      if (lesson) {
        lesson.hidden = false;
        lesson.innerHTML = `<span class="mirror-axis">轴 · ${esc(p.axis)}</span><strong>教训</strong>${esc(p.lesson)}`;
      }
      if (idxEl) idxEl.textContent = `${i + 1} / ${PAIRS.length}`;
      if (markBtn) {
        const on = known.has(p.id);
        markBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
        markBtn.textContent = on ? '取消已悟' : '记入本机「已悟」';
      }
      paintDots();
      try { localStorage.setItem(IDX_KEY, String(i)); } catch (e) {}
    }

    function go(n) {
      i = (n + PAIRS.length) % PAIRS.length;
      paint();
    }

    if (prev) prev.addEventListener('click', () => go(i - 1));
    if (next) next.addEventListener('click', () => go(i + 1));
    if (dots) {
      dots.addEventListener('click', e => {
        const btn = e.target.closest('[data-i]');
        if (!btn) return;
        go(parseInt(btn.dataset.i, 10));
      });
    }
    if (markBtn) {
      markBtn.addEventListener('click', () => {
        const p = PAIRS[i];
        const known = loadKnown();
        if (known.has(p.id)) known.delete(p.id);
        else known.add(p.id);
        saveKnown(known);
        paint();
        if (window.__sgToast) {
          window.__sgToast(known.has(p.id) ? '已记入本机「已悟」' : '已取消已悟');
        }
      });
    }
    if (shuffleBtn) {
      shuffleBtn.addEventListener('click', () => {
        if (PAIRS.length < 2) return;
        let n = i;
        while (n === i) n = Math.floor(Math.random() * PAIRS.length);
        go(n);
      });
    }

    // optional ← → when mirror in view
    window.addEventListener('keydown', e => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = document.activeElement;
      const tag = (t && t.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || (t && t.isContentEditable)) return;
      const rect = document.getElementById('mirror');
      if (!rect) return;
      const r = rect.getBoundingClientRect();
      const inView = r.top < window.innerHeight * 0.7 && r.bottom > window.innerHeight * 0.2;
      if (!inView) return;
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(i - 1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); go(i + 1); }
    });

    paint();
  })();




  // v19: 本机田野进度
  (function fieldProgress() {
    const grid = document.getElementById('fpGrid');
    const foot = document.getElementById('fpFoot');
    if (!grid) return;

    const TRACKS = [
      {
        key: 'checks',
        lab: '行动清单',
        hint: '去勾选',
        href: '#actions',
        total: () => {
          if (!ACTIONS) return 0;
          return Object.values(ACTIONS).reduce((n, arr) => n + (arr || []).length, 0);
        },
        done: () => {
          try {
            const map = JSON.parse(localStorage.getItem('startup-guide-checks-v1') || '{}') || {};
            return Object.keys(map).filter(k => map[k]).length;
          } catch (e) { return 0; }
        }
      },
      {
        key: 'reads',
        lab: '必读一手',
        hint: '去标记',
        href: '#reads',
        total: () => document.querySelectorAll('#readsList a.read').length || 6,
        done: () => {
          try {
            const arr = JSON.parse(localStorage.getItem('startup-guide-reads-v1') || '[]');
            return Array.isArray(arr) ? arr.length : 0;
          } catch (e) { return 0; }
        }
      },
      {
        key: 'lex',
        lab: '死法词典',
        hint: '标已识',
        href: '#lexicon',
        total: () => 10,
        done: () => {
          try {
            const arr = JSON.parse(localStorage.getItem('startup-guide-lex-known-v1') || '[]');
            return Array.isArray(arr) ? arr.length : 0;
          } catch (e) { return 0; }
        }
      },
      {
        key: 'mirror',
        lab: '成败对照',
        hint: '记已悟',
        href: '#mirror',
        total: () => 8,
        done: () => {
          try {
            const arr = JSON.parse(localStorage.getItem('startup-guide-mirror-known-v1') || '[]');
            return Array.isArray(arr) ? arr.length : 0;
          } catch (e) { return 0; }
        }
      }
    ];

    function paint() {
      let sumDone = 0, sumTotal = 0;
      grid.innerHTML = TRACKS.map(t => {
        const total = t.total();
        const done = Math.min(t.done(), total);
        sumDone += done;
        sumTotal += total;
        const pct = total ? Math.round((done / total) * 100) : 0;
        const empty = done === 0;
        const complete = total > 0 && done >= total;
        const status = complete ? '已完成' : (empty ? '尚未开始' : `完成 ${pct}%`);
        return `<button type="button" class="fp-card${empty ? ' is-empty' : ''}${complete ? ' is-done' : ''}" role="listitem" data-href="${t.href}" aria-label="${t.lab} ${done}/${total}，${status}">
          <span class="fp-lab">${t.lab}</span>
          <span class="fp-row"><span class="fp-num">${done}</span><span class="fp-den">/ ${total}</span></span>
          <span class="fp-bar" aria-hidden="true"><i style="width:${pct}%"></i></span>
          <span class="fp-hint">${complete ? '已齐 · 点此复习' : t.hint}</span>
        </button>`;
      }).join('');
      if (foot) {
        const pct = sumTotal ? Math.round((sumDone / sumTotal) * 100) : 0;
        foot.textContent = sumDone
          ? `本机合计 ${sumDone} / ${sumTotal}（${pct}%）· 换设备不会带走`
          : `四轨合计 ${sumTotal} 项可记 · 点卡片跳转`;
      }
    }

    grid.addEventListener('click', e => {
      const card = e.target.closest('.fp-card');
      if (!card) return;
      const href = card.getAttribute('data-href');
      if (!href) return;
      const el = document.querySelector(href);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    paint();
    // refresh when local storage likely changed via same-tab interactions
    window.addEventListener('storage', paint);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') paint();
    });
    // light polling after clicks on interactive areas (same tab)
    ['click', 'change'].forEach(ev => {
      document.addEventListener(ev, () => setTimeout(paint, 80), true);
    });
  })();



  // v20: 本周田野三件事
  (function weekBoard() {
    const root = document.getElementById('weekBoard');
    if (!root || !ACTIONS) return;
    const KEY = 'startup-guide-week-v1';
    const slotsEl = document.getElementById('weekSlots');
    const metaEl = document.getElementById('weekMeta');
    const subEl = document.getElementById('weekSub');
    const picker = document.getElementById('weekPicker');
    const pool = document.getElementById('weekPool');
    const pickBtn = document.getElementById('weekPick');
    const clearBtn = document.getElementById('weekClear');
    const applyBtn = document.getElementById('weekApply');
    const cancelBtn = document.getElementById('weekCancel');
    if (!slotsEl || !metaEl) return;

    function isoWeek(d) {
      const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
      const day = date.getUTCDay() || 7;
      date.setUTCDate(date.getUTCDate() + 4 - day);
      const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
      const weekNo = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
      return date.getUTCFullYear() + '-W' + String(weekNo).padStart(2, '0');
    }
    function daysLeftInWeek(now) {
      const day = now.getDay(); // 0 Sun
      // treat week as Mon-Sun; days remaining including today until Sunday
      const left = day === 0 ? 1 : (8 - day);
      return left;
    }
    function loadState() {
      try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { return null; }
    }
    function saveState(state) {
      try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
    }
    function allItems() {
      const out = [];
      Object.keys(ACTIONS).forEach(key => {
        (ACTIONS[key] || []).forEach((text, i) => {
          out.push({ id: key + '::' + i, cat: key, text });
        });
      });
      return out;
    }
    function ensureWeek() {
      const week = isoWeek(new Date());
      let st = loadState();
      if (!st || st.week !== week || !Array.isArray(st.picks)) {
        st = { week, picks: [] };
        saveState(st);
      }
      return st;
    }

    let draft = [];

    function paint() {
      const st = ensureWeek();
      const left = daysLeftInWeek(new Date());
      const done = st.picks.filter(p => p.done).length;
      const total = st.picks.length;
      metaEl.innerHTML =
        '<span class="week-pill"><strong>' + st.week + '</strong></span>' +
        '<span>还剩 <strong style="color:var(--accent,#ff6b4a)">' + left + '</strong> 天</span>' +
        (total
          ? '<span>完成 <strong style="color:var(--accent,#ff6b4a)">' + done + '/' + total + '</strong></span>'
          : '<span>还没挑本周目标</span>');

      const slots = [0, 1, 2].map(i => st.picks[i] || null);
      slotsEl.innerHTML = slots.map((p, i) => {
        if (!p) {
          return '<li class="week-slot" data-empty="1">' +
            '<span class="week-slot-idx" aria-hidden="true">' + (i + 1) + '</span>' +
            '<p class="week-slot-empty">空位 · 点「挑选 / 改选」填入</p>' +
            '</li>';
        }
        return '<li class="week-slot is-filled' + (p.done ? ' is-done' : '') + '" data-id="' + p.id + '">' +
          '<span class="week-slot-idx" aria-hidden="true">' + (i + 1) + '</span>' +
          '<div><span class="week-slot-cat">' + (p.cat || '') + '</span>' +
          '<p class="week-slot-text">' + p.text + '</p></div>' +
          '<button type="button" class="week-slot-check" role="checkbox" aria-checked="' + (p.done ? 'true' : 'false') + '" aria-label="标记完成：' + p.text.replace(/"/g, '&quot;') + '"></button>' +
          '</li>';
      }).join('');

      const celeb = root.querySelector('.week-celebrate');
      if (celeb) celeb.remove();
      if (total === 3 && done === 3) {
        const p = document.createElement('p');
        p.className = 'week-celebrate';
        p.textContent = '本周三事都勾完了。周一会开新一周；想再压一档就去改选。';
        slotsEl.after(p);
      }
      if (subEl) {
        subEl.textContent = total
          ? ('本周 ' + total + ' 件钉住 · 周一（' + st.week + '）自动换周 · 只存本机')
          : '本周只盯三件 · 周一自动换周 · 只存本机';
      }
    }

    function openPicker() {
      const st = ensureWeek();
      draft = st.picks.map(p => p.id);
      const items = allItems();
      pool.innerHTML = items.map(it => {
        const sel = draft.includes(it.id);
        return '<button type="button" class="week-opt" role="option" aria-selected="' + (sel ? 'true' : 'false') + '" data-id="' + it.id + '" data-cat="' + it.cat + '">' +
          '<span class="week-opt-cat">' + it.cat + '</span>' + it.text + '</button>';
      }).join('');
      picker.hidden = false;
      const first = pool.querySelector('.week-opt');
      if (first) first.focus();
    }

    function closePicker() {
      picker.hidden = true;
      draft = [];
    }

    pool && pool.addEventListener('click', e => {
      const btn = e.target.closest('.week-opt');
      if (!btn) return;
      const id = btn.getAttribute('data-id');
      const idx = draft.indexOf(id);
      if (idx >= 0) {
        draft.splice(idx, 1);
        btn.setAttribute('aria-selected', 'false');
      } else {
        if (draft.length >= 3) {
          if (window.__sgToast) window.__sgToast('最多三件，先取消一件');
          return;
        }
        draft.push(id);
        btn.setAttribute('aria-selected', 'true');
      }
    });

    applyBtn && applyBtn.addEventListener('click', () => {
      const map = Object.fromEntries(allItems().map(it => [it.id, it]));
      const prev = ensureWeek();
      const prevDone = Object.fromEntries((prev.picks || []).map(p => [p.id, !!p.done]));
      const picks = draft.map(id => {
        const it = map[id];
        return { id, cat: it.cat, text: it.text, done: !!prevDone[id] };
      });
      saveState({ week: prev.week, picks });
      closePicker();
      paint();
      if (window.__sgToast) window.__sgToast(picks.length ? ('本周钉住 ' + picks.length + ' 件') : '本周暂空');
    });
    cancelBtn && cancelBtn.addEventListener('click', closePicker);
    pickBtn && pickBtn.addEventListener('click', () => {
      if (!picker.hidden) closePicker();
      else openPicker();
    });
    clearBtn && clearBtn.addEventListener('click', () => {
      const st = ensureWeek();
      saveState({ week: st.week, picks: [] });
      closePicker();
      paint();
      if (window.__sgToast) window.__sgToast('已清空本周');
    });

    slotsEl.addEventListener('click', e => {
      const btn = e.target.closest('.week-slot-check');
      if (!btn) return;
      const li = btn.closest('.week-slot');
      if (!li) return;
      const id = li.getAttribute('data-id');
      const st = ensureWeek();
      const hit = st.picks.find(p => p.id === id);
      if (!hit) return;
      hit.done = !hit.done;
      saveState(st);
      paint();
      if (hit.done && window.__sgToast) window.__sgToast('本周完成 +1');
    });

    paint();
  })();




  // v21: 出征一页纸
  (function onePager() {
    const modal = document.getElementById('onePagerModal');
    const backdrop = document.getElementById('onePagerBackdrop');
    const sheet = document.getElementById('onePagerSheet');
    const openBtn = document.getElementById('onePagerOpen');
    const closeBtn = document.getElementById('onePagerClose');
    const copyBtn = document.getElementById('onePagerCopy');
    const printBtn = document.getElementById('onePagerPrint');
    if (!modal || !sheet) return;

    function esc(s) {
      return String(s || '').replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
      })[c]);
    }

    function readJSON(key, fallback) {
      try {
        const v = JSON.parse(localStorage.getItem(key) || 'null');
        return v == null ? fallback : v;
      } catch (e) { return fallback; }
    }

    function weekSummary() {
      const st = readJSON('startup-guide-week-v1', null);
      if (!st || !Array.isArray(st.picks) || !st.picks.length) {
        return { html: '<p class="op-empty">本周还没钉三件事 · 去「本周三事」挑一下</p>', md: '_本周还没钉三件事_', lines: [] };
      }
      const lines = st.picks.map((p, i) => ({
        mark: p.done ? '✓' : String(i + 1),
        text: (p.cat ? p.cat + ' · ' : '') + p.text,
        done: !!p.done
      }));
      const html = '<ul>' + lines.map(l =>
        `<li><span class="op-mark">${esc(l.mark)}</span><span>${esc(l.text)}</span></li>`
      ).join('') + '</ul>';
      const md = lines.map(l => `- [${l.done ? 'x' : ' '}] ${l.text}`).join('\n');
      return { html, md, lines };
    }

    function screenerSummary() {
      const state = readJSON('startup-guide-screener-v1', {});
      const riskMap = {
        pay: { yes: 0, once: 2, na: 1 },
        cac: { organic: 0, ads: 2, mix: 1 },
        halo: { cash: 0, prize: 2, demo: 1 },
        runway: { ok: 0, single: 2, hope: 1 },
        exit: { yes: 0, no: 2, draft: 1 }
      };
      const qids = Object.keys(riskMap);
      const answered = qids.filter(id => state[id]);
      if (!answered.length) {
        return { chip: '<span class="op-chip">快筛未答</span>', md: '立项快筛：未答', risk: null };
      }
      let risk = 0;
      answered.forEach(id => {
        const map = riskMap[id];
        if (map && map[state[id]] != null) risk += map[state[id]];
      });
      const score = Math.min(10, risk);
      const band = score <= 2 ? '低风险' : (score <= 5 ? '中风险' : '高风险');
      const cls = score <= 2 ? 'ok' : (score <= 5 ? '' : 'warn');
      return {
        chip: `<span class="op-chip ${cls}"><strong>${esc(band)}</strong> · 快筛 ${score}/10 · 已答 ${answered.length}/5</span>`,
        md: `立项快筛：${band}（${score}/10，已答 ${answered.length}/5）`,
        risk: score
      };
    }

    function premortemSummary() {
      const pm = readJSON('startup-guide-premortem-v1', {});
      const fields = [
        ['policy', '政策'],
        ['cac', 'CAC'],
        ['compliance', '合规'],
        ['exit', '退出']
      ];
      const filled = fields.filter(([k]) => (pm[k] || '').trim());
      if (!filled.length) {
        return { html: '<p class="op-empty">Premortem 还是空的 · 四行各写一句就够</p>', md: '_Premortem 未写_', n: 0 };
      }
      const html = '<ul>' + filled.map(([k, lab]) =>
        `<li><span class="op-mark">${esc(lab)}</span><span>${esc((pm[k] || '').trim())}</span></li>`
      ).join('') + '</ul>';
      const md = filled.map(([k, lab]) => `- **${lab}**：${(pm[k] || '').trim()}`).join('\n');
      return { html, md, n: filled.length };
    }

    function build() {
      const oneliner = (data && data.meta && data.meta.oneliner) || document.getElementById('oneliner')?.textContent || '';
      const date = (data && data.meta && data.meta.date) || new Date().toISOString().slice(0, 10);
      const conclusions = (data && data.conclusions) || [];
      const failures = (data && data.failures) || [];
      const week = weekSummary();
      const scr = screenerSummary();
      const pm = premortemSummary();

      const conclChips = conclusions.slice(0, 8).map(c =>
        `<span class="op-chip"><strong>${esc(c.id || '')}</strong> ${esc(c.title || '')}</span>`
      ).join('');
      const failChips = failures.map(f =>
        `<span class="op-chip warn">${esc(f.tag || '')}</span>`
      ).join('');

      sheet.innerHTML =
        `<p class="op-date">田野笔记 · ${esc(date)} · 本机快照</p>` +
        `<p class="op-line">${esc(oneliner)}</p>` +
        `<div class="op-chips" style="margin-bottom:.75rem">${scr.chip}` +
        `<span class="op-chip">结论 ${conclusions.length}</span>` +
        `<span class="op-chip">死法 ${failures.length}</span></div>` +
        `<h3>本周三事</h3>${week.html}` +
        `<h3>Premortem</h3>${pm.html}` +
        `<h3>核心结论</h3><div class="op-chips">${conclChips || '<span class="op-empty">无</span>'}</div>` +
        `<h3>优先避开</h3><div class="op-chips">${failChips || '<span class="op-empty">无</span>'}</div>`;

      const md = [
        `# 出征一页纸 · ${date}`,
        '',
        `> ${oneliner}`,
        '',
        scr.md,
        '',
        '## 本周三事',
        week.md,
        '',
        '## Premortem',
        pm.md,
        '',
        '## 核心结论',
        ...conclusions.map(c => `- **${c.id || ''} ${c.title || ''}**：${c.body || ''}`),
        '',
        '## 优先避开',
        ...failures.map(f => `- **${f.tag || ''}**：${f.desc || ''}（${f.ex || ''}）`),
        '',
        '_生成自大学生创业田野笔记 · 只存本机_'
      ].join('\n');
      sheet.dataset.md = md;
    }

    function open() {
      build();
      modal.hidden = false;
      if (backdrop) backdrop.hidden = false;
      modal.classList.add('is-print'); // keep printable node identifiable
      const focusable = copyBtn || closeBtn;
      if (focusable) setTimeout(() => focusable.focus(), 40);
    }
    function close() {
      modal.hidden = true;
      if (backdrop) backdrop.hidden = true;
      document.body.classList.remove('op-printing');
    }

    window.__sgOpenOnePager = open;

    openBtn && openBtn.addEventListener('click', open);
    closeBtn && closeBtn.addEventListener('click', close);
    backdrop && backdrop.addEventListener('click', close);
    copyBtn && copyBtn.addEventListener('click', async () => {
      const md = sheet.dataset.md || '';
      try {
        await navigator.clipboard.writeText(md);
        if (window.__sgToast) window.__sgToast('一页纸 Markdown 已复制');
      } catch (e) {
        if (window.__sgToast) window.__sgToast('复制失败，请手动选中');
      }
    });
    printBtn && printBtn.addEventListener('click', () => {
      document.body.classList.add('op-printing');
      window.print();
      setTimeout(() => document.body.classList.remove('op-printing'), 400);
    });
    window.addEventListener('keydown', e => {
      if (e.key === 'Escape' && !modal.hidden) {
        e.preventDefault();
        close();
      }
    });
  })();




/* v22: weekly crawl feed + failure rail */
(async function loadWeeklyAndFails(){
  const feed = document.getElementById('weeklyFeed');
  const meta = document.getElementById('weeklyMeta');
  const rail = document.getElementById('failRail');
  try {
    const w = await fetch('data/weekly.json').then(r => r.json());
    if (meta) meta.textContent = `${w.week} · 更新 ${w.updated_at || ''} · 来源 ${w.source || 'crawl'}`;
    if (feed) {
      feed.innerHTML = (w.suggestions || []).map((s, i) => `
        <article class="weekly-card">
          <div class="from">${s.from || '建议'} · ${i+1}/3</div>
          <h3>${s.title}</h3>
          <p>${s.why || ''}</p>
          <p style="margin-top:.35rem;color:var(--ink-faint);font-size:.84rem">${s.action || ''}</p>
          ${s.href ? `<a class="go" href="${s.href}">去做 →</a>` : ''}
          ${s.link ? `<a class="go" href="${s.link}" target="_blank" rel="noopener">来源文章 →</a>` : ''}
        </article>`).join('');
    }
  } catch (e) { if (meta) meta.textContent = '本周建议暂未生成'; }

  try {
    let highlights = [];
    try {
      const fh = await fetch('data/failures-highlight.json').then(r => r.json());
      highlights = fh.highlights || fh.items || [];
    } catch (_) {}
    if (!highlights.length) {
      const all = await fetch('data/cases.json').then(r => r.json());
      highlights = (all.cases || []).filter(c => c.story).slice(0, 12).map(c => ({
        name: c.name, story: c.story, lesson: c.lesson, outcome: c.outcome, sector: c.sector
      }));
    }
    if (rail) {
      rail.innerHTML = highlights.slice(0, 12).map(h => `
        <a class="fail-card" href="cases.html?q=${encodeURIComponent(h.name)}">
          <div class="from" style="font-family:var(--mono);font-size:.68rem;color:var(--accent)">${h.outcome || '失败'} · ${h.sector || ''}</div>
          <h3>${h.name}</h3>
          <p class="kb-story">${h.story || ''}</p>
          ${h.lesson ? `<p class="kb-lesson">${h.lesson}</p>` : ''}
        </a>`).join('') || '<p style="color:var(--ink-faint)">失败经历充实中…</p>';
    }
  } catch (e) {}
})();

})();