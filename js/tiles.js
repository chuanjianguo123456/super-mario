/* 瓦片与背景装饰：程序化绘制 + 离屏缓存 */
var Tiles = (function () {
  var T = 16;

  var THEMES = {
    overworld: {
      sky: '#5c94fc',
      ground: '#c84c0c', groundLo: '#8c2800', groundHi: '#fc9838',
      brick: '#c84c0c', brickLo: '#8c2800', brickHi: '#fc9838', mortar: '#000000',
      block: '#e39b18', blockLo: '#96590c', blockHi: '#fcd8a8',
      used: '#a04800', usedLo: '#6a2800', usedHi: '#c86428',
      stone: '#9c9c9c', stoneLo: '#5a5a5a', stoneHi: '#e4e4e4',
      pipe: '#00a800', pipeLo: '#005800', pipeHi: '#58d854',
      hill: '#00a800', hillLo: '#006800',
      cloud: '#fcfcfc', cloudLo: '#c8e0fc'
    },
    underground: {
      sky: '#000000',
      ground: '#0088f8', groundLo: '#003c9c', groundHi: '#80d0f8',
      brick: '#0088f8', brickLo: '#003c9c', brickHi: '#80d0f8', mortar: '#000000',
      block: '#e39b18', blockLo: '#96590c', blockHi: '#fcd8a8',
      used: '#0058a8', usedLo: '#002c6c', usedHi: '#3898e0',
      stone: '#8888a8', stoneLo: '#484868', stoneHi: '#d0d0e8',
      pipe: '#00a800', pipeLo: '#005800', pipeHi: '#58d854',
      hill: '#004058', hillLo: '#002838',
      cloud: '#3cbcfc', cloudLo: '#0070ec'
    },
    sky: {
      sky: '#78b8f8',
      ground: '#f8b800', groundLo: '#a05000', groundHi: '#fce0a0',
      brick: '#f88800', brickLo: '#a03c00', brickHi: '#fcc888', mortar: '#301800',
      block: '#e39b18', blockLo: '#96590c', blockHi: '#fcd8a8',
      used: '#a04800', usedLo: '#6a2800', usedHi: '#c86428',
      stone: '#c0d8f8', stoneLo: '#7898c8', stoneHi: '#f0f8ff',
      pipe: '#00a800', pipeLo: '#005800', pipeHi: '#58d854',
      hill: '#38a8fc', hillLo: '#1878c8',
      cloud: '#fcfcfc', cloudLo: '#d8ecfc'
    },
    castle: {
      sky: '#000000',
      ground: '#787878', groundLo: '#383838', groundHi: '#b8b8b8',
      brick: '#787878', brickLo: '#383838', brickHi: '#b8b8b8', mortar: '#181818',
      block: '#e39b18', blockLo: '#96590c', blockHi: '#fcd8a8',
      used: '#585858', usedLo: '#282828', usedHi: '#888888',
      stone: '#686868', stoneLo: '#383838', stoneHi: '#a8a8a8',
      pipe: '#00a800', pipeLo: '#005800', pipeHi: '#58d854',
      hill: '#484848', hillLo: '#282828',
      cloud: '#585858', cloudLo: '#383838'
    }
  };

  // '?' 上的问号图案（8x8，居中）
  var QMARK = [
    '..####..',
    '.##..##.',
    '.##..##.',
    '....##..',
    '...##...',
    '...##...',
    '........',
    '...##...'
  ];

  function bevel(c, x, y, w, h, hi, lo) {
    c.fillStyle = hi;
    c.fillRect(x, y, w, 1);
    c.fillRect(x, y, 1, h);
    c.fillStyle = lo;
    c.fillRect(x, y + h - 1, w, 1);
    c.fillRect(x + w - 1, y, 1, h);
  }

  function drawGround(c, t) {
    c.fillStyle = t.ground; c.fillRect(0, 0, T, T);
    // 2x2 小砖，带高光与阴影
    for (var by = 0; by < 2; by++) {
      for (var bx = 0; bx < 2; bx++) {
        bevel(c, bx * 8, by * 8, 8, 8, t.groundHi, t.groundLo);
      }
    }
    c.fillStyle = t.groundLo;
    c.fillRect(0, 7, T, 2);
    c.fillRect(7, 0, 2, T);
  }

  function drawBrick(c, t) {
    c.fillStyle = t.brick; c.fillRect(0, 0, T, T);
    c.fillStyle = t.mortar;
    c.fillRect(0, 0, T, 1);
    c.fillRect(0, 5, T, 1);
    c.fillRect(0, 10, T, 1);
    c.fillRect(0, 15, T, 1);
    // 错缝竖线
    c.fillRect(7, 1, 1, 4);
    c.fillRect(3, 6, 1, 4);
    c.fillRect(11, 6, 1, 4);
    c.fillRect(7, 11, 1, 4);
    c.fillStyle = t.brickHi;
    c.fillRect(0, 1, T, 1);
    c.fillRect(0, 6, T, 1);
    c.fillRect(0, 11, T, 1);
  }

  function drawBlock(c, t, frame) {
    c.fillStyle = t.block; c.fillRect(0, 0, T, T);
    bevel(c, 0, 0, T, T, t.blockHi, t.blockLo);
    c.fillStyle = t.blockLo;
    // 四角铆钉
    var pts = [[2, 2], [13, 2], [2, 13], [13, 13]];
    for (var i = 0; i < pts.length; i++) c.fillRect(pts[i][0], pts[i][1], 1, 1);
    // 问号：三帧亮度变化
    var markCol = frame === 0 ? '#fcfcfc' : (frame === 1 ? '#fce0a0' : '#c88018');
    for (var y = 0; y < 8; y++) {
      for (var x = 0; x < 8; x++) {
        if (QMARK[y][x] !== '#') continue;
        c.fillStyle = t.blockLo;
        c.fillRect(4 + x + 1, 4 + y + 1, 1, 1);
        c.fillStyle = markCol;
        c.fillRect(4 + x, 4 + y, 1, 1);
      }
    }
  }

  function drawUsed(c, t) {
    c.fillStyle = t.used; c.fillRect(0, 0, T, T);
    bevel(c, 0, 0, T, T, t.usedHi, t.usedLo);
    c.fillStyle = t.usedLo;
    var pts = [[2, 2], [13, 2], [2, 13], [13, 13]];
    for (var i = 0; i < pts.length; i++) c.fillRect(pts[i][0], pts[i][1], 2, 2);
  }

  function drawStone(c, t) {
    c.fillStyle = t.stone; c.fillRect(0, 0, T, T);
    bevel(c, 0, 0, T, T, t.stoneHi, t.stoneLo);
    c.fillStyle = t.stoneLo;
    c.fillRect(1, 14, 14, 1);
    c.fillStyle = t.stoneHi;
    c.fillRect(2, 2, 12, 1);
  }

  function drawPipe(c, t, kind) {
    var isTop = (kind === 'L' || kind === 'R');
    var isLeft = (kind === 'L' || kind === 'l');
    c.fillStyle = t.pipe;
    if (isTop) {
      c.fillRect(0, 0, T, 6);
      c.fillRect(isLeft ? 2 : 0, 6, 14, T - 6);
      c.fillStyle = t.pipeHi;
      c.fillRect(0, 0, T, 1);
      c.fillRect(isLeft ? 2 : 0, 2, 3, 4);
      c.fillRect(isLeft ? 4 : 2, 7, 3, T - 7);
      c.fillStyle = t.pipeLo;
      c.fillRect(0, 5, T, 1);
      if (isLeft) { c.fillRect(0, 6, 2, T - 6); c.fillRect(2, 6, 1, T - 6); }
      else { c.fillRect(T - 2, 0, 2, T); }
      if (isLeft) { c.fillStyle = t.pipeLo; c.fillRect(0, 0, 1, 6); }
    } else {
      c.fillRect(isLeft ? 2 : 0, 0, 14, T);
      c.fillStyle = t.pipeHi;
      c.fillRect(isLeft ? 4 : 2, 0, 3, T);
      c.fillStyle = t.pipeLo;
      if (isLeft) { c.fillRect(0, 0, 2, T); c.fillRect(2, 0, 1, T); }
      else { c.fillRect(T - 2, 0, 2, T); c.fillRect(T - 3, 0, 1, T); }
    }
  }

  var cache = {};

  function tileCanvas(ch, theme, frame) {
    var key = ch + '|' + theme + '|' + (frame || 0);
    var cv = cache[key];
    if (cv) return cv;
    var t = THEMES[theme] || THEMES.overworld;
    cv = document.createElement('canvas');
    cv.width = T; cv.height = T;
    var c = cv.getContext('2d');
    switch (ch) {
      case 'X': drawGround(c, t); break;
      case 'B': drawBrick(c, t); break;
      case '?': case 'M': drawBlock(c, t, frame || 0); break;
      case 'U': drawUsed(c, t); break;
      case 'S': drawStone(c, t); break;
      case 'L': case 'R': case 'l': case 'r': drawPipe(c, t, ch); break;
      default: return null;
    }
    cache[key] = cv;
    return cv;
  }

  /** 绘制单个瓦片（逻辑像素坐标） */
  function draw(ctx, ch, x, y, theme, frame) {
    var cv = tileCanvas(ch, theme, frame);
    if (cv) ctx.drawImage(cv, Math.round(x), Math.round(y));
  }

  /* ---------- 背景装饰 ---------- */
  function hill(ctx, x, y, w, h, t) {
    t = THEMES[t] || THEMES.overworld;
    ctx.fillStyle = t.hill;
    // 阶梯状小丘
    var steps = Math.max(2, Math.round(h / 4));
    for (var i = 0; i < steps; i++) {
      var iw = Math.round(w * (1 - i / steps));
      ctx.fillRect(Math.round(x + (w - iw) / 2), y + h - (i + 1) * (h / steps), iw, Math.ceil(h / steps));
    }
    ctx.fillStyle = t.hillLo;
    // 眼睛状暗斑
    ctx.fillRect(Math.round(x + w * 0.34), Math.round(y + h * 0.55), 3, 4);
    ctx.fillRect(Math.round(x + w * 0.58), Math.round(y + h * 0.55), 3, 4);
    ctx.fillRect(Math.round(x + w * 0.44), Math.round(y + h * 0.72), 5, 3);
  }

  function bush(ctx, x, y, w, t) {
    t = THEMES[t] || THEMES.overworld;
    var h = 12;
    ctx.fillStyle = t.hill;
    var n = Math.max(1, Math.round(w / 16));
    for (var i = 0; i < n; i++) {
      var bx = x + i * 16;
      ctx.fillRect(bx + 2, y + 4, 12, h - 4);
      ctx.fillRect(bx + 5, y, 6, 5);
    }
    ctx.fillRect(x, y + h - 4, w, 4);
    ctx.fillStyle = t.hillLo;
    ctx.fillRect(x, y + h - 2, w, 2);
  }

  function cloud(ctx, x, y, w, t) {
    t = THEMES[t] || THEMES.overworld;
    var n = Math.max(1, Math.round(w / 16));
    ctx.fillStyle = t.cloud;
    for (var i = 0; i < n; i++) {
      var cx = x + i * 16;
      ctx.fillRect(cx + 2, y + 4, 13, 10);
      ctx.fillRect(cx + 5, y, 8, 6);
    }
    ctx.fillRect(x, y + 7, w, 7);
    ctx.fillStyle = t.cloudLo;
    ctx.fillRect(x, y + 12, w, 2);
  }

  function castle(ctx, x, y, t) {
    var th = THEMES[t] || THEMES.overworld;
    var W = 80, H = 80;
    ctx.fillStyle = th.brick;
    ctx.fillRect(x, y + 16, W, H - 16);
    // 城垛
    for (var i = 0; i < 5; i++) ctx.fillRect(x + i * 16, y + 8, 12, 10);
    // 中央塔
    ctx.fillRect(x + 24, y, 32, 20);
    for (var j = 0; j < 3; j++) ctx.fillRect(x + 26 + j * 12, y - 6, 8, 8);
    // 砖缝
    ctx.fillStyle = th.brickLo;
    for (var yy = y + 20; yy < y + H; yy += 6) ctx.fillRect(x, yy, W, 1);
    for (var xx = x; xx < x + W; xx += 8) ctx.fillRect(xx, y + 20, 1, H - 20);
    // 门与窗
    ctx.fillStyle = '#000000';
    ctx.fillRect(x + 32, y + H - 26, 16, 26);
    ctx.fillRect(x + 34, y + H - 24, 12, 8);
    ctx.fillRect(x + 12, y + 26, 8, 10);
    ctx.fillRect(x + 60, y + 26, 8, 10);
    ctx.fillStyle = th.brickHi;
    ctx.fillRect(x, y + 16, W, 2);
  }

  function flagpole(ctx, x, baseY, topY, flagY) {
    // 杆
    ctx.fillStyle = '#00a800';
    ctx.fillRect(x + 7, topY + 8, 2, baseY - topY - 8);
    ctx.fillStyle = '#58d854';
    ctx.fillRect(x + 7, topY + 8, 1, baseY - topY - 8);
    // 顶球
    ctx.fillStyle = '#00a800';
    ctx.fillRect(x + 4, topY + 2, 8, 6);
    ctx.fillRect(x + 5, topY, 6, 8);
    ctx.fillStyle = '#58d854';
    ctx.fillRect(x + 6, topY + 1, 3, 3);
    // 旗
    ctx.fillStyle = '#f8f8f8';
    ctx.fillRect(x - 8, flagY, 9, 10);
    ctx.fillStyle = '#d82800';
    ctx.fillRect(x - 8, flagY, 9, 2);
    ctx.fillRect(x - 4, flagY + 3, 5, 5);
    // 基座
    ctx.fillStyle = '#9c9c9c';
    ctx.fillRect(x + 2, baseY, 12, 16);
    ctx.fillStyle = '#e4e4e4';
    ctx.fillRect(x + 2, baseY, 12, 2);
  }

  return {
    T: T, THEMES: THEMES, draw: draw,
    hill: hill, bush: bush, cloud: cloud, castle: castle, flagpole: flagpole
  };
})();
