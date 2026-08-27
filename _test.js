/* 无头测试：在 Node 里跑真实游戏循环，验证物理/碰撞/流程 */
const fs = require('fs'), path = require('path'), vm = require('vm');

const DIR = __dirname;
const FILES = ['font.js', 'sprites.js', 'tiles.js', 'input.js', 'audio.js',
               'levels.js', 'world.js', 'entities.js', 'game.js'];

/* ---- DOM 桩 ---- */
function ctxStub() {
  const noop = () => {};
  return new Proxy({}, {
    get(t, k) {
      if (k === 'measureText') return () => ({ width: 0 });
      if (k === 'createLinearGradient' || k === 'createRadialGradient')
        return () => ({ addColorStop: noop });
      if (k === 'canvas') return { width: 0, height: 0 };
      return noop;
    },
    set() { return true; }
  });
}
function canvasStub(w, h) {
  return { width: w || 0, height: h || 0, getContext: () => ctxStub(),
           addEventListener: () => {}, style: {} };
}

const keyHandlers = { keydown: [], keyup: [], blur: [], load: [] };
let rafQueue = [];
let clock = 0;

const sandbox = {
  console,
  document: {
    getElementById: () => canvasStub(768, 720),
    createElement: () => canvasStub(),
    addEventListener: (t, f) => { (keyHandlers[t] = keyHandlers[t] || []).push(f); }
  },
  requestAnimationFrame: (f) => { rafQueue.push(f); return rafQueue.length; },
  performance: { now: () => clock },
  localStorage: {
    _d: {},
    getItem(k) { return this._d[k] === undefined ? null : this._d[k]; },
    setItem(k, v) { this._d[k] = String(v); }
  },
  AudioContext: undefined,   // 关闭音频，只测逻辑
  webkitAudioContext: undefined
};
sandbox.window = sandbox;
sandbox.window.addEventListener = (t, f) => { (keyHandlers[t] = keyHandlers[t] || []).push(f); };

vm.createContext(sandbox);
for (const f of FILES) {
  const src = fs.readFileSync(path.join(DIR, 'js', f), 'utf8');
  try { vm.runInContext(src, sandbox, { filename: f }); }
  catch (e) { console.error('加载失败 ' + f + ': ' + e.message); process.exit(1); }
}

/* ---- 按键模拟 ---- */
const held = new Set();
function fire(type, code) {
  const ev = { code, repeat: false, preventDefault: () => {} };
  for (const h of keyHandlers[type] || []) h(ev);
}
function press(code) { if (!held.has(code)) { held.add(code); fire('keydown', code); } }
function release(code) { if (held.has(code)) { held.delete(code); fire('keyup', code); } }
function setKeys(codes) {
  for (const c of [...held]) if (!codes.includes(c)) release(c);
  for (const c of codes) press(c);
}
function tap(code) { release(code); press(code); }

const { Game, Levels, World, Sprites, Entities, Font, Tiles } = sandbox;

let fails = 0, passes = 0;
function ok(cond, msg) {
  if (cond) { passes++; }
  else { fails++; console.log('  ✗ ' + msg); }
}
function section(t) { console.log('\n== ' + t + ' =='); }

/* ---- 1. 静态资源 ---- */
section('资源自检');
ok(Sprites.validate().length === 0, '精灵位图有错');
ok(Font.width('ABC', 1) === 17, '字体宽度计算异常: ' + Font.width('ABC', 1));

/* ---- 2. 关卡几何 ---- */
section('关卡几何');
for (let i = 0; i < Levels.count; i++) {
  const L = Levels.build(i);
  const tag = 'L' + L.name;
  ok(L.tiles.length === 15, tag + ' 行数不是 15');
  for (const row of L.tiles) ok(row.length === L.width, tag + ' 行宽不一致');

  // 出生点：脚下必须最终有地面，且出生位置不卡在墙里
  const sx = Math.floor(L.spawn.x / 16);
  ok(!World.isSolid(L.tiles[Math.floor(L.spawn.y / 16) - 1][sx]), tag + ' 出生点被堵');

  // 旗杆前有地面可站
  if (L.flagX != null) {
    const fx = Math.floor(L.flagX / 16);
    let hasGround = false;
    for (let y = 0; y < 15; y++) if (World.isSolid(L.tiles[y][fx])) hasGround = true;
    ok(hasGround, tag + ' 旗杆下无地面');
    ok(L.flagX < L.pixelWidth - 16, tag + ' 旗杆越界');
  }

  // 敌人不能生在实体块里
  for (const e of L.enemies) {
    const ex = Math.floor(e.x / 16), ey = Math.floor(e.y / 16) - 1;
    ok(ey >= 0 && ey < 15 && !World.isSolid(L.tiles[ey][ex]),
       tag + ' 敌人卡在方块里 @' + ex + ',' + ey);
  }
  // 金币不能埋在实体里（'o' 本身非实体，检查是否与实体重叠即可跳过）
  let coinCount = 0, qCount = 0;
  for (const row of L.tiles) for (const ch of row) {
    if (ch === 'o') coinCount++;
    if (ch === '?' || ch === 'b' || ch === 'M' || ch === 'V') qCount++;
  }
  console.log(`  ${tag}: 宽${L.width} 敌人${L.enemies.length} 空中币${coinCount} 道具块${qCount} 装饰${L.decor.length}`);
  ok(coinCount > 0, tag + ' 没有金币');
  ok(L.enemies.length > 0, tag + ' 没有敌人');
}

/* ---- 3. 启动与循环 ---- */
section('启动');
Game.init();
ok(rafQueue.length === 1, 'init 未启动主循环');
ok(Game.state === 'title', '初始状态应为 title，实为 ' + Game.state);

// 逐帧推进（直接调 step，绕过 rAF 时序）
function frames(n, keys) {
  for (let i = 0; i < n; i++) {
    if (keys) setKeys(keys);
    Game.step();
  }
}

tap('Enter');
Game.step();
ok(Game.state === 'levelstart', '按 Enter 未进入 levelstart，实为 ' + Game.state);
release('Enter');
frames(120);
ok(Game.state === 'playing', '未进入 playing，实为 ' + Game.state);
ok(Game.lives === 3, '初始命数应为 3');

const p = Game.player;

/** 回到本关起点并清空敌人，得到干净的测试场地 */
function fresh() {
  setKeys([]); tap('KeyR'); Game.step(); release('KeyR');
  let n = 0;
  while (Game.state !== 'playing' && n++ < 300) Game.step();
  Game.ents.length = 0;
  frames(30, []);
}

/* ---- 4. 物理 ---- */
section('物理');
Game.ents.length = 0;
frames(40, []);
ok(p.onGround, '静止 40 帧后仍未落地 (y=' + p.y.toFixed(1) + ')');
ok(p.y + p.h === 208, '落地脚底应贴 y=208，实为 ' + (p.y + p.h));

// 走路
const x0 = p.x;
frames(60, ['ArrowRight']);
ok(p.x > x0 + 40, '按右 60 帧位移不足: ' + (p.x - x0).toFixed(1));
ok(p.vx > 1.0, '行走速度偏低: ' + p.vx.toFixed(2));
ok(p.onGround, '平地行走途中离地');

// 跑步更快
fresh();
frames(60, ['ArrowRight', 'KeyX']);
const runV = p.vx;
fresh();
frames(60, ['ArrowRight']);
const walkV = p.vx;
ok(runV > walkV + 0.5, `跑速(${runV.toFixed(2)}) 应明显高于走速(${walkV.toFixed(2)})`);

// 跳跃：按住更高
fresh();
const groundY = p.y;
tap('KeyZ');
let peakLong = groundY;
for (let i = 0; i < 45; i++) { setKeys(['KeyZ']); Game.step(); peakLong = Math.min(peakLong, p.y); }
const longH = groundY - peakLong;
ok(longH > 40, '按住跳跃高度不足: ' + longH.toFixed(1));
frames(60, []);
ok(p.onGround, '跳跃后未落地');
ok(p.y === groundY, '落地高度漂移: ' + p.y + ' vs ' + groundY);

fresh();
release('KeyZ'); Game.step();
press('KeyZ'); Game.step(); release('KeyZ');
let peakShort = p.y;
for (let i = 0; i < 45; i++) { Game.step(); peakShort = Math.min(peakShort, p.y); }
const shortH = groundY - peakShort;
ok(shortH < longH - 8, `短跳(${shortH.toFixed(1)}) 应明显低于长跳(${longH.toFixed(1)})`);
ok(shortH > 12, '短跳几乎跳不起来: ' + shortH.toFixed(1));

/* ---- 5. 不穿墙（跑跳穿越整关） ---- */
section('碰撞');
function embedded() {
  const L = Game.level;
  const tx0 = Math.floor(p.x / 16), tx1 = Math.floor((p.x + p.w - 1e-6) / 16);
  const ty0 = Math.floor(p.y / 16), ty1 = Math.floor((p.y + p.h - 1e-6) / 16);
  for (let ty = ty0; ty <= ty1; ty++)
    for (let tx = tx0; tx <= tx1; tx++) {
      if (ty < 0 || ty >= 15 || tx < 0 || tx >= L.width) continue;
      if (World.isSolid(L.tiles[ty][tx])) return true;
    }
  return false;
}
fresh();
let stuck = 0, maxX = 0;
for (let i = 0; i < 1200; i++) {
  const keys = ['ArrowRight', 'KeyX'];
  if (i % 32 < 14) keys.push('KeyZ');   // 周期性起跳
  setKeys(keys);
  Game.step();
  if (Game.state !== 'playing') break;
  if (embedded()) stuck++;
  maxX = Math.max(maxX, p.x);
}
ok(stuck === 0, '玩家嵌入实体瓦片 ' + stuck + ' 帧');
ok(maxX > 1200, '跑跳 1200 帧推进不足: ' + maxX.toFixed(0));
console.log('  跑跳推进到 x=' + maxX.toFixed(0) + '（关卡宽 ' + Game.level.pixelWidth + '）');

/* ---- 6. 踩敌人 ---- */
section('战斗');
fresh();
let g1 = new Entities.Goomba(p.x + 40, p.y + p.h);
Game.ents.push(g1);
frames(10, []);
ok(!g1.dead, '板栗仔一出生就死了');
// 跳到板栗仔头上
const sc0 = Game.score;
p.x = g1.x - 2; p.y = g1.y - 30; p.vy = 2;
let stomped = false;
for (let i = 0; i < 30; i++) { Game.step(); if (g1.dead) { stomped = true; break; } }
ok(stomped, '踩踏未判定为击杀');
ok(Game.score > sc0, '踩踏未加分');
ok(p.vy < 0, '踩踏后没有回弹: vy=' + p.vy.toFixed(2));

// 侧面撞敌人应受伤
fresh();
const lives0 = Game.lives;
let g2 = new Entities.Goomba(p.x + 30, p.y + p.h);
Game.ents.push(g2);
let hurtSeen = false;
for (let i = 0; i < 120; i++) {
  setKeys(['ArrowRight']);
  Game.step();
  if (Game.state === 'dying') { hurtSeen = true; break; }
}
ok(hurtSeen, '侧面撞板栗仔没有受伤');
while (Game.state !== 'playing') Game.step();
ok(Game.lives === lives0 - 1, '死亡未扣命: ' + Game.lives + ' vs ' + lives0);

// 乌龟踩一下变壳，踢出去能连杀
fresh();
let k = new Entities.Koopa(p.x + 40, p.y + p.h);
Game.ents.push(k);
p.x = k.x - 2; p.y = k.y - 34; p.vy = 2;
let shell = null;
for (let i = 0; i < 40; i++) {
  Game.step();
  shell = Game.ents.find(e => e.type === 'shell');
  if (shell) break;
}
ok(!!shell, '踩乌龟未变成龟壳');
if (shell) {
  shell.kick(1, null);
  ok(shell.moving && Math.abs(shell.vx) > 2, '龟壳踢出后未滑行');
}

/* ---- 7. 道具 ---- */
section('道具');

/** 站到指定瓦片列的地面上，然后起跳顶头顶的块 */
function standUnder(tileX) {
  p.x = tileX * 16 + 2;
  p.y = 11 * 16;          // 悬空，靠重力落到地面
  p.vx = 0; p.vy = 0;
  p.onGround = false;     // 清掉传送前的旧状态，保证下面的循环真的跑
  setKeys([]);
  for (let i = 0; i < 60 && !p.onGround; i++) Game.step();
  frames(4, []);
  return p.onGround;
}

fresh();
// 顶 1-1 的道具块（tile 21, row 9），玩家须站在下方地面起跳
ok(standUnder(21), '站位失败：未落到地面');
release('KeyZ'); Game.step();
press('KeyZ');
let mush = null;
for (let i = 0; i < 60; i++) {
  Game.step();
  mush = Game.ents.find(e => e.type === 'mushroom');
  if (mush) break;
}
release('KeyZ');
ok(!!mush, '顶道具块没有出蘑菇');
ok(World.tileAt(Game.level, 21, 9) === 'U', '道具块顶完未变成已用块');
if (mush) {
  // 直接把蘑菇搬到玩家脚下吃掉
  setKeys([]); frames(30, []);
  mush.emerge = 0;
  mush.x = p.x; mush.y = p.y + p.h - 16;
  frames(6, []);
  ok(p.power >= 1, '吃蘑菇没变大: power=' + p.power);
  ok(p.h === 30, '变大后碰撞盒没变高: h=' + p.h);
  frames(40, []);
  ok(!embedded(), '变大后被卡进方块');
}

// 火焰花 + 发射火球
const fl = new Entities.Flower(p.x, p.y + p.h - 16);
fl.emerge = 0;
Game.ents.push(fl);
frames(6, []);
ok(p.power === 2, '吃花没进入火力状态: power=' + p.power);
frames(40, []);
release('KeyX'); Game.step();
press('KeyX'); Game.step();
const fb = Game.ents.find(e => e.type === 'fireball');
ok(!!fb, '火力状态下未能发射火球');
release('KeyX');

/** 直接把玩家设成大号（重开关卡会重置状态，故单独提供） */
function makeBig(power) {
  if (p.h !== 30) { p.y -= 15; p.h = 30; }
  p.power = power || 1;
  p.growTimer = 0;
  p.shrinking = false;
  p.invuln = 0;
}

// 大号撞砖块应打碎
fresh();
const brickX = 20; // 1-1 row 9 的 'B'
ok(standUnder(brickX), '砖块下方站位失败');
makeBig(1);
frames(4, []);
release('KeyZ'); Game.step();
press('KeyZ');
let broke = false;
for (let i = 0; i < 60; i++) {
  Game.step();
  if (World.tileAt(Game.level, brickX, 9) === ' ') { broke = true; break; }
}
release('KeyZ');
ok(broke, '大号马里奥没能打碎砖块');

// 受伤应变小而不是直接死
setKeys([]); frames(60, []);
makeBig(2);
const pw = p.power;
const gz = new Entities.Goomba(p.x + 20, p.y + p.h);
Game.ents.push(gz);
let shrank = false;
for (let i = 0; i < 120; i++) {
  setKeys(['ArrowRight']); Game.step();
  if (p.power < pw) { shrank = true; break; }
  if (Game.state !== 'playing') break;
}
ok(shrank, '大号受伤应先变小（power ' + pw + ' -> ' + p.power + '，状态 ' + Game.state + '）');
ok(Game.state === 'playing', '大号受伤不该直接死');

/* ---- 8. 吃金币 ---- */
section('金币');
fresh();
const c0 = Game.coins, s0 = Game.score;
// 在玩家所在行放一枚金币
const ctx0 = Math.floor((p.x + 20) / 16), cty0 = Math.floor(p.y / 16);
World.setTile(Game.level, ctx0, cty0, 'o');
for (let i = 0; i < 90; i++) { setKeys(['ArrowRight']); Game.step(); if (Game.coins > c0) break; }
ok(Game.coins === c0 + 1, '走过金币未收集: ' + Game.coins + ' vs ' + c0);
ok(Game.score > s0, '收集金币未加分');
ok(World.tileAt(Game.level, ctx0, cty0) === ' ', '金币收集后瓦片未清除');

/* ---- 9. 过关流程 ---- */
section('过关');
fresh();
const lvName = Game.level.name;
p.x = Game.level.flagX - 20;
p.y = 12 * 16 - p.h;
let advanced = false;
for (let i = 0; i < 1500; i++) {
  setKeys(['ArrowRight']);
  Game.step();
  if (Game.level.name !== lvName) { advanced = true; break; }
  if (Game.state === 'dying' || Game.state === 'gameover') break;
}
ok(advanced, '碰到旗杆后未进入下一关（状态 ' + Game.state + '，关卡 ' + Game.level.name + '）');
ok(Game.timeLeft >= 0, '时间出现负数: ' + Game.timeLeft);
console.log('  推进到 ' + Game.level.name + '，分数 ' + Game.score);

/* ---- 10. 关卡可通过性：会看路的 bot 必须能摸到每关旗杆 ---- */
section('可通过性');

/** 简易 AI：向右跑，遇坑沿/挡墙就起跳。用来验证地形本身可通过 */
function runBot(levelIdx, maxFrames) {
  Game.startGame();
  // 跳到目标关
  for (let n = 0; n < levelIdx; n++) {
    while (Game.state !== 'playing') Game.step();
    p.x = Game.level.flagX - 40; p.y = 11 * 16; p.vx = 0; p.vy = 0;
    let g = 0;
    const cur = Game.level.name;
    while (Game.level.name === cur && g++ < 3000) { setKeys(['ArrowRight']); Game.step(); }
  }
  while (Game.state !== 'playing') Game.step();
  setKeys([]);

  const L = Game.level;
  const solid = (tx, ty) => World.isSolid(World.tileAt(L, tx, ty));

  // 每列最高落脚面（像素 y），null 表示该列是坑
  const surf = [];
  for (let x = 0; x < L.width; x++) {
    let s = null;
    for (let y = 0; y < 15; y++) if (World.isSolid(L.tiles[y][x])) { s = y * 16; break; }
    surf.push(s);
  }

  // 用与游戏一致的物理，算「按住 hold 帧」能否跨过 needDx 且净上升 needRise
  const PH = { maxRun: 2.6, jumpVelRun: -6.1, gravity: 0.5, gravityHold: 0.18, maxFall: 7.5 };
  function clears(hold, needDx, needRise) {
    let x = 0, y = 0, vy = PH.jumpVelRun;
    for (let f = 0; f < 90; f++) {
      x += PH.maxRun;
      const holding = (f < hold && vy < 0);
      vy = Math.min(vy + (holding ? PH.gravityHold : PH.gravity), PH.maxFall);
      y += vy;
      if (x >= needDx && -y >= needRise) return true;
      if (y > 260) return false;
    }
    return false;
  }
  function neededHold(needDx, needRise) {
    for (let h = 2; h <= 44; h += 2) if (clears(h, needDx, needRise)) return h + 2;
    return 44;
  }

  let jumpHold = 0, best = 0, deathX = null;

  for (let i = 0; i < maxFrames; i++) {
    Game.ents.length = 0;                    // 只验地形，排除敌人
    const footRow = Math.floor((p.y + p.h) / 16);
    const rightTile = Math.floor((p.x + p.w - 1e-6) / 16);
    const bodyRow = Math.floor((p.y + p.h - 4) / 16);

    if (p.onGround && jumpHold === 0) {
      if (!solid(rightTile + 1, footRow)) {
        // 到坑沿：找对面落脚点，算出这一跳需要按多久
        let n = rightTile + 1;
        while (n < L.width && surf[n] === null) n++;
        if (n < L.width) {
          const needDx = (n * 16) - (p.x + p.w) + 6;
          const needRise = (p.y + p.h) - surf[n];
          jumpHold = neededHold(Math.max(8, needDx), Math.max(0, needRise));
        } else jumpHold = 30;
      } else if (solid(rightTile + 1, bodyRow)) {
        jumpHold = 12;                        // 台阶/水管：小跳即可
      }
    }

    const keys = ['ArrowRight', 'KeyX'];
    if (jumpHold > 0) { keys.push('KeyZ'); jumpHold--; }
    else release('KeyZ');
    setKeys(keys);
    Game.step();

    best = Math.max(best, p.x);
    if (Game.clear) return { ok: true, x: p.x, frames: i };
    if (Game.state !== 'playing') { deathX = p.x; break; }
  }
  return { ok: false, x: best, death: deathX };
}

for (let li = 0; li < Levels.count; li++) {
  const r = runBot(li, 4000);
  const L = Game.level;
  const flagTile = Math.floor(L.flagX / 16);
  ok(r.ok, `${L.name} 地形走不通：${r.death != null ? '掉坑于' : '止步'} x=${r.x.toFixed(0)}` +
           ` (tile ${Math.floor(r.x / 16)})，旗杆在 tile ${flagTile}`);
  if (r.ok) console.log(`  ${L.name}: bot 用 ${r.frames} 帧摸到旗杆`);
}

/* ---- 11. 水管、食人花与 Boss ---- */
section('水管与Boss');

// 1-1 的高管按下后应进入 1-2，并保留当前能力状态。
Game.startGame(0);
while (Game.state !== 'playing') Game.step();
makeBig(2);
Game.ents.length = 0;
const pipeTopY = 9 * 16;
p.x = 57 * 16 + 10;
p.y = pipeTopY - p.h;
p.vx = 0; p.vy = 0; p.onGround = true;
setKeys(['ArrowDown']);
Game.step();
ok(!!Game.pipeTransition, '站在可传送水管上按下未开始下潜');
frames(32, ['ArrowDown']);
ok(Game.level.name === '1-2', '水管未传送到地下关: ' + Game.level.name);
ok(p.power === 2 && p.h === 30, '水管传送未保留玩家能力状态');

// 城堡关应生成食人花和库巴；玩家远离管口时食人花会冒出。
Game.startGame(3);
while (Game.state !== 'playing') Game.step();
const plant = Game.ents.find(e => e.type === 'piranha');
const boss = Game.ents.find(e => e.type === 'bowser');
ok(!!plant, '1-4 未生成食人花');
ok(!!boss, '1-4 未生成库巴');
if (plant) {
  frames(50, []);
  ok(plant.phase === 'visible' && !plant.harmless, '食人花未按周期冒出');
  makeBig(1);
  p.x = plant.x;
  p.y = plant.y;
  p.vx = 0; p.vy = 0; p.invuln = 0;
  Game.step();
  ok(p.power === 0 && Game.state === 'playing', '可见食人花未伤害玩家');
}

// 库巴撞墙要折返，火球应消耗库巴生命。
if (boss) {
  p.x = 48; p.y = 13 * 16 - p.h; p.vx = 0; p.vy = 0;
  boss.x = 152 * 16 - boss.w - 0.1;
  boss.y = 13 * 16 - boss.h;
  boss.vx = 0.8; boss.vy = 0;
  Game.step();
  ok(boss.vx < 0, '库巴撞墙后未折返');

  const hp0 = boss.hp;
  Game.ents.push(new Entities.Fireball(boss.x, boss.y + 8, 1));
  Game.step();
  ok(boss.hp === hp0 - 1, '玩家火球未伤害库巴');

  // 龟壳重叠多帧只能造成一次伤害，不能一只壳瞬间清空全部 HP。
  frames(20, []);
  const hp1 = boss.hp;
  const bossShell = new Entities.Shell(boss.x - 2, boss.y + 16);
  bossShell.moving = true; bossShell.vx = 3.2;
  Game.ents.push(bossShell);
  Game.step();
  const hpAfterShell = boss.hp;
  frames(8, []);
  ok(hpAfterShell === hp1 - 1 && boss.hp === hpAfterShell,
     '龟壳对库巴发生连续多帧伤害');
}

// 只越过斧头的 X 坐标不能通关，玩家必须在斧头高度发生接触。
p.x = Game.level.axeX;
p.y = 100;
p.vx = 0; p.vy = 0; p.onGround = false;
setKeys([]);
Game.step();
ok(!Game.clear, '玩家从斧头上方越过也触发了通关');
p.x = Game.level.axeX - p.w + 1;
p.y = 13 * 16 - p.h;
p.vx = 0; p.vy = 0; p.onGround = true;
setKeys(['ArrowRight']);
Game.step();
ok(!!Game.clear && Game.clear.phase === 'boss', '触碰斧头未开始 Boss 关结算');
if (boss) ok(boss.dead, '触碰斧头后库巴仍存活');

/* ---- 12. 四关全通 ---- */
section('全通');
Game.startGame();
while (Game.state !== 'playing') Game.step();
let guard = 0, seen = {}, ported = {};
while (Game.state !== 'win' && guard++ < 8000) {
  if (Game.state === 'playing') seen[Game.level.name] = true;
  // 每关只传送一次到旗杆附近，之后让它自己跑完过关流程
  if (Game.state === 'playing' && !Game.clear && !ported[Game.level.name]) {
    ported[Game.level.name] = true;
    p.x = (Game.level.flagX != null ? Game.level.flagX : Game.level.axeX) - 40;
    p.y = 11 * 16;
    p.vx = 0; p.vy = 0;
  }
  setKeys(['ArrowRight']);
  Game.step();
}
ok(Game.state === 'win', '通完全部关卡未进入 win，实为 ' + Game.state + '（guard=' + guard + '）');
ok(Object.keys(seen).length === Levels.count, '未经过全部关卡: ' + Object.keys(seen).join(','));

/* ---- 13. 存档与触屏重开 ---- */
section('存档与重开');
ok(Game.worldsCleared === Levels.count, '全通后未记录全部世界: ' + Game.worldsCleared);
ok(sandbox.localStorage.getItem('mario_cleared') === String(Levels.count),
   '全通进度未写入存档: ' + sandbox.localStorage.getItem('mario_cleared'));

// C 从标题继续到最后一个可用世界。
setKeys([]); Game.state = 'title'; Game.step();
press('KeyC'); Game.step(); release('KeyC');
ok(Game.state === 'levelstart', '按 C 未进入关卡开始画面: ' + Game.state);
ok(Game.level.name === '1-4', '按 C 未继续到最后可用世界: ' + Game.level.name);

// 触屏的跳跃键同样应能在结束画面立即开始新局。
setKeys([]); Game.state = 'gameover'; Game.step();
press('KeyZ'); Game.step(); release('KeyZ');
ok(Game.state === 'levelstart', '结束画面按跳跃未开始新局: ' + Game.state);
ok(Game.level.name === '1-1', '新局未从第一关开始: ' + Game.level.name);

/* ---- 14. 渲染不报错 ---- */
section('渲染');
let renderErr = null;
try {
  for (const st of ['title', 'levelstart', 'playing', 'gameover', 'win']) {
    Game.state = st;
    // playing 状态必须能在实体 update 前完成首帧渲染。
    for (let i = 0; i < 3; i++) Game.render();
    if (st === 'playing') Game.step();
  }
} catch (e) { renderErr = e; }
ok(!renderErr, '渲染抛异常: ' + (renderErr && renderErr.stack));

console.log(`\n通过 ${passes} / 失败 ${fails}`);
process.exitCode = fails ? 1 : 0;
