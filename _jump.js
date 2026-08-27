/* 跳跃轨迹表：确认 1-3 最难那跳需要按多久 */
const PH = { maxRun: 2.6, jumpVelRun: -6.1, gravity: 0.5, gravityHold: 0.18, maxFall: 7.5 };

function sim(hold) {
  let x = 0, y = 0, vy = PH.jumpVelRun;
  const pts = [];
  for (let f = 0; f < 80; f++) {
    x += PH.maxRun;
    const holding = (f < hold && vy < 0);
    vy = Math.min(vy + (holding ? PH.gravityHold : PH.gravity), PH.maxFall);
    y += vy;
    pts.push({ f: f + 1, x: x, up: -y });
  }
  return pts;
}

console.log('hold  峰值   到dx=70时高度  到dx=85时高度');
for (const hold of [8, 12, 16, 20, 24, 28, 32, 40]) {
  const pts = sim(hold);
  const peak = Math.max.apply(null, pts.map(p => p.up));
  const a = pts.find(p => p.x >= 70);
  const b = pts.find(p => p.x >= 85);
  console.log(
    String(hold).padStart(4) + '  ' + peak.toFixed(1).padStart(5) + '  ' +
    (a ? a.up.toFixed(1) : '-').padStart(12) + '  ' +
    (b ? b.up.toFixed(1) : '-').padStart(12)
  );
}

// 需要跨 needDx 且净上升 needRise 时，最小 hold
function minHold(needDx, needRise) {
  for (let h = 2; h <= 44; h += 2) {
    const pts = sim(h);
    if (pts.some(p => p.x >= needDx && p.up >= needRise)) return h;
  }
  return null;
}
console.log('\n1-3 最难跳（上升 48px）所需最小 hold:');
for (const dx of [70, 78, 85, 92]) {
  console.log('  dx=' + dx + ' -> hold=' + minHold(dx, 48));
}
console.log('\n1-1 台阶小跳（上升 16px, dx=20）-> hold=' + minHold(20, 16));
