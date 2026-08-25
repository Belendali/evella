/* ═══════════════════════════════════════════════════
   player.js — 歌词式轮播播放器

   有音频文件就用音频驱动（audio.currentTime 落在哪一句），
   没有就用 tracks.js 里的 sec 跑计时器。两条路走同一套 UI，
   音频丢进 audio/ 目录不用改任何代码。
   ═══════════════════════════════════════════════════ */

(() => {
  const T = TRACKS[window.TRACK || 1];
  const $ = (s) => document.querySelector(s);

  /* 累计落点：第 i 句从 marks[i] 开始 */
  const marks = [];
  let acc = 0;
  T.lines.forEach(([, sec]) => { marks.push(acc); acc += sec; });
  const fallbackTotal = acc;

  const ICON = {
    back:  '<svg viewBox="0 0 24 24"><path d="M15 4 7 12l8 8"/></svg>',
    mix:   '<svg viewBox="0 0 24 24"><path d="M4 8h16M4 16h16"/><circle cx="10" cy="8" r="2.6" fill="#14100E"/><circle cx="16" cy="16" r="2.6" fill="#14100E"/></svg>',
    loop:  '<svg viewBox="0 0 24 24"><path d="M4 9h13a3 3 0 0 1 3 3M20 15H7a3 3 0 0 1-3-3M7 6 4 9l3 3m10 0 3 3-3 3"/></svg>',
    heart: '<svg viewBox="0 0 24 24"><path d="M12 20s-8-5-8-10.2A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 8 2.8C20 15 12 20 12 20z"/></svg>',
    b10:   '<svg viewBox="0 0 24 24"><path d="M12 5a7 7 0 1 1-6.5 4.5M12 5 8.5 2.5M12 5 8.5 8"/></svg>',
    f10:   '<svg viewBox="0 0 24 24"><path d="M12 5a7 7 0 1 0 6.5 4.5M12 5l3.5-2.5M12 5l3.5 3"/></svg>',
    note:  '<svg viewBox="0 0 24 24"><path d="M9 18V6l10-2v12"/><ellipse cx="6.6" cy="18" rx="2.4" ry="2"/><ellipse cx="16.6" cy="16" rx="2.4" ry="2"/></svg>',
    play:  '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>',
    pause: '<svg viewBox="0 0 24 24"><rect x="7" y="5" width="3.6" height="14" rx="1.4"/><rect x="13.4" y="5" width="3.6" height="14" rx="1.4"/></svg>',
    share: '<svg viewBox="0 0 24 24"><path d="M12 15V3m0 0-4 4m4-4 4 4M4 14v5.2A.8.8 0 0 0 4.8 20h14.4a.8.8 0 0 0 .8-.8V14"/></svg>'
  };

  document.title = 'Wren · ' + T.title;

  $('#phone').innerHTML = `
    <div class="scene">
      <div class="shot" style="background-image:url('${T.cover}')"></div>
      <div class="dim"></div><div class="vig"></div>
    </div>
    <div class="grain"></div>

    <div class="statusbar"><span id="clock">9:41</span><span class="g"><i></i><i></i><i></i></span></div>

    <div class="topbar">
      <div class="circ" id="back">${ICON.back}</div>
      <div class="name">Echo</div>
      <div class="circ" id="mix">${ICON.mix}</div>
    </div>

    <div class="lyrics" id="lyrics"></div>

    <div class="bottom">
      <div class="titlerow">
        <div class="t">${T.title}</div>
        <div class="circ" id="loop">${ICON.loop}</div>
      </div>
      <div class="scrub" id="scrub">
        <div class="fill" id="fill"></div><div class="knob" id="knob"></div>
      </div>
      <div class="times"><span id="tl">0:00</span><span id="tr">-0:00</span></div>
      <div class="transport">
        <div class="ic" id="heart">${ICON.heart}</div>
        <div class="ic" id="back10">${ICON.b10}</div>
        <button class="big" id="play">${ICON.pause}</button>
        <div class="ic" id="fwd10">${ICON.f10}</div>
        <div class="ic" id="note">${ICON.note}</div>
      </div>
      <div class="share" id="share">${ICON.share}<span>Share</span></div>
      <div class="homebar"></div>
    </div>
    <div class="hint" id="hint"></div>
  `;

  $('#clock').textContent = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

  /* ── 歌词轮播 ───────────────────────────── */
  const box = $('#lyrics');
  let cur = -1;
  function renderAt(i) {
    if (i === cur) return;
    cur = i;
    box.innerHTML = '';
    const add = (idx, cls) => {
      if (idx < 0 || idx >= T.lines.length) return;
      const d = document.createElement('div');
      d.className = 'line ' + cls;
      d.textContent = T.lines[idx][0];
      box.append(d);
      requestAnimationFrame(() => d.classList.add(cls));
    };
    add(i - 1, 'prev'); add(i, 'now'); add(i + 1, 'next');
  }
  const lineAt = (t) => {
    let i = 0;
    for (let k = 0; k < marks.length; k++) if (t >= marks[k] * scale()) i = k;
    return i;
  };

  /* ── 音频 or 计时器 ─────────────────────── */
  const audio = new Audio();
  audio.preload = 'auto';
  let hasAudio = false, total = fallbackTotal, t0 = 0, elapsed = 0, playing = false, raf = null;
  const scale = () => hasAudio && total ? total / fallbackTotal : 1;

  audio.addEventListener('loadedmetadata', () => {
    if (audio.duration && isFinite(audio.duration)) { hasAudio = true; total = audio.duration; }
  });
  audio.addEventListener('error', () => { hasAudio = false; total = fallbackTotal; note('No audio yet — running on script timing'); });
  audio.src = T.audio;

  const now = () => hasAudio ? audio.currentTime : (elapsed + (playing ? (Date.now() - t0) / 1000 : 0));
  const fmt = (s) => { s = Math.max(0, Math.round(s)); return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`; };

  function tick() {
    const t = Math.min(now(), total);
    const r = total ? t / total : 0;
    $('#fill').style.width = (r * 100) + '%';
    $('#knob').style.left = (r * 100) + '%';
    $('#tl').textContent = fmt(t);
    $('#tr').textContent = '-' + fmt(total - t);
    renderAt(lineAt(t));
    if (t >= total) { pause(); if (loopOn) { seek(0); play(); } }
  }

  function play() {
    playing = true; t0 = Date.now();
    $('#play').innerHTML = ICON.pause;
    if (hasAudio) {
      // 浏览器不给手势就不让放 —— 别假装在播，退回暂停态等一次点击
      audio.play().catch(() => {
        playing = false;
        $('#play').innerHTML = ICON.play;
        note('Tap to play');
      });
    }
    if (!raf) raf = setInterval(tick, 100);
    if (ambientOn) Ambient.start();
  }
  function pause() {
    if (!playing) return;
    playing = false; elapsed = now();
    $('#play').innerHTML = ICON.play;
    if (hasAudio) audio.pause();
    Ambient.stop();
  }
  function seek(t) {
    t = Math.max(0, Math.min(total, t));
    elapsed = t; t0 = Date.now();
    if (hasAudio) audio.currentTime = t;
    cur = -1;
  }
  function note(msg) {
    const h = $('#hint'); h.textContent = msg; h.classList.add('on');
    clearTimeout(h._t); h._t = setTimeout(() => h.classList.remove('on'), 3200);
  }

  let loopOn = false;
  let ambientOn = true;   // 默认开着 —— 它小到不开反而觉得干
  $('#play').onclick = () => playing ? pause() : play();
  $('#back10').onclick = () => seek(now() - 10);
  $('#fwd10').onclick = () => seek(now() + 10);
  $('#heart').onclick = () => {};
  $('#loop').onclick = (e) => { loopOn = !loopOn; e.currentTarget.style.opacity = loopOn ? '1' : '.55'; };
  $('#loop').style.opacity = '.55';
  $('#note').onclick = (e) => {
    ambientOn = !ambientOn;
    if (ambientOn && playing) Ambient.start(); else Ambient.stop();
    note(ambientOn ? 'Stream, birds, a little music' : 'Ambient off');
  };
  $('#mix').onclick = () => note('Voice & ambient settings');
  $('#back').onclick = () => history.length > 1 ? history.back() : location.href = '../../';
  $('#scrub').onclick = (e) => {
    const b = e.currentTarget.getBoundingClientRect();
    seek(((e.clientX - b.left) / b.width) * total);
  };
  $('#share').onclick = async () => {
    const url = location.href;
    try {
      if (navigator.share) await navigator.share({ title: 'Wren · ' + T.title, url });
      else { await navigator.clipboard.writeText(url); note('Link copied'); }
    } catch (_) {}
  };

  /* 桌面上窗口不够高就整体缩放 */
  const fit = () => {
    const p = $('#phone');
    if (window.innerWidth <= 430) { p.style.transform = ''; return; }
    const k = Math.min(1, (window.innerHeight - 40) / 844);
    p.style.transform = k < 1 ? `scale(${k.toFixed(3)})` : '';
  };
  fit(); window.addEventListener('resize', fit);

  renderAt(0);
  tick();
  raf = setInterval(tick, 100);
  // 元数据到位再试一次自动播；被拦就等用户点任意位置
  const kick = () => { if (!playing) play(); };
  audio.addEventListener('canplay', kick, { once: true });
  setTimeout(kick, 600);
  document.addEventListener('click', (e) => {
    if (!playing && !e.target.closest('#play,#scrub,.circ,.ic,.share')) play();
  });
})();
