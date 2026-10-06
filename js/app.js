/* =====================================================================
   选择你的川传生活 · 交互层
   依赖 data.js；纯原生 JS，无外部库。
   ===================================================================== */
(function () {
  'use strict';

  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));
  const random = (arr) => arr[Math.floor(Math.random() * arr.length)];

  /* ---------------- 状态 ---------------- */
  const SAVE_KEY = 'sumc_life_v1';

  function freshState() {
    return {
      nickname: '新川传人',
      archetype: 'undecided',
      residence: 'unknown',
      attrs: { lens: 0, voice: 0, story: 0, stage: 0, life: 0 },
      actionLeft: GAME.actionMax,
      explored: [],      // 正式点位（已完整探索）
      eggSeen: [],       // 彩蛋（已看过，用于贴士去重）
      choicesMade: 0,
      tips: ['t_gift'],  // 迎新礼包贴士默认已解锁
      alumni: [],
      yuanxiao: false,
      yuanxiaoShown: false,
      settled: false,
      ending: null,
      started: false,
      muted: false,
    };
  }

  let state = load();
  function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch (e) {} }
  function load() { try { const s = localStorage.getItem(SAVE_KEY); return s ? Object.assign(freshState(), JSON.parse(s)) : freshState(); } catch (e) { return freshState(); } }
  function reset() { const m = state.muted; state = freshState(); state.muted = m; save(); }

  /* ---------------- 音频（场记板「啪」） ---------------- */
  let audioCtx = null;
  function clap() {
    if (state.muted) return;
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      const t = audioCtx.currentTime, dur = 0.06;
      const buf = audioCtx.createBuffer(1, audioCtx.sampleRate * dur, audioCtx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2);
      const src = audioCtx.createBufferSource(); src.buffer = buf;
      const f = audioCtx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1800; f.Q.value = 0.8;
      const g = audioCtx.createGain(); g.gain.value = 0.9;
      src.connect(f); f.connect(g); g.connect(audioCtx.destination); src.start();
    } catch (e) {}
  }

  /* ---------------- 背景音乐（循环） ---------------- */
  let bgm = null;
  function ensureBgm() {
    if (!bgm) { bgm = new Audio('assets/audio/Evo.mp3'); bgm.loop = true; bgm.volume = 0.4; }
    return bgm;
  }
  function syncBgm() {
    if (!bgm) return;
    if (state.muted) bgm.pause();
    else bgm.play().catch(() => {});
  }

  /* ---------------- 屏幕切换 ---------------- */
  const FULL_SCREENS = ['screen-intro', 'screen-setup', 'screen-map', 'screen-ending'];
  const OVERLAYS = ['screen-event', 'screen-collection', 'screen-share'];
  function show(id) {
    FULL_SCREENS.forEach((s) => $('#' + s).classList.toggle('active', s === id));
    OVERLAYS.forEach((s) => $('#' + s).classList.remove('active'));
  }
  function openOverlay(id) { $('#' + id).classList.add('active'); }
  function closeOverlay(id) { $('#' + id).classList.remove('active'); }

  function toast(msg, ms) {
    const el = $('#toast');
    el.textContent = msg;
    el.hidden = false;
    el.classList.add('show');
    clearTimeout(el._t);
    el._t = setTimeout(() => { el.classList.remove('show'); el.hidden = true; }, ms || 2200);
  }

  /* ---------------- 页 0：片头 ---------------- */
  function initIntro() {
    const label = state.started ? (state.settled ? '再选一次' : '继续上次') : '开拍';
    $('#btnSkipIntro').textContent = label;
    $('#btnSkipIntro').hidden = false;
    // 重新触发 CSS 动画
    ['introClapper', 'introSchool', 'introTagline', 'introMapGlow', 'filmLoader']
      .forEach((id) => { const el = $('#' + id); el.classList.remove('anim'); void el.offsetWidth; el.classList.add('anim'); });
    clap();
    $('#filmCaption').textContent = '过卷中…';
    setTimeout(() => { $('#filmCaption').textContent = '就绪 · 第一镜'; }, 2600);
    show('screen-intro');
  }

  /* ---------------- 页 1：开场选择 ---------------- */
  function renderChips() {
    const wrap = (el, items, group, activeId) => {
      el.innerHTML = '';
      items.forEach((it) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'chip' + (it.id === activeId ? ' selected' : '');
        b.dataset.id = it.id;
        b.innerHTML = `<span class="chip-emoji">${it.emoji}</span>${it.name}`;
        b.addEventListener('click', () => {
          state[group] = it.id;
          el.querySelectorAll('.chip').forEach((x) => x.classList.remove('selected'));
          b.classList.add('selected');
          if (group === 'archetype') $('#guideBubble').innerHTML = `<p>${it.flavor}</p><p>川崽：点哪里，你的川传生活就往哪边去。</p>`;
          updateEnterBtn();
          save();
        });
        el.appendChild(b);
      });
    };
    wrap($('#chipsArchetype'), ARCHETYPES, 'archetype', state.archetype);
    wrap($('#chipsResidence'), RESIDENCE, 'residence', state.residence);
    $('#inputNickname').value = state.nickname;
    updateEnterBtn();
  }

  function updateEnterBtn() {
    const ready = state.archetype && state.residence;
    $('#btnEnterMap').disabled = !ready;
  }

  /* ---------------- 属性 / 行动点渲染 ---------------- */
  function attrBarRow(attrKey) {
    const a = ATTRS[attrKey];
    const v = state.attrs[attrKey];
    let cells = '';
    for (let i = 0; i < GAME.attrMax; i++) cells += `<i class="cell${i < v ? ' on' : ''}"></i>`;
    return `<div class="attr-row" title="${a.desc}">
      <span class="attr-icon">${a.icon}</span>
      <span class="attr-name">${a.name}</span>
      <span class="attr-bar">${cells}</span>
      <span class="attr-val">${v}</span>
    </div>`;
  }

  function renderAttrs() {
    $('#attrList').innerHTML = ATTR_ORDER.map(attrBarRow).join('');
    // HUD：最高属性
    const top = topAttr();
    $('#hudTopAttr').innerHTML = top ? `${top.icon} ${top.name}` : '—';
    // 分享图属性（如已打开）
    if (state.ending) $('#shareAttrs').innerHTML = ATTR_ORDER.map(attrBarRow).join('');
  }

  function topAttr() {
    const ranked = ATTR_ORDER.slice().sort((x, y) => state.attrs[y] - state.attrs[x]);
    return state.attrs[ranked[0]] > 0 ? ATTRS[ranked[0]] : null;
  }

  function renderAction() {
    $('#actionCount').textContent = `${state.actionLeft} / ${GAME.actionMax}`;
    let dots = '';
    for (let i = 0; i < GAME.actionMax; i++) dots += `<i class="adot${i < state.actionLeft ? ' on' : ''}"></i>`;
    $('#actionDots').innerHTML = dots;
    $('#hudDots').innerHTML = dots;
    // 结算按钮状态
    const canSettle = state.explored.length >= GAME.settleMin || state.actionLeft === 0;
    $('#btnSettle').disabled = !canSettle;
    $('#btnSettleM').disabled = !canSettle;
  }

  /* ---------------- 地图 ---------------- */
  let activeRegion = 'east';
  let mapScale = 1, mapTx = 0, mapTy = 0;
  const mapVpEl = $('#mapViewport');
  const mapCanvasEl = $('#mapCanvas');

  function allHotspots() {
    const formal = LOCATIONS.map((l) => ({ kind: 'loc', data: l, region: l.region }));
    const eggs = EASTER_EGGS.map((e) => ({ kind: 'egg', data: e, region: e.region }));
    return formal.concat(eggs);
  }

  function renderMap() {
    setMapRegion((state.residence === 'west') ? 'west' : 'east');
    renderDailyLog();
    renderAttrs();
    renderAction();
    $('#hudNickname').textContent = state.nickname;
    state.started = true;
    save();
  }

  function setMapRegion(region) {
    activeRegion = region;
    $$('#regionTabs .region-tab').forEach((t) => t.classList.toggle('active', t.dataset.region === region));
    $('#mapImg').src = `assets/maps/${region}.png`;
    $('#mapPh').textContent = `占位图 · 校园平面图（${region === 'east' ? '东区' : '西区'}）`;
    resetMapTransform();
    const img = $('#mapImg');
    if (img.complete && img.naturalWidth) renderHotspots(); // 尚未解码时由 load 事件渲染
  }

  function resetMapTransform() { mapScale = 1; mapTx = 0; mapTy = 0; applyMapTransform(); }

  /* 计算地图图片在 contain 居中后的实际内容框（用于热点对齐） */
  function mapImageBox() {
    const c = $('#mapBg');
    const img = $('#mapImg');
    const cw = c.clientWidth, ch = c.clientHeight;
    const iw = img.naturalWidth, ih = img.naturalHeight;
    if (!iw || !ih || !cw || !ch) return { x: 0, y: 0, w: cw, h: ch };
    const s = Math.min(cw / iw, ch / ih);
    const w = iw * s, h = ih * s;
    return { x: (cw - w) / 2, y: (ch - h) / 2, w, h };
  }

  function renderHotspots() {
    const wrap = $('#mapHotspots');
    const box = mapImageBox();
    wrap.innerHTML = '';
    allHotspots()
      .filter((h) => h.region === activeRegion)
      .forEach((h) => {
        const explored = h.kind === 'loc' && state.explored.includes(h.data.id);
        const node = document.createElement('button');
        node.type = 'button';
        node.className = 'hotspot ' + (h.kind === 'egg' ? 'egg' : 'loc') + (explored ? ' done' : ' new');
        node.style.left = (box.x + h.data.pos.x / 100 * box.w) + 'px';
        node.style.top = (box.y + h.data.pos.y / 100 * box.h) + 'px';
        node.innerHTML = `
          <span class="hot-icon">${h.data.emoji}</span>
          <span class="hot-label">${h.data.short}</span>
          <span class="hot-flag">${explored ? '✓' : '🎬'}</span>`;
        node.addEventListener('click', () => { if (!mapMoved) onHotspot(h); });
        node.addEventListener('pointerenter', (e) => showTooltip(h.data, e));
        node.addEventListener('pointerleave', hideTooltip);
        node.addEventListener('pointerdown', (e) => { mapMoved = false; e.stopPropagation(); });
        wrap.appendChild(node);
      });
  }

  function onHotspot(h) {
    if (h.kind === 'egg') { openEgg(h.data); return; }
    const loc = h.data;
    if (state.explored.includes(loc.id)) { openRevisit(loc); return; }
    if (state.actionLeft <= 0) { toast('行动点用完啦，去「收工结算」吧'); return; }
    openEvent(loc);
  }

  function showTooltip(d, e) {
    const el = $('#mapTooltip');
    el.innerHTML = `<b>${d.name}</b><span>${d.hover || ''}</span>`;
    el.hidden = false;
    const vp = $('#mapViewport').getBoundingClientRect();
    el.style.left = Math.min(e.clientX - vp.left + 12, vp.width - 180) + 'px';
    el.style.top = Math.min(e.clientY - vp.top + 12, vp.height - 60) + 'px';
  }
  function hideTooltip() { $('#mapTooltip').hidden = true; }

  function renderDailyLog() {
    const unvisited = LOCATIONS.filter((l) => !state.explored.includes(l.id));
    let html = `<p>${random(DAILY_HOOKS)}</p>`;
    if (unvisited.length) {
      const u = random(unvisited);
      html += `<p class="log-lure">📍 还没去「${u.name}」？${u.lure}</p>`;
    } else {
      html += `<p class="log-lure">🎉 地标全部点亮！去「川传手账」看看。</p>`;
    }
    $('#dailyLog').innerHTML = html;
  }

  /* ---- 地图平移 / 缩放（电脑滚轮 + 手机拖拽 / 双指） ---- */
  const pointers = new Map();
  let mapMoved = false;
  let pinchDist = 0;

  function applyMapTransform() {
    mapCanvasEl.style.transform = `translate(${mapTx}px, ${mapTy}px) scale(${mapScale})`;
  }
  function zoomMap(factor, cx, cy) {
    const next = Math.min(3, Math.max(1, mapScale * factor));
    factor = next / mapScale;
    mapScale = next;
    mapTx = cx - (cx - mapTx) * factor;
    mapTy = cy - (cy - mapTy) * factor;
    clampMap();
    applyMapTransform();
  }
  function clampMap() {
    const vp = mapVpEl;
    const maxX = (mapScale - 1) * vp.clientWidth * 0.6;
    const maxY = (mapScale - 1) * vp.clientHeight * 0.6;
    mapTx = Math.max(-maxX, Math.min(maxX, mapTx));
    mapTy = Math.max(-maxY, Math.min(maxY, mapTy));
  }

  function initMapGestures() {
    const vp = mapVpEl;
    vp.addEventListener('pointerdown', (e) => {
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size === 1) { mapMoved = false; }
      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        pinchDist = Math.hypot(a.x - b.x, a.y - b.y);
      }
      vp.setPointerCapture(e.pointerId);
    });
    vp.addEventListener('pointermove', (e) => {
      if (!pointers.has(e.pointerId)) return;
      const prev = pointers.get(e.pointerId);
      const cur = { x: e.clientX, y: e.clientY };
      if (pointers.size === 1) {
        const dx = cur.x - prev.x, dy = cur.y - prev.y;
        if (Math.hypot(dx, dy) > 5) mapMoved = true;
        mapTx += dx; mapTy += dy; clampMap(); applyMapTransform();
      } else if (pointers.size === 2) {
        const [p1, p2] = [...pointers.entries()];
        const other = p1[0] === e.pointerId ? p2[1] : p1[1];
        const nd = Math.hypot(cur.x - other.x, cur.y - other.y);
        if (pinchDist > 0 && nd > 0) {
          const r = vp.getBoundingClientRect();
          zoomMap(nd / pinchDist, r.left + vp.clientWidth / 2, r.top + vp.clientHeight / 2);
        }
        pinchDist = nd;
      }
      pointers.set(e.pointerId, cur);
    });
    const end = (e) => { pointers.delete(e.pointerId); pinchDist = 0; };
    vp.addEventListener('pointerup', end);
    vp.addEventListener('pointercancel', end);
    vp.addEventListener('wheel', (e) => {
      e.preventDefault();
      const r = vp.getBoundingClientRect();
      zoomMap(e.deltaY < 0 ? 1.1 : 0.9, e.clientX - r.left, e.clientY - r.top);
    }, { passive: false });
    vp.addEventListener('dblclick', () => resetMapTransform());
  }

  /* ---------------- 页 3：建筑内对话（四拍） ---------------- */
  let evt = null;
  let endingSkip = null; // 结局演出「点击跳播」回调，绑定一次、每次演出替换
  let easterDone = null; // 园校合一彩蛋弹窗关闭后继续演出的回调

  function openEvent(loc) {
    evt = { loc, mode: 'first', beats: buildBeats(loc), idx: 0, choice: null, summary: null };
    renderBeat();
    openOverlay('screen-event');
  }
  function openRevisit(loc) {
    evt = { loc, mode: 'revisit', beats: [{ type: 'revisit' }], idx: 0, choice: null, summary: null };
    renderBeat();
    openOverlay('screen-event');
  }
  function openEgg(egg) {
    const added = applyEgg(egg);
    evt = { loc: egg, mode: 'egg', beats: [{ type: 'egg' }], idx: 0, choice: null, summary: null, addedTip: added };
    renderBeat();
    openOverlay('screen-event');
  }
  function buildBeats(loc) {
    const beats = [{ type: 'empty' }, { type: 'encounter' }];
    if (loc.choice) beats.push({ type: 'choice' });
    beats.push({ type: 'reward' });
    return beats;
  }

  function applyEgg(egg) {
    let added = 0;
    (egg.tipIds || []).forEach((t) => { if (!state.tips.includes(t)) { state.tips.push(t); added++; } });
    if (!state.eggSeen.includes(egg.id)) state.eggSeen.push(egg.id);
    save();
    return added;
  }

  function applyReward() {
    if (evt.summary) return; // 只结算一次
    const loc = evt.loc;
    const deltas = evt.choice ? evt.choice.attr : (loc.flatAttr || {});
    const gained = [];
    for (const k in deltas) {
      state.attrs[k] = Math.min(GAME.attrMax, state.attrs[k] + deltas[k]);
      gained.push(`${ATTRS[k].icon}${ATTRS[k].name} +${deltas[k]}`);
    }
    const newTips = (loc.tipIds || []).filter((t) => !state.tips.includes(t));
    newTips.forEach((t) => state.tips.push(t));
    if (!state.explored.includes(loc.id)) state.explored.push(loc.id);
    if (evt.choice) state.choicesMade++;
    state.actionLeft--;
    if (YUANXIAO_SET.every((id) => state.explored.includes(id))) state.yuanxiao = true;
    save();
    evt.summary = { gained, newTips };
  }

  function renderBeat() {
    const beat = evt.beats[evt.idx];
    const loc = evt.loc;
    $('#vnSceneNo').textContent = evt.idx + 1;
    $('#vnPlace').textContent = loc.name;
    $('#vnPhNote').textContent = loc.name;
    const sceneImg = SCENES[loc.id];
    const imgEl = $('#vnSceneImg');
    if (sceneImg) { imgEl.src = sceneImg; imgEl.hidden = false; $('#vnPhTag').hidden = true; $('#vnPhNote').hidden = true; }
    else { imgEl.hidden = true; imgEl.removeAttribute('src'); $('#vnPhTag').hidden = false; $('#vnPhNote').hidden = false; }
    $('#vnChoices').innerHTML = '';
    $('#vnChar').hidden = true;
    const marks = $$('#vnProgress .vn-beat');

    if (beat.type === 'empty') {
      $('#vnRole').textContent = loc.name;
      $('#vnDialog').textContent = loc.desc;
      $('#vnNext').hidden = false; $('#vnNext').textContent = '下一条 ▸';
      markBeat(marks, 0);
    } else if (beat.type === 'encounter') {
      $('#vnRole').textContent = loc.encounter.role;
      $('#vnDialog').textContent = loc.encounter.line;
      $('#vnChar').hidden = false;
      $('#vnNext').hidden = false; $('#vnNext').textContent = '下一条 ▸';
      markBeat(marks, 1);
    } else if (beat.type === 'choice') {
      $('#vnRole').textContent = '你';
      $('#vnDialog').textContent = loc.choice.prompt;
      $('#vnNext').hidden = true;
      loc.choice.options.forEach((opt) => {
        $('#vnChoices').appendChild(btn('choice-btn', opt.label, () => { evt.choice = opt; evt.idx++; renderBeat(); }));
      });
      markBeat(marks, 2);
    } else if (beat.type === 'reward') {
      applyReward();
      const s = evt.summary;
      let txt = evt.choice ? evt.choice.result : '你在这里待了一会儿，把这里的门道摸清了一点。';
      if (s.gained.length) txt += '\n' + s.gained.join('　');
      if (s.newTips.length) txt += '\n📔 新贴士已收入手账。';
      $('#vnRole').textContent = '川崽';
      $('#vnDialog').textContent = txt;
      $('#vnChar').hidden = false;
      $('#vnNext').hidden = false; $('#vnNext').textContent = '回地图 ▸';
      markBeat(marks, 3);
    } else if (beat.type === 'revisit') {
      $('#vnRole').textContent = loc.name;
      $('#vnDialog').textContent = random(loc.revisit);
      $('#vnNext').hidden = false; $('#vnNext').textContent = '回地图 ▸';
      markBeat(marks, 3);
    } else if (beat.type === 'egg') {
      $('#vnRole').textContent = loc.name;
      $('#vnDialog').textContent = loc.text + (evt.addedTip ? '\n📔 新贴士已收入手账。' : '');
      $('#vnNext').hidden = false; $('#vnNext').textContent = '回地图 ▸';
      markBeat(marks, 3);
    }
  }
  function markBeat(marks, n) {
    marks.forEach((m, i) => m.classList.toggle('on', i <= n));
  }

  function advanceEvent() {
    if (!evt) return;
    if (evt.idx < evt.beats.length - 1) { evt.idx++; renderBeat(); }
    else closeEvent();
  }
  function closeEvent() {
    closeOverlay('screen-event');
    evt = null;
    renderAttrs(); renderAction(); renderHotspots(); renderDailyLog();
    if (state.actionLeft === 0 && !state.settled) { toast('行动点用完，收工！'); setTimeout(settle, 600); }
  }

  /* ---------------- 页 4：图鉴「川传手账」 ---------------- */
  function openCollection(tab) {
    setCollectionTab(tab || 'landmark');
    openOverlay('screen-collection');
  }
  function setCollectionTab(tab) {
    $$('#handbookTabs .hb-tab').forEach((t) => t.classList.toggle('active', t.dataset.tab === tab));
    $('#hbSearchWrap').hidden = tab !== 'tips';
    if (tab !== 'tips') $('#hbSearch').value = '';
    renderCollection(tab, $('#hbSearch').value.trim());
  }
  function renderCollection(tab, q) {
    const grid = $('#hbGrid');
    if (tab === 'landmark') {
      const items = allHotspots();
      grid.innerHTML = items.map((h) => {
        const seen = h.kind === 'loc' ? state.explored.includes(h.data.id) : state.eggSeen.includes(h.data.id);
        return `<div class="hb-card${seen ? '' : ' locked'}">
          <div class="hb-card-front">${h.data.emoji}<div class="hb-card-name">${h.data.name}</div></div>
          <div class="hb-card-back">${seen ? (h.data.hover || '一处值得逛逛的地方。') : '？？？'}</div>
        </div>`;
      }).join('');
    } else if (tab === 'tips') {
      const keys = Object.keys(TIPS);
      const unlocked = keys.filter((k) => state.tips.includes(k));
      const locked = keys.filter((k) => !state.tips.includes(k));
      const list = q ? unlocked.filter((k) => TIPS[k].text.includes(q) || TIPS[k].src.includes(q)) : unlocked;
      const rows = list.map((k) => tipCard(TIPS[k])).join('');
      grid.innerHTML = rows || '<p class="hb-empty">没有匹配的贴士。</p>';
      grid.innerHTML += `<div class="hb-locked-count">🔒 未解锁 ${locked.length} 条</div>`;
    } else if (tab === 'alumni') {
      const keys = Object.keys(ALUMNI);
      grid.innerHTML = keys.map((k) => {
        const a = ALUMNI[k];
        const unlocked = state.alumni.includes(k);
        if (k === 'wall') return unlocked ? wallCard() : `<div class="hb-card locked hb-wall"><div class="hb-card-front">🎓<div class="hb-card-name">特殊校友墙</div></div><div class="hb-card-back">${a.dir}</div></div>`;
        const photo = unlocked && a.photo;
        return `<div class="hb-card${unlocked ? '' : ' locked'} hb-alumni">
          <div class="hb-card-front">${photo ? `<img class="hb-photo" src="${a.photo}" alt="">` : (unlocked ? '🧑‍🎓' : '👤')}<div class="hb-card-name">${unlocked ? a.name : '？？？'}</div></div>
          <div class="hb-card-back"><b>${a.dir}</b>${unlocked ? '<br>' + a.bio : ''}</div>
        </div>`;
      }).join('');
    }
  }
  function tipCard(t) {
    return `<div class="hb-card hb-tip">
      <div class="hb-card-front">${TIP_CATS[t.cat]}<div class="hb-card-name">${t.src}</div></div>
      <div class="hb-card-back">${t.text}</div>
    </div>`;
  }
  function wallCard() {
    return `<div class="hb-card hb-wall-open">
      <div class="wall-silhouettes"><i></i><i></i><i></i></div>
      <div class="hb-card-back">三位川传人 · 全部点亮需新周目</div>
    </div>`;
  }

  /* ---------------- 彩蛋弹窗：园校合一 · 产教融合 ---------------- */
  function showYuanxiaoEgg(done) {
    easterDone = done;
    openOverlay('screen-easter');
  }
  function closeEaster() {
    closeOverlay('screen-easter');
    if (easterDone) { const d = easterDone; easterDone = null; d(); }
  }

  /* ---------------- 页 5：结算 / 结局 ---------------- */
  function settle() {
    if (state.settled) return;
    if (state.explored.length < GAME.settleMin && state.actionLeft > 0) {
      toast(`至少探索 ${GAME.settleMin} 处才能收工（已探索 ${state.explored.length} 处）`);
      return;
    }
    const endingKey = computeEnding();
    const ending = ENDINGS[endingKey];
    state.settled = true;
    state.ending = endingKey;
    // 解锁校友
    if (ending.alumni) { addAlumni(ending.alumni); if (ending.backup) addAlumni(ending.backup); }
    save();
    if (state.yuanxiao && !state.yuanxiaoShown) {
      state.yuanxiaoShown = true;
      save();
      showYuanxiaoEgg(() => playEnding(ending));
    } else {
      playEnding(ending);
    }
  }

  function addAlumni(id) { if (id && !state.alumni.includes(id)) state.alumni.push(id); }

  function computeEnding() {
    const a = state.attrs;
    const familiar = state.explored.length;
    if (ATTR_ORDER.every((k) => a[k] >= GAME.balancedMinAttr) && familiar >= GAME.balancedMinExplored) return 'F';
    if (familiar <= GAME.emptyMaxExplored || state.choicesMade === 0) return 'G';

    const top = Math.max(...ATTR_ORDER.map((k) => a[k]));
    // 表演 / 导演轴：镜头感或舞台达到全局最高时，按两者差距判定
    //   D（表演）：舞台最高，或 |镜头感 - 舞台| ≤ 1（两者接近）
    //   A（导演）：镜头感最高，且 镜头感 - 舞台 ≥ 2（镜头感明显领先）
    if (a.lens === top || a.stage === top) return (a.lens - a.stage) >= 2 ? 'A' : 'D';

    // 其余：声线 / 叙事 / 烟火 各自最高
    const winner = ATTR_ORDER.find((k) => a[k] === top);
    return Object.keys(ENDINGS).find((k) => ENDINGS[k].attr === winner);
  }

  function playEnding(ending) {
    show('screen-ending');
    clap();
    const slates = $('#endingSlates');
    const card = $('#endingCard');
    const actions = $('#endingActions');
    slates.innerHTML = '';
    card.hidden = true;
    actions.hidden = true;

    const seq = [];
    seq.push({ cls: 'end-title', text: `第 ${ending.key} 场 · 终` });
    seq.push({ cls: 'end-title-sm', text: ending.title });
    seq.push({ cls: 'end-narr', text: ending.narr });
    ending.slides.forEach((s) => seq.push({ cls: 'end-sub', text: s }));

    let i = 0;
    let timer = null;
    const step = () => {
      if (i >= seq.length) {
        revealAlumni(ending);
        return;
      }
      const s = seq[i];
      slates.innerHTML = '';
      const d = document.createElement('div');
      d.className = 'end-slate ' + s.cls;
      d.textContent = s.text;
      slates.appendChild(d);
      void d.offsetWidth; d.classList.add('in');
      i++;
      timer = setTimeout(step, i === 1 ? 1500 : 2400);
    };
    endingSkip = () => { clearTimeout(timer); i = seq.length; step(); };
    step();
  }

  function revealAlumni(ending) {
    const slates = $('#endingSlates');
    slates.innerHTML = '';
    const card = $('#endingCard');
    const actions = $('#endingActions');
    if (ending.alumni === 'wall') {
      card.innerHTML = `<div class="ending-wall"><i></i><i></i><i></i></div>${alumniInfo(ALUMNI.wall)}`;
    } else if (ending.alumni) {
      card.innerHTML = alumniCard(ALUMNI[ending.alumni]);
      card._currentAlumni = ending.alumni;
      card._backup = ending.backup;
    } else {
      card.hidden = true;
    }
    card.hidden = ending.alumni ? false : true;
    card.classList.remove('in'); void card.offsetWidth; card.classList.add('in');

    // 动作按钮
    actions.innerHTML = '';
    actions.appendChild(btn('btn btn-primary', '生成分享图', () => openShare(ending)));
    if (ending.backup) actions.appendChild(btn('btn btn-ghost', '再看一张名片', () => swapAlumni(card)));
    if (ending.key === 'G') actions.appendChild(btn('btn btn-ghost', '加拍一场（+6 行动点）', () => { state.actionLeft = Math.min(GAME.actionMax, state.actionLeft + 6); state.settled = false; save(); show('screen-map'); renderAction(); }));
    actions.appendChild(btn('btn btn-ghost', '回到地图看看', () => show('screen-map')));
    actions.appendChild(btn('btn btn-ghost', '再选一次川传生活', () => { reset(); show('screen-setup'); renderChips(); }));
    actions.hidden = false;
  }

  function swapAlumni(card) {
    if (!card._backup) return;
    card.innerHTML = alumniCard(ALUMNI[card._backup]);
    card._currentAlumni = card._backup;
  }

  function btn(cls, text, onClick) {
    const b = document.createElement('button');
    b.type = 'button'; b.className = cls; b.textContent = text;
    b.addEventListener('click', onClick);
    return b;
  }

  function alumniInfo(a) {
    return `<div class="ending-alumni-info"><div class="ending-name">${a.name}</div><div class="ending-alumni-dir">${a.dir}</div><div class="ending-alumni-bio">${a.bio}</div></div>`;
  }
  function alumniCard(a) {
    return `<div class="ending-alumni-ph" data-slot="photo-alumni">${a.photo ? `<img src="${a.photo}" alt="${a.name}">` : '<span class="ph-tag">占位图 · 校友照片</span>'}</div>${alumniInfo(a)}`;
  }
  function alumniOf(ending) {
    return (ending.alumni && ending.alumni !== 'wall') ? ALUMNI[ending.alumni] : null;
  }
  function alumniLabel(ending) {
    if (ending.alumni === 'wall') return '解锁 · 特殊校友墙';
    const a = alumniOf(ending);
    return a ? '解锁校友 · ' + a.name : '川传生活，未完待续';
  }

  /* ---------------- 页 6：分享图 ---------------- */
  function openShare(ending) {
    $('#shareNick').textContent = state.nickname;
    $('#shareTitle').textContent = `${ending.title} · ${ending.name}`;
    $('#shareTagline').textContent = ending.share;
    $('#shareAttrs').innerHTML = ATTR_ORDER.map(attrBarRow).join('');
    const a = alumniOf(ending);
    $('#shareAlumni').innerHTML = (a && a.photo)
      ? `<img class="share-photo" src="${a.photo}" alt=""><span>${alumniLabel(ending)}</span>`
      : `<span>${alumniLabel(ending)}</span>`;
    openOverlay('screen-share');
  }

  function downloadShare() {
    const W = 900, H = 1200;
    const c = $('#shareCanvas');
    const ending = ENDINGS[state.ending] || ENDINGS.A;
    const a = alumniOf(ending);

    function drawCover(ctx, img, x, y, w, h, r) {
      const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
      if (!iw || !ih) return;
      const s = Math.max(w / iw, h / ih);
      const sw = w / s, sh = h / s, sx = (iw - sw) / 2, sy = (ih - sh) / 2;
      ctx.save();
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h);
      ctx.clip();
      ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
      ctx.restore();
    }

    const draw = (photo) => {
      c.width = W; c.height = H;
      const ctx = c.getContext('2d');
      const cw = W / 2;

      // 背景：暖白相纸
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, '#fbf7ee'); bg.addColorStop(1, '#f3ecdc');
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = 'rgba(224,168,62,0.6)'; ctx.lineWidth = 3; ctx.strokeRect(34, 34, W - 68, H - 68);
      ctx.strokeStyle = 'rgba(224,168,62,0.25)'; ctx.lineWidth = 1; ctx.strokeRect(48, 48, W - 96, H - 96);

      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(224,168,62,0.16)'; ctx.beginPath(); ctx.arc(cw, 120, 42, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#a9761e'; ctx.font = '26px "Microsoft YaHei",sans-serif'; ctx.fillText('校徽', cw, 130);
      ctx.fillStyle = '#3a3227'; ctx.font = 'bold 42px "SimSun","Songti SC",serif'; ctx.fillText('选择你的川传生活', cw, 215);
      ctx.fillStyle = '#857a66'; ctx.font = '24px "Microsoft YaHei",sans-serif'; ctx.fillText('四川传媒学院 · 迎新探索', cw, 252);

      ctx.fillStyle = '#3a3227'; ctx.font = 'bold 56px "Microsoft YaHei",sans-serif'; ctx.fillText(state.nickname, cw, 325);
      ctx.fillStyle = '#c9412f'; ctx.font = 'bold 44px "SimSun","Songti SC",serif'; ctx.fillText(ending.title, cw, 388);
      ctx.fillStyle = '#857a66'; ctx.font = '30px "Microsoft YaHei",sans-serif'; ctx.fillText('· ' + ending.name + ' ·', cw, 432);
      ctx.fillStyle = '#9a6a1a'; ctx.font = '28px "Microsoft YaHei",sans-serif'; ctx.fillText(ending.share, cw, 480);

      // 属性五格
      let y = 535;
      ATTR_ORDER.forEach((k) => {
        const at = ATTRS[k], v = state.attrs[k];
        ctx.textAlign = 'left';
        ctx.fillStyle = '#857a66'; ctx.font = '26px "Microsoft YaHei",sans-serif';
        ctx.fillText(`${at.icon} ${at.name}`, 130, y + 20);
        const bx = 320, bw = 420, bh = 22;
        for (let i = 0; i < GAME.attrMax; i++) {
          const x = bx + i * (bw / GAME.attrMax);
          ctx.fillStyle = i < v ? '#e0a83e' : 'rgba(90,72,46,0.12)';
          ctx.fillRect(x, y, bw / GAME.attrMax - 4, bh);
        }
        ctx.textAlign = 'right';
        ctx.fillStyle = '#a9761e'; ctx.font = 'bold 26px "Microsoft YaHei",sans-serif';
        ctx.fillText(v, 770, y + 20);
        y += 52;
      });

      // 校友照片 + 文字
      ctx.textAlign = 'center';
      const alumniText = alumniLabel(ending);
      if (photo) {
        drawCover(ctx, photo, cw - 75, 800, 150, 185, 12);
        ctx.fillStyle = '#3a3227'; ctx.font = 'bold 32px "Microsoft YaHei",sans-serif';
        ctx.fillText(alumniText, cw, 1042);
      } else {
        ctx.fillStyle = '#3a3227'; ctx.font = 'bold 32px "Microsoft YaHei",sans-serif';
        ctx.fillText(alumniText, cw, 850);
      }

      // 底部：二维码位 + 校训
      ctx.fillStyle = 'rgba(90,72,46,0.08)'; ctx.fillRect(cw - 52, H - 160, 104, 104);
      ctx.fillStyle = '#857a66'; ctx.font = '20px "Microsoft YaHei",sans-serif';
      ctx.fillText('二维码位', cw, H - 104);
      ctx.fillStyle = '#a9761e'; ctx.font = '22px "Microsoft YaHei",sans-serif';
      ctx.fillText('博学笃行 · 德艺双馨', cw, H - 34);

      try {
        c.toBlob((blob) => {
          if (!blob) { toast('生成失败，请长按分享卡片截图保存'); return; }
          const url = URL.createObjectURL(blob);
          const aEl = document.createElement('a');
          aEl.href = url; aEl.download = `川传生活_${state.nickname}.png`; aEl.click();
          setTimeout(() => URL.revokeObjectURL(url), 2000);
          toast('分享图已生成');
        }, 'image/png');
      } catch (e) {
        toast('生成失败，请长按分享卡片截图保存');
      }
    };

    if (a && a.photo) {
      const im = new Image();
      im.onload = () => draw(im);
      im.onerror = () => draw(null);
      im.src = a.photo;
    } else draw(null);
  }

  /* ---------------- 设置 ---------------- */
  function openSettings() {
    const d = document.createElement('div');
    d.className = 'settings-modal';
    d.innerHTML = `
      <div class="settings-box">
        <h3>设置</h3>
        <label class="set-row"><span>音效</span><button type="button" class="btn btn-ghost" id="setMute">${state.muted ? '🔇 关' : '🔊 开'}</button></label>
        <label class="set-row"><span>存档</span><span class="set-note">浏览器本地自动保存</span></label>
        <button type="button" class="btn btn-ghost" id="setReset">清除存档 · 重新开始</button>
        <button type="button" class="btn btn-primary" id="setClose">关闭</button>
      </div>`;
    document.body.appendChild(d);
    d.addEventListener('click', (e) => { if (e.target === d) closeSettings(); });
    $('#setClose').addEventListener('click', closeSettings);
    $('#setMute').addEventListener('click', () => { state.muted = !state.muted; save(); closeSettings(); updateMuteBtn(); syncBgm(); });
    $('#setReset').addEventListener('click', () => { reset(); closeSettings(); show('screen-setup'); renderChips(); });
  }
  function closeSettings() { const d = $('.settings-modal'); if (d) d.remove(); }
  function updateMuteBtn() { $('#btnMute').textContent = state.muted ? '🔇' : '🔊'; }

  /* ---------------- 事件绑定 ---------------- */
  function bind() {
    $('#btnSkipIntro').addEventListener('click', () => {
      ensureBgm(); syncBgm();
      if (state.started && !state.settled) { show('screen-map'); renderMap(); }
      else { reset(); show('screen-setup'); renderChips(); }
    });

    let nickTimer;
    $('#inputNickname').addEventListener('input', (e) => {
      state.nickname = e.target.value.trim() || '新川传人';
      clearTimeout(nickTimer);
      nickTimer = setTimeout(save, 300);
    });
    $('#inputNickname').addEventListener('blur', save);
    $('#btnEnterMap').addEventListener('click', () => {
      state.nickname = $('#inputNickname').value.trim() || '新川传人';
      $('#giftTip').hidden = false;
      show('screen-map'); renderMap();
      toast('🎁 迎新礼包贴士已收入手账');
    });

    $('#regionTabs').addEventListener('click', (e) => {
      const t = e.target.closest('.region-tab'); if (!t) return;
      setMapRegion(t.dataset.region);
    });

    // 地图图片加载 / 失败 / 窗口尺寸变化时重算热点位置
    $('#mapImg').addEventListener('load', () => { $('#mapPh').hidden = true; renderHotspots(); });
    $('#mapImg').addEventListener('error', () => { $('#mapPh').hidden = false; renderHotspots(); });
    let resizePending = false;
    window.addEventListener('resize', () => {
      if (resizePending) return;
      resizePending = true;
      requestAnimationFrame(() => { resizePending = false; if ($('#screen-map').classList.contains('active')) renderHotspots(); });
    });

    $('#vnNext').addEventListener('click', advanceEvent);
    $('#vnClose').addEventListener('click', closeEvent);

    $('#btnCollection').addEventListener('click', () => openCollection('landmark'));
    $('#btnCollectionM').addEventListener('click', () => openCollection('landmark'));
    $('#btnCloseCollection').addEventListener('click', () => closeOverlay('screen-collection'));
    $('#handbookTabs').addEventListener('click', (e) => { const t = e.target.closest('.hb-tab'); if (t) setCollectionTab(t.dataset.tab); });
    $('#hbSearch').addEventListener('input', (e) => renderCollection('tips', e.target.value.trim()));
    $('#hbGrid').addEventListener('click', (e) => { const c = e.target.closest('.hb-card'); if (c) c.classList.toggle('flip'); });

    $('#btnSettle').addEventListener('click', settle);
    $('#btnSettleM').addEventListener('click', settle);
    $('#endingSlates').addEventListener('click', () => { if (endingSkip) endingSkip(); });
    $('#btnEasterClose').addEventListener('click', closeEaster);
    $('#screen-easter').addEventListener('click', (e) => { if (e.target === $('#screen-easter')) closeEaster(); });

    $('#btnMute').addEventListener('click', () => { state.muted = !state.muted; save(); updateMuteBtn(); syncBgm(); });
    $('#btnSettings').addEventListener('click', openSettings);

    // 结束页的按钮（生成分享图 / 再看一张 / 加拍一场 / 回地图 / 再选一次）
    // 由 revealAlumni 动态生成并绑定；此处不再绑定静态占位按钮。

    $('#btnDownload').addEventListener('click', downloadShare);
    $('#btnShareClose').addEventListener('click', () => closeOverlay('screen-share'));

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { closeOverlay('screen-event'); closeOverlay('screen-collection'); closeOverlay('screen-share'); closeEaster(); closeSettings(); }
    });

    initMapGestures();
    updateMuteBtn();
  }

  /* ---------------- 启动 ---------------- */
  bind();
  initIntro();
})();
