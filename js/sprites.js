/* 像素精灵：调色板 + 位图数据 + 离屏预渲染缓存 */
var Sprites = (function () {

  var PAL = {
    '.': null,
    'R': '#d82800', // 马里奥红
    'r': '#a01000', // 暗红
    'S': '#fca044', // 皮肤
    'N': '#6a3000', // 棕（头发/鞋）
    'B': '#0058f8', // 背带裤蓝
    'Y': '#fcd800', // 黄
    'y': '#e0a800', // 暗金
    'W': '#fcfcfc', // 白
    'K': '#000000', // 黑描边
    'T': '#c86428', // 板栗仔身体
    'F': '#f8b878', // 板栗仔脚
    'g': '#00a800', // 绿
    'G': '#006800', // 暗绿
    'E': '#f8d878', // 乌龟米色
    'O': '#f87800', // 橙
    'o': '#e04000', // 暗橙
    'C': '#f8d8b0'  // 奶油（菌柄）
  };

  // 调色板变体：换色即换角色状态
  var VARIANTS = {
    'fire':    { 'B': '#fcfcfc', 'r': '#d82800' },              // 火焰马里奥：白衣红帽
    '1up':     { 'R': '#00a800', 'r': '#006800' },              // 1UP 蘑菇：绿伞
    'flower2': { 'O': '#fcd800', 'Y': '#f87800' },              // 火焰花闪色
    'shellR':  { 'g': '#d82800', 'G': '#a01000', 'E': '#fcd8a8' } // 红壳乌龟
  };

  /* ---------- 小马里奥 16x16 ---------- */
  var SMALL_UPPER = [
    '.....RRRRRR.....',
    '....RRRRRRRRRR..',
    '....NNNSSSWS....',
    '...NNSSSSSWSS...',
    '...NNSSSSSSSS...',
    '....SNNNNSSS....',
    '.....SSSSSS.....',
    '....RRRRRRR.....',
    '...RRRBBBRRR....',
    '..SRRBYBYBRRS...',
    '..SSRBBBBBRSS...',
    '...RBBBBBBBR....',
    '....BBBBBBB.....'
  ];
  var SMALL_UPPER_JUMP = [
    '.....RRRRRR.....',
    '....RRRRRRRRRR..',
    '....NNNSSSWS....',
    '...NNSSSSSWSS...',
    '...NNSSSSSSSS...',
    '....SNNNNSSS....',
    '..S..SSSSSS..S..',
    '..SSRRRRRRRSS...',
    '...RRRBBBRRR....',
    '...RRBYBYBRR....',
    '...SRBBBBBRS....',
    '...RBBBBBBBR....',
    '....BBBBBBB.....'
  ];
  var SMALL_LEGS = {
    idle:  ['....BBB.BBB.....', '....BB...BB.....', '...NNNN.NNNN....'],
    walk1: ['....BBBBBB......', '...BB...BBB.....', '..NNN....NNNN...'],
    walk2: ['.....BBBBB......', '.....BBBBB......', '....NNNNNN......'],
    walk3: ['....BBBBBB......', '...BBB...BB.....', '..NNNN....NNN...'],
    jump:  ['...BBBBBBBB.....', '..NNBB....BB....', '..NNN.....NNNN..'],
    skid:  ['....BBBBBB......', '...BB....BB.....', '..NNNN..NNNN....']
  };
  var SMALL_DEAD = [
    '.....RRRRRR.....',
    '....RRRRRRRRRR..',
    '....NNNSSSNS....',
    '...NNSSSNSNSS...',
    '...NNSSSSSSSS...',
    '....SSSSSSSS....',
    '....SNNNNSSS....',
    '..S..SSSSSS..S..',
    '..SSRRRRRRRSS...',
    '...RRRBBBRRR....',
    '...RRBYBYBRR....',
    '...SRBBBBBRS....',
    '....BBBBBBB.....',
    '....BBB.BBB.....',
    '...NNNN.NNNN....',
    '...NNN...NNN....'
  ];

  /* ---------- 大马里奥 16x32 ---------- */
  var BIG_UPPER = [
    '.....RRRRRR.....',
    '....RRRRRRRRRR..',
    '...RRRRRRRRRRRR.',
    '....NNNSSSWS....',
    '...NNNSSSSSWS...',
    '...NNSSSSSSSSS..',
    '...NNSSSSSSSSS..',
    '....SNNNNSSSS...',
    '.....SSSSSSS....',
    '......SSSSS.....',
    '....RRRRRRRR....',
    '...RRRRRRRRRR...',
    '..RRRRBBBBRRRR..',
    '..RRRRBBBBRRRR..',
    '..SSRRBYBYBRRSS.',
    '..SSRRBBBBBRRSS.',
    '..SSRRBBBBBRRSS.',
    '...SRRBBBBBRRS..',
    '....RBBBBBBBR...',
    '.....BBBBBBB....',
    '.....BBBBBBB....',
    '.....BBBBBBB....'
  ];
  var BIG_LEGS = {
    idle: [
      '.....BBB.BBB....', '.....BBB.BBB....', '.....BBB.BBB....', '.....BBB.BBB....',
      '.....BB...BB....', '.....BB...BB....', '....NNNN.NNNN...', '...NNNNN.NNNNN..',
      '...NNNNN.NNNNN..', '....NNN...NNN...'
    ],
    walk1: [
      '.....BBBBBB.....', '....BBBBBBB.....', '....BBB..BBB....', '...BBB....BB....',
      '...BB.....BB....', '..BB......BBB...', '..NNN.....NNNN..', '.NNNNN....NNNNN.',
      '.NNNN......NNN..', '..NN............'
    ],
    walk2: [
      '.....BBBBBB.....', '.....BBBBBB.....', '.....BBBBBB.....', '.....BBBBBB.....',
      '.....BBBBB......', '.....BBBBB......', '....NNNNNNN.....', '...NNNNNNNN.....',
      '...NNNNNNN......', '....NNN.........'
    ],
    walk3: [
      '.....BBBBBB.....', '.....BBBBBBB....', '....BBB..BBB....', '....BB....BBB...',
      '....BB.....BB...', '...BBB......BB..', '..NNNN.....NNN..', '.NNNNN....NNNNN.',
      '..NNN......NNNN.', '...........NN...'
    ],
    jump: [
      '....BBBBBBBB....', '...BBBBBBBBB....', '..BBB....BBB....', '..BB......BB....',
      '.NNN......BB....', '.NNNN.....BBB...', '..NN......NNNN..', '..........NNNNN.',
      '..........NNNN..', '...........NN...'
    ],
    skid: [
      '.....BBBBBB.....', '....BBBBBBBB....', '...BBB....BBB...', '...BB......BB...',
      '...BB......BB...', '..BB........BB..', '..NNN......NNN..', '.NNNNN....NNNNN.',
      '.NNNN......NNNN.', '..NN........NN..'
    ]
  };

  /* ---------- 板栗仔 / 乌龟 / 龟壳 ---------- */
  var GOOMBA = [
    '.....KKKKKK.....',
    '...KKTTTTTTKK...',
    '..KTTTTTTTTTTK..',
    '.KTTKKTTTTKKTTK.',
    '.KTKWWKTTKWWKTK.',
    'KTTKWWKTTKWWKTTK',
    'KTTTKKTTTTKKTTTK',
    'KTTTTTTTTTTTTTTK',
    'KTTTTTTTTTTTTTTK',
    'KTTTTTTTTTTTTTTK',
    '.KTTTTTTTTTTTTK.',
    '..KKTTTTTTTTKK..',
    '....KKKKKKKK....',
    '..KKFFFKKFFFKK..',
    '.KFFFFFKKFFFFFK.',
    '.KKKKKK..KKKKKK.'
  ];
  var GOOMBA_FLAT = [
    '................', '................', '................', '................',
    '................', '................', '................', '................',
    '................', '................', '................',
    '..KKKKKKKKKKKK..',
    '.KTTTTTTTTTTTTK.',
    'KTTKKTTTTTTKKTTK',
    'KTTTTTTTTTTTTTTK',
    '.KKKKKKKKKKKKKK.'
  ];

  var KOOPA_UPPER = [
    '..........KKK...',
    '........KKEEEK..',
    '.......KEEEEEEK.',
    '.......KEWKEEEK.',
    '.......KEWKEEEK.',
    '.......KEEEEEEK.',
    '........KEEEEK..',
    '.....KKKKEEEK...',
    '...KKgggKKEEK...',
    '..KgggggggKKK...',
    '.KgGGgggggGgK...',
    '.KgGGGgggGGgK...',
    '.KggGGGGGGggK...',
    '.KgggGGGGgggK...',
    '.KggggGGggggK...',
    '..KggggggggK....',
    '...KKKKKKKKK....'
  ];
  var KOOPA_LEGS = {
    a: ['..KEEEK.KEEEK...', '..KEEEK.KEEEK...', '..KEEEKKKEEEK...',
        '..KOOOK.KOOOK...', '.KOOOOK.KOOOOK..', '.KOOOOK.KOOOOK..', '..KKKK...KKKK...'],
    b: ['...KEEEEEK......', '...KEEEEEK......', '..KEEEEEEEK.....',
        '..KOOOOOOOK.....', '.KOOOOOOOOK.....', '.KOOOOOOK.......', '..KKKKKK........']
  };

  var SHELL = [
    '.....KKKKKK.....',
    '...KKggggggKK...',
    '..KggggggggggK..',
    '.KgGGggggggGGgK.',
    '.KgGGGggggGGGgK.',
    '.KggGGGGGGGGggK.',
    '.KggGGGGGGGGggK.',
    '.KgggGGGGGGgggK.',
    '.KgggGGGGGGgggK.',
    '.KggggGGGGggggK.',
    '..KggggggggggK..',
    '..KKgggggggKKK..',
    '...KKKKKKKKKK...',
    '....EEEEEEEE....',
    '....KKKKKKKK....',
    '................'
  ];

  /* ---------- 道具 ---------- */
  var MUSHROOM = [
    '.....KKKKKK.....',
    '...KKRRRRRRKK...',
    '..KRRWWWWWWRRK..',
    '.KRRWWWWWWWWRRK.',
    '.KRWWWWWWWWWWRK.',
    'KRRWWWRRRRWWWRRK',
    'KRRWWRRRRRRWWRRK',
    'KRRWWRRRRRRWWRRK',
    'KRRRWWRRRRWWRRRK',
    '.KRRRWWWWWWRRRK.',
    '..KRRRRRRRRRRK..',
    '...KKKKKKKKKK...',
    '....KCCCCCCK....',
    '....KCKCCKCK....',
    '....KCCCCCCK....',
    '.....KKKKKK.....'
  ];
  var FLOWER = [
    '.....KKKKKK.....',
    '...KKOOOOOOKK...',
    '..KOOYYYYYYOOK..',
    '.KOOYYWWWWYYOOK.',
    '.KOYYWWWWWWYYOK.',
    '.KOYYWWWWWWYYOK.',
    '.KOOYYWWWWYYOOK.',
    '..KOOYYYYYYOOK..',
    '...KKOOOOOOKK...',
    '.....KKgKKK.....',
    '.....KgGgK......',
    '..KKKKgGgKKKK...',
    '.KggggGGgggggK..',
    '.KgGGgKgGgKgGGK.',
    '.....KgGgK......',
    '.....KKKKK......'
  ];
  var COIN_A = [
    '......yyyy......',
    '....yyYYYYyy....',
    '...yYYYYYYYYy...',
    '..yYYYyyyyYYYy..',
    '..yYYyyWWyyYYy..',
    '..yYYyWWWWyYYy..',
    '..yYYyWWWWyYYy..',
    '..yYYyWWWWyYYy..',
    '..yYYyWWWWyYYy..',
    '..yYYyWWWWyYYy..',
    '..yYYyyWWyyYYy..',
    '..yYYYyyyyYYYy..',
    '...yYYYYYYYYy...',
    '....yyYYYYyy....',
    '......yyyy......',
    '................'
  ];
  var COIN_B = [
    '.......yy.......',
    '......yYYy......',
    '.....yYYYYy.....',
    '.....yYyyYy.....',
    '.....yYyyYy.....',
    '.....yYyyYy.....',
    '.....yYyyYy.....',
    '.....yYyyYy.....',
    '.....yYyyYy.....',
    '.....yYyyYy.....',
    '.....yYyyYy.....',
    '.....yYYYYy.....',
    '......yYYy......',
    '.......yy.......',
    '................',
    '................'
  ];
  var COIN_C = [
    '................',
    '.......Yy.......',
    '.......Yy.......',
    '.......Yy.......',
    '.......Yy.......',
    '.......Yy.......',
    '.......Yy.......',
    '.......Yy.......',
    '.......Yy.......',
    '.......Yy.......',
    '.......Yy.......',
    '.......Yy.......',
    '.......Yy.......',
    '.......Yy.......',
    '................',
    '................'
  ];
  var FIREBALL = [
    '..oooo..',
    '.oOOOOo.',
    'oOWWOOOo',
    'oOWWOOOo',
    'oOOOOOOo',
    'oOOOOOOo',
    '.oOOOOo.',
    '..oooo..'
  ];
  // 原创彗星：暖色核心拖着冷色像素尾迹，不使用外部或官方精灵素材。
  var COMET = [
    '................',
    '..........K.....',
    '.........KWB....',
    '........KWBYK...',
    '.......KWBYYYK..',
    '......KWBYWWYYK.',
    '.....KWBYWWWWYYK',
    '....KWBYWWWWYYK.',
    '...KWBYWWWWYYK..',
    '..KWBYWWWWYYK...',
    '.KWBYWWWWYYK....',
    'KWBYWWWWYYK.....',
    '.KBBYYYYYK......',
    '..KBBYYYK.......',
    '...KBBYK........',
    '....KKK.........'
  ];

  /* ---------- 食人花 16x24 ---------- */
  var PIRANHA = [
    '......KKKK......',
    '.....KgGGgK.....',
    '....KgGGGGGgK...',
    '...KgGGGGGGGgK..',
    '...KWWgGGgWWgK..',
    '...KWWgGGgWWgK..',
    '...KgGGGGGGGgK..',
    '....KgGGGGGgK...',
    '.....KgGGgGgK...',
    '......KgggK.....',
    '......KKKK......',
    '.......KK.......',
    '......KKKK......',
    '.....KKKKKK.....',
    '.....KKKKKK.....',
    '.....KKKKKK.....',
    '.....KKKKKK.....',
    '.....KKKKKK.....',
    '.....KKKKKK.....',
    '.....KKKKKK.....',
    '.....KKKKKK.....',
    '.....KKKKKK.....',
    '.....KKKKKK.....',
    '.....KKKKKK.....'
  ];

  /* ---------- 库巴 32x32 ---------- */
  var BOWSER = [
    '........KKK.....................',
    '.......KKOKK....................',
    '......KOOOOKK...................',
    '.....KOOOOOOOKK....KK...........',
    '....KOOOOKKOOOK..KKOK..........',
    '...KOOOOKKKKOOOKKOOOK..........',
    '...KOOOOKKKKKOOOKOOOK..........',
    '...KOOOOKKKKKKOOOKOOK..........',
    '...KOOOOKKKKKKKOOKOOK..........',
    '...KOOOOKKKKKKKKOKOOK..........',
    '...KOOOOKKKKKKKKOKOOK..........',
    '...KOOOOKKKKKKKKKKOOK..........',
    '...KOOOOKKKKKKKKKKOK...........',
    '...KOOOOKKKKKKKKKOOK...........',
    '...KOOOOKKKKKKKKKOKK...........',
    '...KOOOOKOOKKKKOOKKK...........',
    '...KKOOOKKKKKKKOOKKK...........',
    '....KKKKKOOOKKKOKKKK...........',
    '...KKgggKKKKOKKKKKK............',
    '..KggggggKKKKKKKKK.............',
    '.KggGGGGGggKKKKKK..............',
    '.KgGGGGGGGGgKKKK...............',
    '.KgGGGGGGGGgKKKK...............',
    '.KggGGGGGGGgKKKK...............',
    '..KgggggggggKKKK...............',
    '...KKKKKKKKKKKKK...............',
    '....KKKWWWWWKKKK...............',
    '....KKKWWWWWWWKK...............',
    '....KKKWWWWWWWK................',
    '....KKKWWWWWWWK................',
    '....KKKWWWWWWWK................',
    '....KKKKKKKKKKK................'
  ];

  // 库巴精灵来自手写字符画，统一规范为 32x32，避免少一个像素的行破坏预渲染。
  var BOWSER_NORMALIZED = [];
  for (var bowserRowIndex = 0; bowserRowIndex < 32; bowserRowIndex++) {
    var bowserRow = BOWSER[bowserRowIndex] || '';
    BOWSER_NORMALIZED.push((bowserRow + '................................').slice(0, 32));
  }
  BOWSER = BOWSER_NORMALIZED;

  /* ---------- 注册表 ---------- */
  var DEFS = {};
  function def(name, rows) { DEFS[name] = rows; }

  function compose(upper, legs) { return upper.concat(legs); }

  def('mario_small_idle',  compose(SMALL_UPPER, SMALL_LEGS.idle));
  def('mario_small_walk1', compose(SMALL_UPPER, SMALL_LEGS.walk1));
  def('mario_small_walk2', compose(SMALL_UPPER, SMALL_LEGS.walk2));
  def('mario_small_walk3', compose(SMALL_UPPER, SMALL_LEGS.walk3));
  def('mario_small_jump',  compose(SMALL_UPPER_JUMP, SMALL_LEGS.jump));
  def('mario_small_skid',  compose(SMALL_UPPER, SMALL_LEGS.skid));
  def('mario_small_dead',  SMALL_DEAD);

  def('mario_big_idle',  compose(BIG_UPPER, BIG_LEGS.idle));
  def('mario_big_walk1', compose(BIG_UPPER, BIG_LEGS.walk1));
  def('mario_big_walk2', compose(BIG_UPPER, BIG_LEGS.walk2));
  def('mario_big_walk3', compose(BIG_UPPER, BIG_LEGS.walk3));
  def('mario_big_jump',  compose(BIG_UPPER, BIG_LEGS.jump));
  def('mario_big_skid',  compose(BIG_UPPER, BIG_LEGS.skid));

  def('goomba', GOOMBA);
  def('goomba_flat', GOOMBA_FLAT);
  def('koopa1', compose(KOOPA_UPPER, KOOPA_LEGS.a));
  def('koopa2', compose(KOOPA_UPPER, KOOPA_LEGS.b));
  def('shell', SHELL);
  def('mushroom', MUSHROOM);
  def('flower', FLOWER);
  def('coin_a', COIN_A);
  def('coin_b', COIN_B);
  def('coin_c', COIN_C);
  def('fireball', FIREBALL);
  def('comet', COMET);
  def('piranha', PIRANHA);
  def('bowser', BOWSER);

  /* ---------- 预渲染缓存 ---------- */
  var cache = {};

  function build(name, flip, variant) {
    var rows = DEFS[name];
    if (!rows) throw new Error('未知精灵: ' + name);
    var h = rows.length, w = rows[0].length;
    var cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    var c = cv.getContext('2d');
    var swap = variant ? VARIANTS[variant] : null;

    for (var y = 0; y < h; y++) {
      var row = rows[y];
      for (var x = 0; x < w; x++) {
        var ch = row[x];
        if (ch === '.') continue;
        var col = (swap && swap[ch]) || PAL[ch];
        if (!col) continue;
        c.fillStyle = col;
        c.fillRect(flip ? (w - 1 - x) : x, y, 1, 1);
      }
    }
    return cv;
  }

  function get(name, flip, variant) {
    var key = name + '|' + (flip ? 1 : 0) + '|' + (variant || '');
    var cv = cache[key];
    if (!cv) { cv = build(name, !!flip, variant); cache[key] = cv; }
    return cv;
  }

  /** 以左上角 (x,y) 绘制精灵（逻辑像素坐标） */
  function draw(ctx, name, x, y, flip, variant) {
    var cv = get(name, flip, variant);
    ctx.drawImage(cv, Math.round(x), Math.round(y));
  }

  function size(name) {
    var rows = DEFS[name];
    return { w: rows[0].length, h: rows.length };
  }

  /** 自检：所有位图必须为矩形 */
  function validate() {
    var errs = [];
    for (var k in DEFS) {
      var rows = DEFS[k], w = rows[0].length;
      for (var i = 0; i < rows.length; i++) {
        if (rows[i].length !== w) {
          errs.push(k + ' 第' + i + '行宽度 ' + rows[i].length + '，应为 ' + w);
        }
        for (var j = 0; j < rows[i].length; j++) {
          if (!(rows[i][j] in PAL)) errs.push(k + ' 第' + i + '行含未知色 "' + rows[i][j] + '"');
        }
      }
    }
    return errs;
  }

  return { draw: draw, get: get, size: size, validate: validate, PAL: PAL, DEFS: DEFS };
})();
