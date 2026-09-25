/* 关卡定义与构建器
   瓦片字符：' '空 X地面 B砖 b含币砖 ?金币块 M道具块 C彗星块 V(1UP)块 U已用 S硬块
             L/R水管顶 l/r水管身 E弹簧台 o金币 g板栗仔 k乌龟 */
var Levels = (function () {
  var H = 15; // 关卡高度（瓦片）

  var DEFS = [
    /* ---------------- 1-1 地面关 ---------------- */
    {
      title: 'SUNLIT MEADOW', medals: [[35, 6], [82, 3], [169, 3]],
      name: '1-1', theme: 'overworld', time: 400, width: 212,
      spawn: [3, 10], sceneryBase: 13, scenery: true,
      checkpoint: [92, 13],
      flag: 198, castle: 202,
      ops: [
        { rect: [0, 13, 69, 2, 'X'] }, { rect: [71, 13, 15, 2, 'X'] },
        { rect: [89, 13, 64, 2, 'X'] }, { rect: [156, 13, 56, 2, 'X'] },

        { row: [9, 9, 'BM?B'] }, { row: [11, 6, 'ooo'] },
        { row: [9, 16, '?'] },
        { row: [9, 20, 'BMC?'] },
        // 第一条高路：从低管跃上花园台，再跳到高管；下方仍可通行。
        { row: [8, 32, 'ooo'] },
        { rect: [32, 9, 3, 1, 'B'] }, { rect: [35, 7, 3, 1, 'B'] },
        { row: [6, 36, 'oo'] },
        { pipe: [28, 2] }, { pipe: [38, 3] }, { pipe: [46, 4] }, { pipe: [57, 4] },
        { row: [8, 50, 'oo'] },
        { row: [5, 61, 'BbBB'] },
        // 坑边先给落脚台，金币弧线引导上层藏宝路线。
        { rect: [72, 10, 3, 1, 'B'] }, { row: [9, 72, 'ooo'] },
        { row: [9, 77, 'B?bB'] }, { rect: [77, 7, 2, 1, 'B'] },
        { row: [5, 80, 'BBBBBBBB'] },
        { row: [4, 81, 'oooooo'] },
        { row: [9, 91, 'BB'] },
        { row: [5, 91, 'BB'] },
        { row: [9, 94, '?'] },
        { row: [5, 94, 'B?B'] },
        { row: [9, 100, 'BbB'] },
        { row: [8, 105, 'ooo'] },
        { row: [9, 118, '?..B'] },
        { row: [5, 118, 'BCBB'] },
        { row: [9, 129, '?'] },
        { stairsUp: [134, 4] }, { stairsDown: [140, 4] },
        { row: [8, 145, 'ooooo'] },
        { row: [10, 153, 'ooo'] },
        { pipe: [163, 2] },
        { rect: [166, 7, 2, 1, 'B'] },
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
      ],
      // 1-1 的高管可以直接进入地下关起点。
      pipeLinks: [{ x: 57, to: { level: 1, x: 3, y: 10 } }]
    },

    /* ---------------- 1-2 地下关 ---------------- */
    {
      title: 'CRYSTAL HOLLOW', medals: [[22, 5], [68, 4], [105, 5]],
      name: '1-2', theme: 'underground', time: 400, width: 150,
      spawn: [3, 10], sceneryBase: 13, scenery: false,
      checkpoint: [83, 13],
      flag: 145, castle: null,
      ops: [
        { rect: [0, 0, 150, 2, 'X'] },
        { rect: [0, 13, 88, 2, 'X'] }, { rect: [91, 13, 29, 2, 'X'] },
        { rect: [123, 13, 27, 2, 'X'] },

        { row: [9, 6, 'M'] },
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
        // 水晶厅上下双线：下路安全，上路金币与星币。
        { rect: [63, 8, 2, 1, 'B'] },
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
      title: 'CLOUD GARDENS', medals: [[27, 6], [86, 4], [128, 5]],
      name: '1-3', theme: 'sky', time: 300, width: 170,
      spawn: [3, 8], sceneryBase: 11, scenery: true,
      checkpoint: [66, 12],
      flag: 162, castle: 166,
      ops: [
        { rect: [0, 11, 14, 4, 'X'] },
        { row: [8, 9, 'M'] }, { row: [8, 12, 'oo'] },
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
        // 红色弹簧块：站上去按跳，可选择更高的星币路线。
        { row: [10, 18, 'E'] }, { row: [10, 57, 'E'] }, { row: [11, 98, 'E'] },
        { rect: [144, 11, 26, 4, 'X'] },
        { row: [10, 146, 'ooo'] },
        { stairsUp: [152, 5] },

        { en: ['k', 34, 10] }, { en: ['g', 36, 10] },
        { en: ['g', 58, 9] },
        { en: ['k', 69, 11] }, { en: ['g', 71, 11] },
        { en: ['g', 99, 10] }, { en: ['k', 102, 10] },
        { en: ['g', 119, 9] },
        { en: ['g', 136, 9] }, { en: ['g', 138, 9] },
        { en: ['g', 147, 10] }, { en: ['k', 149, 10] }
      ]
    },

    /* ---------------- 1-4 城堡关 ---------------- */
    {
      title: 'EMBER CITADEL', medals: [[37, 7], [92, 7], [159, 8]],
      name: '1-4', theme: 'castle', time: 400, width: 200,
      spawn: [3, 10], sceneryBase: 13, scenery: false,
      checkpoint: [89, 13],
      flag: null, castle: null,
      ops: [
        { rect: [0, 13, 30, 2, 'X'] },
        { rect: [32, 13, 21, 2, 'X'] },
        { rect: [55, 13, 26, 2, 'X'] },
        { rect: [83, 13, 31, 2, 'X'] },
        { rect: [116, 13, 21, 2, 'X'] },
        { rect: [139, 13, 61, 2, 'X'] },
        { rect: [0, 0, 200, 2, 'X'] },

        { pipe: [8, 1] },
        { pipe: [22, 1] },
        { pipe: [44, 1] },
        { pipe: [68, 1] },
        { pipe: [82, 1] },
        { pipe: [100, 1] },

        { row: [11, 5, 'ooooo'] },
        { row: [11, 14, 'ooo'] },
        { rect: [17, 9, 3, 1, 'B'] },
        { row: [8, 30, 'BB'] },
        { rect: [35, 10, 4, 1, 'B'] },
        { row: [9, 52, '?M?'] },
        { rect: [60, 9, 5, 1, 'B'] },
        { row: [9, 72, 'B?B'] },
        { row: [9, 87, '?'] },
        { rect: [90, 10, 4, 1, 'B'] },
        { row: [9, 105, 'BB'] },
        { rect: [112, 9, 5, 1, 'B'] },
        { row: [9, 128, '?M?'] },
        { row: [9, 140, 'M'] },
        { stairsUp: [144, 4] },
        // 只有两格高的闸门，能跳过但不会把路线完全封死。
        { rect: [152, 11, 1, 2, 'X'] },
        { rect: [158, 10, 3, 1, 'S'] },
        { rect: [174, 10, 3, 1, 'S'] },

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
        { en: ['k', 142, 12] }
      ],
      piranhas: [
        { x: 8, pipeY: 12 * 16 },
        { x: 22, pipeY: 12 * 16 },
        { x: 44, pipeY: 12 * 16 },
        { x: 68, pipeY: 12 * 16 },
        { x: 82, pipeY: 12 * 16 },
        { x: 100, pipeY: 12 * 16 }
      ],
      // 库巴守在桥上；踩到斧头会结束战斗并结算本关。
      boss: { x: 164 * 16, y: 13 * 16 },
      axeX: 180 * 16
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
    var piranhas = [];
    for (var pi = 0; pi < (d.piranhas || []).length; pi++) {
      var pd = d.piranhas[pi];
      piranhas.push({
        x: pd.x * 16,
        pipeY: pd.pipeY == null ? 12 * 16 : pd.pipeY
      });
    }

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
      name: d.name, title: d.title, theme: d.theme, time: d.time,
      medals: d.medals.map(function (p, i) { return { id: i, x: p[0] * 16 + 2, y: p[1] * 16, w: 12, h: 14 }; }),
      width: W, height: H,
      pixelWidth: W * 16, pixelHeight: H * 16,
      tiles: grid, tileStrings: tiles,
      spawn: { x: d.spawn[0] * 16, y: d.spawn[1] * 16 },
      checkpoint: d.checkpoint == null ? null : {
        x: d.checkpoint[0] * 16,
        baseY: d.checkpoint[1] * 16
      },
      enemies: enemies,
      decor: decor,
      flagX: d.flag == null ? null : d.flag * 16,
      flagTopY: 3 * 16,
      flagBaseY: (d.sceneryBase) * 16,
      castleX: d.castle == null ? null : d.castle * 16,
      castleY: d.sceneryBase * 16 - 80,
      piranhas: piranhas,
      pipeLinks: d.pipeLinks || [],
      boss: d.boss || null,
      axeX: d.axeX == null ? null : d.axeX
    };
  }

  return { build: build, count: DEFS.length, H: H, DEFS: DEFS };
})();
