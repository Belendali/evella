/* ═══════════════════════════════════════════════════
   ambient.js — 背景音床，全部现场合成

   没有任何采样文件，三层都是 Web Audio 生成的：
     stream  滤波噪声 + 慢速起伏      →  溪水
     pad     四个失谐振荡器的持续音   →  轻音乐
     birds   不规则调度的频率扫掠     →  鸟鸣

   合成的好处不只是没有版权问题 —— 它不会循环。
   采样再长也会露出接缝，第 30 天用户就听出来了。
   ═══════════════════════════════════════════════════ */

const Ambient = (() => {
  let ctx = null, master = null, nodes = [], timers = [], on = false;

  const rnd = (a, b) => a + Math.random() * (b - a);

  function ensure() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  /* ── 溪水：两条噪声带，一条低沉一条细碎 ───────── */
  function stream(out) {
    const c = ctx;
    const len = c.sampleRate * 4;
    const buf = c.createBuffer(1, len, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;

    const mk = (freq, q, gain, lfoRate, lfoDepth) => {
      const src = c.createBufferSource();
      src.buffer = buf; src.loop = true;
      const bp = c.createBiquadFilter();
      bp.type = 'bandpass'; bp.frequency.value = freq; bp.Q.value = q;
      const g = c.createGain(); g.gain.value = gain;

      // 慢速起伏 —— 水流不是恒定的，恒定的就变成白噪声了
      const lfo = c.createOscillator();
      lfo.frequency.value = lfoRate;
      const lg = c.createGain(); lg.gain.value = lfoDepth;
      lfo.connect(lg); lg.connect(g.gain);

      src.connect(bp); bp.connect(g); g.connect(out);
      src.start(); lfo.start();
      nodes.push(src, lfo);
    };

    mk(520, 0.6, 0.013, 0.07, 0.007);   // 主体水声
    mk(2600, 1.4, 0.005, 0.11, 0.003);  // 表面的细碎声
  }

  /* ── 气垫音（当前未启用：太吵。想加回来在 start() 里接上 pad(master)）── */
  function pad(out) {
    const c = ctx;
    [87.31, 130.81, 220.00, 293.66].forEach((f, i) => {   // F2 C3 A3 D4
      const osc = c.createOscillator();
      osc.type = i < 2 ? 'sine' : 'triangle';
      osc.frequency.value = f;

      // 每个音自己漂一点点，合起来才不像电子琴
      const drift = c.createOscillator();
      drift.frequency.value = rnd(0.03, 0.08);
      const dg = c.createGain(); dg.gain.value = rnd(0.15, 0.4);
      drift.connect(dg); dg.connect(osc.frequency);

      const lp = c.createBiquadFilter();
      lp.type = 'lowpass'; lp.frequency.value = 900; lp.Q.value = 0.4;

      const g = c.createGain();
      g.gain.value = 0;
      // 各自呼吸，周期都不一样，所以永远不会同时到顶
      const swell = c.createOscillator();
      swell.frequency.value = rnd(0.018, 0.035);
      const sg = c.createGain(); sg.gain.value = 0.011;
      swell.connect(sg); sg.connect(g.gain);
      g.gain.value = 0.013;

      const pan = c.createStereoPanner ? c.createStereoPanner() : null;
      if (pan) pan.pan.value = rnd(-0.5, 0.5);

      osc.connect(lp); lp.connect(g);
      if (pan) { g.connect(pan); pan.connect(out); } else g.connect(out);
      osc.start(); drift.start(); swell.start();
      nodes.push(osc, drift, swell);
    });
  }

  /* ── 鸟鸣：短促扫频，间隔随机，远近不一 ───────── */
  function chirp(out, near) {
    const c = ctx, t0 = c.currentTime + 0.02;
    const n = near ? 3 : 2;
    const base = near ? rnd(2400, 3000) : rnd(3000, 3600);
    const pan = c.createStereoPanner ? c.createStereoPanner() : null;
    if (pan) pan.pan.value = rnd(-0.8, 0.8);
    const dest = pan ? (pan.connect(out), pan) : out;

    for (let i = 0; i < n; i++) {
      const t = t0 + i * rnd(0.07, 0.1);
      const osc = c.createOscillator(); osc.type = 'sine';
      const g = c.createGain();
      osc.frequency.setValueAtTime(base, t);
      osc.frequency.exponentialRampToValueAtTime(base * rnd(1.4, 1.7), t + 0.035);
      osc.frequency.exponentialRampToValueAtTime(base * 0.85, t + 0.07);
      const peak = near ? 0.020 : 0.008;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(peak, t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
      osc.connect(g); g.connect(dest);
      osc.start(t); osc.stop(t + 0.1);
    }
  }

  function scheduleBirds(out) {
    const next = () => {
      if (!on) return;
      chirp(out, Math.random() < 0.35);
      timers.push(setTimeout(next, rnd(4500, 12000)));   // 不规则 —— 规律的鸟叫会让人发疯
    };
    timers.push(setTimeout(next, rnd(1500, 4000)));
  }

  /* ── 开关 ───────────────────────────────────── */
  function start() {
    if (on) return;
    ensure(); on = true;
    nodes = [];                 // 每次开都用一份新的清单，
    master = ctx.createGain();  // 免得上一次的淡出把这一次的节点也收走
    master.gain.value = 0;
    master.connect(ctx.destination);
    master.gain.linearRampToValueAtTime(1, ctx.currentTime + 4);   // 慢慢进来

    stream(master); scheduleBirds(master);   // 气垫音去掉了 —— 太吵，压着人声
  }

  function stop() {
    if (!on) return;
    on = false;
    timers.forEach(clearTimeout); timers = [];
    if (master) {
      const m = master, dying = nodes, t = ctx.currentTime;
      nodes = [];
      m.gain.cancelScheduledValues(t);
      m.gain.setValueAtTime(m.gain.value, t);
      m.gain.linearRampToValueAtTime(0, t + 1.6);
      setTimeout(() => {
        dying.forEach(n => { try { n.stop(); } catch (_) {} });
        try { m.disconnect(); } catch (_) {}
      }, 1800);
    }
    master = null;
  }

  const toggle = () => (on ? stop() : start(), on);
  const active = () => on;
  const duck = (v) => { if (master) master.gain.setTargetAtTime(v, ctx.currentTime, 0.4); };

  return { start, stop, toggle, active, duck, chirp: () => on && master && chirp(master, true) };
})();
