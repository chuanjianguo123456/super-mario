/* WebAudio 合成：音效 + 原创芯片音乐（无外部素材） */
var Sound = (function () {
  var ac = null, master = null, musicGain = null, sfxGain = null;
  var enabled = true, ready = false;

  function init() {
    if (ready) return true;
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ac = new AC();
      master = ac.createGain();
      master.gain.value = 0.5;
      master.connect(ac.destination);
      musicGain = ac.createGain();
      musicGain.gain.value = 0.22;
      musicGain.connect(master);
      sfxGain = ac.createGain();
      sfxGain.gain.value = 0.7;
      sfxGain.connect(master);
      ready = true;
      return true;
    } catch (e) { return false; }
  }

  function resume() {
    if (!ready && !init()) return;
    if (ac.state === 'suspended') ac.resume();
  }

  var NOTES = { 'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5, 'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11 };

  function freq(name) {
    if (!name || name === '-') return 0;
    var m = /^([A-G]#?)(\d)$/.exec(name);
    if (!m) return 0;
    var semi = NOTES[m[1]] + (parseInt(m[2], 10) + 1) * 12; // C4 = MIDI 60
    return 440 * Math.pow(2, (semi - 69) / 12);
  }

  /** 单音：波形、频率、时长、音量、目标节点、可选滑音终点 */
  function tone(type, f, dur, vol, dest, t0, fEnd) {
    if (!ready || !enabled || !f) return;
    t0 = t0 || ac.currentTime;
    var o = ac.createOscillator();
    var g = ac.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f, t0);
    if (fEnd) o.frequency.exponentialRampToValueAtTime(Math.max(20, fEnd), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(dest || sfxGain);
    o.start(t0); o.stop(t0 + dur + 0.02);
  }

  function noise(dur, vol, t0, hp) {
    if (!ready || !enabled) return;
    t0 = t0 || ac.currentTime;
    var n = Math.floor(ac.sampleRate * dur);
    var buf = ac.createBuffer(1, n, ac.sampleRate);
    var d = buf.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    var src = ac.createBufferSource();
    src.buffer = buf;
    var g = ac.createGain();
    g.gain.value = vol;
    var f = ac.createBiquadFilter();
    f.type = 'highpass'; f.frequency.value = hp || 800;
    src.connect(f); f.connect(g); g.connect(sfxGain);
    src.start(t0);
  }

  /** 播放音符序列 [[音名, 起始秒, 时长, 音量?]] */
  function seq(type, notes, dest) {
    if (!ready || !enabled) return;
    var t0 = ac.currentTime;
    for (var i = 0; i < notes.length; i++) {
      var n = notes[i];
      tone(type, freq(n[0]), n[2], n[3] || 0.3, dest || sfxGain, t0 + n[1]);
    }
  }

  /* ---------- 音效 ---------- */
  var sfx = {
    jump: function () { if (ready) tone('square', 380, 0.16, 0.28, sfxGain, 0, 780); },
    jumpBig: function () { if (ready) tone('square', 300, 0.22, 0.3, sfxGain, 0, 820); },
    coin: function () { seq('square', [['B5', 0, 0.07, 0.3], ['E6', 0.07, 0.22, 0.28]]); },
    stomp: function () { if (ready) { tone('square', 260, 0.1, 0.3, sfxGain, 0, 90); noise(0.08, 0.12, 0, 1200); } },
    bump: function () { if (ready) tone('triangle', 180, 0.09, 0.3, sfxGain, 0, 110); },
    brick: function () { if (ready) { noise(0.22, 0.3, 0, 500); tone('square', 200, 0.12, 0.18, sfxGain, 0, 60); } },
    powerup: function () {
      seq('square', [['C4', 0, 0.06, 0.26], ['G4', 0.06, 0.06, 0.26], ['C5', 0.12, 0.06, 0.26],
                     ['E5', 0.18, 0.06, 0.26], ['G5', 0.24, 0.06, 0.26], ['C6', 0.30, 0.16, 0.26]]);
    },
    comet: function () {
      seq('square', [['D5', 0, 0.05, 0.22], ['A5', 0.045, 0.06, 0.22], ['E6', 0.095, 0.14, 0.24]]);
      if (ready) tone('triangle', 170, 0.12, 0.11, sfxGain, 0, 340);
    },
    powerdown: function () {
      seq('square', [['C5', 0, 0.07, 0.26], ['G4', 0.07, 0.07, 0.26], ['E4', 0.14, 0.07, 0.26],
                     ['C4', 0.21, 0.16, 0.26]]);
    },
    fire: function () { if (ready) tone('sawtooth', 900, 0.12, 0.16, sfxGain, 0, 220); },
    kick: function () { if (ready) { tone('square', 520, 0.08, 0.22, sfxGain, 0, 200); noise(0.06, 0.1, 0, 1500); } },
    oneup: function () {
      seq('square', [['E5', 0, 0.1, 0.26], ['G5', 0.1, 0.1, 0.26], ['E6', 0.2, 0.1, 0.26],
                     ['C6', 0.3, 0.1, 0.26], ['D6', 0.4, 0.1, 0.26], ['G6', 0.5, 0.2, 0.26]]);
    },
    pause: function () { if (ready) tone('square', 660, 0.07, 0.2); },
    flag: function () {
      if (!ready) return;
      var t0 = ac.currentTime;
      for (var i = 0; i < 14; i++) tone('square', 300 + i * 90, 0.05, 0.18, sfxGain, t0 + i * 0.035);
    },
    death: function () {
      stopMusic();
      seq('square', [['C5', 0, 0.1, 0.3], ['C5', 0.15, 0.1, 0.3], ['C5', 0.3, 0.1, 0.3],
                     ['G4', 0.45, 0.12, 0.3], ['E4', 0.6, 0.12, 0.3], ['A4', 0.75, 0.12, 0.3],
                     ['B4', 0.9, 0.12, 0.3], ['A4', 1.05, 0.12, 0.3], ['G#4', 1.2, 0.3, 0.3]]);
    },
    clear: function () {
      stopMusic();
      seq('square', [['C4', 0, 0.12, 0.3], ['E4', 0.12, 0.12, 0.3], ['G4', 0.24, 0.12, 0.3],
                     ['C5', 0.36, 0.12, 0.3], ['E5', 0.48, 0.12, 0.3], ['G5', 0.6, 0.12, 0.3],
                     ['E5', 0.72, 0.12, 0.3], ['G#4', 0.9, 0.12, 0.3], ['C5', 1.02, 0.12, 0.3],
                     ['D#5', 1.14, 0.12, 0.3], ['G#5', 1.26, 0.12, 0.3], ['C6', 1.38, 0.3, 0.3]]);
      seq('triangle', [['C2', 0, 0.35, 0.3], ['G#1', 0.9, 0.35, 0.3], ['C2', 1.38, 0.4, 0.3]]);
    },
    gameover: function () {
      stopMusic();
      seq('square', [['C5', 0, 0.18, 0.3], ['G4', 0.2, 0.18, 0.3], ['E4', 0.4, 0.18, 0.3],
                     ['A4', 0.6, 0.14, 0.3], ['B4', 0.76, 0.14, 0.3], ['A4', 0.92, 0.14, 0.3],
                     ['G#4', 1.08, 0.2, 0.3], ['A#4', 1.3, 0.2, 0.3], ['G#4', 1.52, 0.2, 0.3],
                     ['G4', 1.74, 0.2, 0.3], ['F4', 1.94, 0.2, 0.3], ['C4', 2.14, 0.5, 0.3]]);
    },
    warning: function () { if (ready) tone('triangle', 880, 0.08, 0.2); }
  };

  /* ---------- 背景音乐（原创旋律，8 分音符步进） ---------- */
  function P(s) { return s.trim().split(/\s+/); }

  var TRACKS = {
    overworld: {
      step: 0.1875, // 160 BPM 的 8 分音符
      lead: P(`
        E5 -  G5 -  C5 -  E5 -   C5 -  E5 -  A4 -  C5 -
        A4 -  C5 -  F4 -  A4 -   B4 -  D5 -  G4 -  B4 -
        G5 F5 E5 D5 C5 -  E5 -   A5 G5 F5 E5 A4 -  C5 -
        F5 E5 D5 C5 F4 -  A4 -   D5 -  B4 -  G4 -  -  -
      `),
      bass: P(`
        C3 -  C3 -  G2 -  C3 -   A2 -  A2 -  E2 -  A2 -
        F2 -  F2 -  C3 -  F2 -   G2 -  G2 -  D3 -  G2 -
        C3 -  C3 -  G2 -  C3 -   A2 -  A2 -  E2 -  A2 -
        F2 -  F2 -  C3 -  F2 -   G2 -  D3 -  G2 -  -  -
      `)
    },
    underground: {
      step: 0.2,
      lead: P(`
        A4 -  -  C5 -  -  A4 -   E4 -  -  G4 -  -  E4 -
        A4 -  C5 -  E5 -  D5 -   C5 -  -  -  -  -  -  -
        F4 -  -  A4 -  -  F4 -   C4 -  -  E4 -  -  C4 -
        G4 -  B4 -  D5 -  C5 -   A4 -  -  -  -  -  -  -
      `),
      bass: P(`
        A2 -  A2 -  A2 -  A2 -   E2 -  E2 -  E2 -  E2 -
        A2 -  A2 -  A2 -  A2 -   A2 -  -  -  A2 -  -  -
        F2 -  F2 -  F2 -  F2 -   C2 -  C2 -  C2 -  C2 -
        G2 -  G2 -  G2 -  G2 -   A2 -  -  -  A2 -  -  -
      `)
    },
    sky: {
      step: 0.16,
      lead: P(`
        C5 -  D5 -  E5 -  G5 -   E5 -  D5 -  C5 -  D5 -
        E5 -  G5 -  A5 -  G5 -   E5 -  D5 -  C5 -  -  -
        F5 -  E5 -  D5 -  C5 -   D5 -  E5 -  F5 -  G5 -
        A5 -  G5 -  F5 -  E5 -   D5 -  C5 -  -  -  -  -
      `),
      bass: P(`
        C3 -  G2 -  C3 -  G2 -   A2 -  E2 -  A2 -  E2 -
        F2 -  C3 -  F2 -  C3 -   G2 -  D3 -  G2 -  D3 -
        C3 -  G2 -  C3 -  G2 -   A2 -  E2 -  A2 -  E2 -
        F2 -  C3 -  G2 -  D3 -   C3 -  G2 -  C3 -  -  -
      `)
    }
  };

  var mus = { on: false, track: null, next: 0, step: 0, speed: 1 };

  function startMusic(name) {
    if (!ready || !enabled) return;
    var tr = TRACKS[name] || TRACKS.overworld;
    if (mus.on && mus.track === tr) return;
    mus.on = true; mus.track = tr; mus.step = 0;
    mus.next = ac.currentTime + 0.06;
  }

  function stopMusic() { mus.on = false; mus.track = null; }

  function setSpeed(s) { mus.speed = s; }

  /** 每帧调用：向前调度 0.2 秒内的音符 */
  function update() {
    if (!ready || !mus.on || !mus.track || !enabled) return;
    var tr = mus.track;
    var dur = tr.step / mus.speed;
    var horizon = ac.currentTime + 0.2;
    var guard = 0;
    while (mus.next < horizon && guard++ < 64) {
      var i = mus.step % tr.lead.length;
      var ln = tr.lead[i];
      if (ln !== '-') tone('square', freq(ln), dur * 0.9, 0.3, musicGain, mus.next);
      var bi = mus.step % tr.bass.length;
      var bn = tr.bass[bi];
      if (bn !== '-') tone('triangle', freq(bn), dur * 1.4, 0.4, musicGain, mus.next);
      mus.next += dur;
      mus.step++;
    }
  }

  function toggle() {
    enabled = !enabled;
    if (ready) master.gain.value = enabled ? 0.5 : 0;
    return enabled;
  }

  function isEnabled() { return enabled; }

  return {
    init: init, resume: resume, update: update,
    sfx: sfx, startMusic: startMusic, stopMusic: stopMusic,
    setSpeed: setSpeed, toggle: toggle, isEnabled: isEnabled
  };
})();
