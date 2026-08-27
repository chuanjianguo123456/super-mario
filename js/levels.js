/* 关卡定义与构建器
   瓦片字符：' '空 X地面 B砖 b含币砖 ?金币块 M道具块 V(1UP)块 U已用 S硬块
             L/R水管顶 l/r水管身 o金币 g板栗仔 k乌龟 */
var Levels = (function () {
  var H = 15; // 关卡高度（瓦片）

  var DEFS = [
    /* ---------------- 1-1 地面关 ---------------- */
    {
      name: '1-1', theme: 'overworld', time: 400, width: 212,
      spawn: [3, 10], sceneryBase: 13, scenery: true,
      flag: 198, castle: 202,
      ops: [
        { rect: [0, 13, 69, 2, 'X'] }, { rect: [71, 13, 15, 2, 'X'] },
        { rect: [89, 13, 64, 2, 'X'] }, { rect: [156, 13, 56, 2, 'X'] },

        { row: [9, 16, '?'] },
        { row: [9, 20, 'BMB?'] },
        { row: [8, 32, 'ooo'] },
        { pipe: [28, 2] }, { pipe: [38, 3] }, { pipe: [46, 4] }, { pipe: [57, 4] },
        { row: [8, 50, 'oo'] },
        { row: [5, 61, 'BbBB'] },
        { row: [9, 77, 'B?bB'] },
        { row: [5, 80, 'BBBBBBBB'] },
        { row: [4, 81, 'oooooo'] },
        { row: [9, 91, 'BB'] },
        { row: [5, 91, 'BB'] },
        { row: [9, 94, '?'] },
        { row: [5, 94, 'B?B'] },
        { row: [9, 100, 'BbB'] },
        { row: [8, 105, 'ooo'] },
        { row: [9, 118, 'B..B'] },
        { row: [5, 118, 'BBBB'] },
        { row: [9, 129, '?'] },
        { stairsUp: [134, 4] }, { stairsDown: [140, 4] },
        { row: [8, 145, 'ooooo'] },
        { row: [10, 153, 'ooo'] },
        { pipe: [163, 2] },
        { row: [9, 168, 'B?B'] },
        { row: [5, 168, 'BVB'] },
        { row: [8, 175, 'oo'] },
        { stairsUp: [181, 8] },

        { en: ['g', 22, 12] }, { en: ['g', 40, 12] },
        { en: ['g', 51, 12] }, { en: ['g', 53, 12] },
        { en: ['k', 63, 12] },
        { en: ['g', 80, 12] }, { en: ['g', 84, 4] },
        { en: ['g', 97, 12] }, { en: ['g', 99, 12] },
        { en: ['k', 110, 12] },
        { en: ['g', 114, 12] }, { en: ['g', 116, 12] },
        { en: ['g', 124, 12] }, { en: ['g', 126, 12] },
        { en: ['g', 146, 12] }, { en: ['g', 148, 12] },
        { en: ['g', 158, 12] },
        { en: ['g', 172, 12] }, { en: ['g', 174, 12] },
        { en: ['k', 177, 12] }
      ]
    },

    /* ---------------- 1-2 地下关 ---------------- */
    {
      name: '1-2', theme: 'underground', time: 400, width: 150,
      spawn: [3, 10], sceneryBase: 13, scenery: false,
      flag: 145, castle: null,
      ops: [
        { rect: [0, 0, 150, 2, 'X'] },
        { rect: [0, 13, 88, 2, 'X'] }, { rect: [91, 13, 29, 2, 'X'] },
        { rect: [123, 13, 27, 2, 'X'] },

        { row: [11, 6, 'ooooo'] },
        { rect: [10, 9, 4, 1, 'B'] }, { row: [8, 10, 'oooo'] },
        { rect: [17, 2, 1, 4, 'X'] },
        { rect: [18, 7, 6, 1, 'B'] }, { row: [6, 19, 'oooo'] },
        { rect: [20, 11, 2, 1, 'S'] },
        { rect: [28, 10, 3, 3, 'S'] },
        { rect: [30, 2, 1, 3, 'X'] },
        { rect: [34, 10, 5, 1, 'B'] }, { row: [9, 34, 'ooooo'] },
        { row: [11, 41, 'oo'] },
        { row: [8, 44, 'BB?BBbBB'] },
        { rect: [48, 2, 1, 4, 'X'] },
        { rect: [52, 11, 4, 2, 'S'] },
        { rect: [58, 9, 3, 1, 'B'] }, { row: [7, 58, 'ooo'] },
        { row: [11, 64, 'ooooo'] },
        { rect: [66, 6, 6, 1, 'B'] },
        { rect: [70, 10, 2, 3, 'S'] },
        { row: [5, 67, 'oooo'] },
        { rect: [76, 8, 4, 1, 'B'] }, { row: [7, 76, 'oMoo'] },
        { rect: [82, 2, 1, 5, 'X'] },
        { row: [11, 84, 'ooo'] },
        { rect: [92, 9, 5, 1, 'B'] }, { row: [8, 92, 'ooooo'] },
        { rect: [100, 11, 3, 2, 'S'] },
        { rect: [104, 7, 4, 1, 'B'] }, { row: [6, 104, 'oooo'] },
        { rect: [106, 2, 1, 4, 'X'] },
        { row: [11, 112, 'oooo'] },
        { rect: [114, 10, 4, 1, 'B'] },
        { row: [10, 120, 'ooo'] },
        { rect: [126, 9, 6, 1, 'B'] }, { row: [8, 126, 'oo?oo'] },
        { rect: [134, 2, 1, 4, 'X'] },
        { stairsUp: [136, 6] },

        { en: ['g', 12, 12] }, { en: ['k', 20, 10] },
        { en: ['g', 24, 12] }, { en: ['g', 26, 12] },
        { en: ['g', 36, 9] },
        { en: ['g', 41, 12] }, { en: ['g', 43, 12] },
        { en: ['k', 54, 10] },
        { en: ['g', 62, 12] }, { en: ['g', 64, 12] },
        { en: ['g', 68, 5] },
        { en: ['g', 78, 12] }, { en: ['k', 85, 12] },
        { en: ['g', 94, 12] }, { en: ['g', 96, 12] },
        { en: ['k', 101, 10] },
        { en: ['g', 110, 12] }, { en: ['g', 112, 12] },
        { en: ['g', 115, 9] },
        { en: ['g', 128, 12] }, { en: ['g', 130, 12] },
        { en: ['k', 133, 12] }
      ]
    },

    /* ---------------- 1-3 空中关 ---------------- */
    {
      name: '1-3', theme: 'sky', time: 300, width: 170,
      spawn: [3, 8], sceneryBase: 11, scenery: true,
      flag: 162, castle: 166,
      ops: [
        { rect: [0, 11, 14, 4, 'X'] },
        { rect: [17, 10, 5, 1, 'S'] }, { row: [9, 18, 'ooo'] },
        { rect: [25, 8, 4, 1, 'S'] }, { row: [7, 26, 'oo'] },
        { rect: [33, 11, 6, 1, 'S'] }, { row: [10, 34, 'oooo'] },
        { rect: [43, 9, 3, 1, 'S'] },
        { rect: [49, 7, 4, 1, 'S'] }, { row: [6, 50, 'oo'] },
        { rect: [56, 10, 5, 1, 'S'] }, { row: [9, 57, 'ooo'] },
        { rect: [65, 12, 7, 1, 'S'] }, { row: [11, 66, 'ooooo'] },
        { rect: [76, 9, 4, 1, 'S'] }, { row: [6, 77, 'oo'] },
        { rect: [84, 6, 4, 1, 'S'] }, { row: [5, 85, 'oo'] },
        { rect: [91, 9, 3, 1, 'S'] },
        { rect: [97, 11, 8, 1, 'S'] }, { row: [10, 98, 'oooooo'] },
        { row: [8, 100, 'BMB'] },
        { rect: [109, 8, 4, 1, 'S'] }, { row: [7, 110, 'oo'] },
        { rect: [117, 10, 5, 1, 'S'] }, { row: [9, 118, 'ooo'] },
        { rect: [126, 7, 4, 1, 'S'] }, { row: [6, 127, 'oo'] },
        { rect: [134, 10, 6, 1, 'S'] }, { row: [7, 135, 'o?oo'] },
        { rect: [144, 11, 26, 4, 'X'] },
        { row: [10, 146, 'ooo'] },
        { stairsUp: [152, 5] },

        { en: ['k', 34, 10] }, { en: ['g', 36, 10] },
        { en: ['g', 58, 9] },
        { en: ['k', 67, 11] }, { en: ['g', 70, 11] },
        { en: ['g', 99, 10] }, { en: ['k', 102, 10] },
        { en: ['g', 119, 9] },
        { en: ['g', 136, 9] }, { en: ['g', 138, 9] },
        { en: ['g', 147, 10] }, { en: ['k', 149, 10] }
      ]
    },

    /* ---------------- 1-4 城堡关 ---------------- */
    {
      name: '1-4', theme: 'castle', time: 400, width: 200,
      spawn: [3, 10], sceneryBase: 13, scenery: false,
      flag: null, castle: null, boss: true,
      ops: [
        { rect: [0, 13, 30, 2, 'X'] },
        { rect: [33, 13, 20, 2, 'X'] },
        { rect: [56, 13, 25, 2, 'X'] },
        { rect: [84, 13, 30, 2, 'X'] },
        { rect: [117, 13, 20, 2, 'X'] },
        { rect: [140, 13, 60, 2, 'X'] },

        { rect: [0, 0, 200, 2, 'X'] },

        { row: [11, 5, 'ooooo'] },
        { pipe: [8, 2] },
        { row: [11, 14, 'ooo'] },
        { rect: [17, 9, 3, 1, 'B'] },
        { pipe: [22, 3] },
        { row: [11, 28, 'ooooo'] },
        { row: [8, 30, 'BB'] },
        { rect: [35, 10, 4, 1, 'B'] },
        { row: [11, 40, 'ooo'] },
        { pipe: [44, 2] },
        { row: [11, 49, 'ooooo'] },
        { row: [9, 52, '?b?'] },
        { rect: [60, 9, 5, 1, 'B'] },
        { row: [10, 62, 'ooo'] },
        { pipe: [68, 2] },
        { row: [9, 72, 'B?B'] },
        { row: [10, 75, 'ooooo'] },
        { pipe: [82, 2] },
        { row: [9, 87, '?'] },
        { rect: [90, 10, 4, 1, 'B'] },
        { row: [11, 95, 'ooo'] },
        { pipe: [100, 3] },
        { row: [9, 105, 'BB'] },
        { row: [10, 108, 'oooo'] },
        { rect: [112, 9, 5, 1, 'B'] },
        { pipe: [118, 2] },
        { row: [11, 122, 'ooooo'] },
        { row: [9, 128, '?b?'] },

        { stairsUp: [144, 8] },
        { rect: [152, 5, 1, 8, 'X'] },

        { en: ['g', 12, 12] }, { en: ['g', 14, 12] },
        { en: ['g', 30, 12] },
        { en: ['k', 42, 12] },
        { en: ['g', 53, 12] }, { en: ['g', 55, 12] },
        { en: ['g', 66, 12] },
        { en: ['k', 78, 12] },
        { en: ['g', 90, 12] },
        { en: ['g', 104, 12] }, { en: ['g', 106, 12] },
        { en: ['g', 116, 12] },
        { en: ['g', 130, 12] }, { en: ['g', 132, 12] },
        { en: ['k', 138, 12] }
      ],
      piranhas: [
        { x: 8, pipeY: 11 * 16 },
        { x: 22, pipeY: 10 * 16 },
        { x: 44, pipeY: 11 * 16 },
        { x: 68, pipeY: 11 * 16 },
        { x: 82, pipeY: 11 * 16 },
        { x: 100, pipeY: 10 * 16 },
        { x: 118, pipeY: 11 * 16 }
      ],
      boss: { x: 164, y: 13 * 16 },
      axeX: 153
    }
  ];

  /* ---------------- 构建 ---------------- */
  function rng(seed) {
    var s = seed >>> 0 || 1;
    return function () {
      s ^= s << 13; s >>>= 0;
      s ^= s >> 17;
      s ^= s << 5; s >>>= 0;
      return s / 4294967296;
    };
  }

  function build(index) {
    var d = DEFS[index % DEFS.length];
    var W = d.width;
    var grid = [];
    for (var y = 0; y < H; y++) {
      var row = new Array(W);
      for (var x = 0; x < W; x++) row[x] = ' ';
      grid.push(row);
    }

    function put(x, y, ch) {
      if (x < 0 || x >= W || y < 0 || y >= H) return;
      grid[y][x] = ch;
    }

    var enemies = [];

    for (var i = 0; i < d.ops.length; i++) {
      var op = d.ops[i], a;
      if (op.rect) {
        a = op.rect;
        for (var ry = 0; ry < a[3]; ry++)
          for (var rx = 0; rx < a[2]; rx++) put(a[0] + rx, a[1] + ry, a[4]);
      } else if (op.row) {
        a = op.row; // [y, x, str]  '.' = 跳过
        for (var c = 0; c < a[2].length; c++) {
          var ch = a[2][c];
          if (ch !== '.') put(a[1] + c, a[0], ch);
        }
      } else if (op.pipe) {
        a = op.pipe; // [x, 高度]
        var top = 13 - a[1];
        for (var py = top; py <= 12; py++) {
          put(a[0], py, py === top ? 'L' : 'l');
          put(a[0] + 1, py, py === top ? 'R' : 'r');
        }
      } else if (op.stairsUp) {
        a = op.stairsUp; // [x, 级数]
        for (var s1 = 0; s1 < a[1]; s1++)
          for (var sy = 12 - s1; sy <= 12; sy++) put(a[0] + s1, sy, 'S');
      } else if (op.stairsDown) {
        a = op.stairsDown;
        for (var s2 = 0; s2 < a[1]; s2++)
          for (var sy2 = 12 - (a[1] - 1 - s2); sy2 <= 12; sy2++) put(a[0] + s2, sy2, 'S');
      } else if (op.en) {
        a = op.en; // [种类, x, y]  底边贴在 y+1 行顶部
        enemies.push({ kind: a[0], x: a[1] * 16, y: (a[2] + 1) * 16 });
      }
    }

    // 网格内的敌人标记也收集（便于手写行时直接放敌人）
    for (var gy = 0; gy < H; gy++) {
      for (var gx = 0; gx < W; gx++) {
        var g = grid[gy][gx];
        if (g === 'g' || g === 'k') {
          enemies.push({ kind: g, x: gx * 16, y: (gy + 1) * 16 });
          grid[gy][gx] = ' ';
        }
      }
    }

    // 背景装饰
    var decor = [];
    var base = d.sceneryBase * 16;
    if (d.scenery) {
      var rnd = rng(index * 7919 + 13);
      for (var tx = 2; tx < W - 6; tx += 8) {
        var r = rnd();
        if (r < 0.22) decor.push({ k: 'hill', x: tx * 16, y: base - 48, w: 80, h: 48 });
        else if (r < 0.42) decor.push({ k: 'hill', x: tx * 16, y: base - 32, w: 48, h: 32 });
        else if (r < 0.62) decor.push({ k: 'bush', x: tx * 16, y: base - 12, w: (1 + Math.floor(rnd() * 3)) * 16 });
      }
      for (var cx = 4; cx < W - 4; cx += 7) {
        if (rnd() < 0.55) {
          decor.push({ k: 'cloud', x: cx * 16, y: (2 + Math.floor(rnd() * 3)) * 16, w: (1 + Math.floor(rnd() * 3)) * 16 });
        }
      }
      decor.sort(function (p, q) { return (p.k === 'cloud' ? 0 : 1) - (q.k === 'cloud' ? 0 : 1); });
    }

    var tiles = [];
    for (var ty = 0; ty < H; ty++) tiles.push(grid[ty].join(''));

    return {
      name: d.name, theme: d.theme, time: d.time,
      width: W, height: H,
      pixelWidth: W * 16, pixelHeight: H * 16,
      tiles: grid, tileStrings: tiles,
      spawn: { x: d.spawn[0] * 16, y: d.spawn[1] * 16 },
      enemies: enemies,
      decor: decor,
      flagX: d.flag == null ? null : d.flag * 16,
      flagTopY: 3 * 16,
      flagBaseY: (d.sceneryBase) * 16,
      castleX: d.castle == null ? null : d.castle * 16,
      castleY: d.sceneryBase * 16 - 80,
      piranhas: d.piranhas || [],
      boss: d.boss || null,
      axeX: d.axeX == null ? null : d.axeX * 16
    };
  }

  return { build: build, count: DEFS.length, H: H, DEFS: DEFS };
})();
