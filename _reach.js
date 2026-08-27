/* 验证 1-3 的平台间跳跃在物理上是否成立 */
const fs = require('fs'), path = require('path'), vm = require('vm');
const sb = { console };
sb.window = sb;
vm.createContext(sb);
for (const f of ['world.js', 'levels.js']) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, 'js', f), 'utf8'), sb, { filename: f });
}
const { Levels, World } = sb;

// 与 game.js 保持一致
const P = { maxRun: 2.6, jumpVelRun: -6.1, gravity: 0.5, gravityHold: 0.18, maxFall: 7.5 };

/** 从平台边缘全速起跳，按住跳跃键：返回轨迹 [{dx, dy}]（dy 负为上升） */
function trajectory(frames) {
  const pts = [];
  let x = 0, y = 0, vy = P.jumpVelRun, jumping = true;
  for (let i = 0; i < frames; i++) {
    x += P.maxRun;
    const g = (jumping && vy < 0) ? P.gravityHold : P.gravity;
    vy = Math.min(vy + g, P.maxFall);
    y += vy;
    pts.push({ f: i + 1, dx: x, dy: y });
  }
  return pts;
}
const TRAJ = trajectory(120);

/** 水平跨 gapPx、净上升 risePx 的跳跃是否可行 */
function canJump(gapPx, risePx) {
  for (const p of TRAJ) {
    if (p.dx >= gapPx && -p.dy >= risePx) return { ok: true, frames: p.f, dx: p.dx, up: -p.dy };
  }
  return { ok: false };
}

console.log('运行参数: 跑速 ' + P.maxRun + ' px/帧, 跑跳初速 ' + P.jumpVelRun + ', 上升重力 ' + P.gravityHold);
console.log('跳跃轨迹采样 (帧: 水平px / 高度px):');
for (const f of [10, 15, 20, 25, 30, 34, 40]) {
  const p = TRAJ[f - 1];
  console.log('  帧' + String(f).padStart(2) + ': dx=' + p.dx.toFixed(0).padStart(3) + '  高度=' + (-p.dy).toFixed(1));
}

for (let li = 0; li < Levels.count; li++) {
  const L = Levels.build(li);
  console.log('\n=== ' + L.name + ' ===');
  // 每列最高可站立面（自上而下第一个实体格的顶）
  const surf = [];
  for (let x = 0; x < L.width; x++) {
    let s = null;
    for (let y = 0; y < 15; y++) if (World.isSolid(L.tiles[y][x])) { s = y * 16; break; }
    surf.push(s);
  }
  let problems = 0;
  let x = 0;
  while (x < L.width - 1) {
    if (surf[x] === null) { x++; continue; }
    if (surf[x + 1] !== null) { x++; continue; }
    // x 是坑沿，向右找下一个落脚点
    let n = x + 1;
    while (n < L.width && surf[n] === null) n++;
    if (n >= L.width) break;
    const gapTiles = n - x - 1;
    const gapPx = gapTiles * 16;
    const rise = surf[x] - surf[n];    // 正=需要上升
    const r = canJump(gapPx + 4, Math.max(0, rise));
    const tag = r.ok ? '可跳(' + r.frames + '帧)' : '★跳不过★';
    console.log('  坑 tile ' + (x + 1) + '..' + (n - 1) + ' 宽' + gapTiles + '格(' + gapPx +
                'px) 落差' + (rise > 0 ? '上升' + rise : rise < 0 ? '下降' + (-rise) : '平') + 'px -> ' + tag);
    if (!r.ok) problems++;
    x = n;
  }
  console.log(problems ? '  ⚠ ' + problems + ' 处不可跳' : '  全部坑位可跳');
}
