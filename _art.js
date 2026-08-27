/* 把位图渲染成字符画，肉眼核对像素画是否画对 */
const fs = require('fs'), path = require('path'), vm = require('vm');
const sb = { console, document: { createElement: () => ({ width: 0, height: 0, getContext: () => ({ fillRect(){}, set fillStyle(v){} }) }) } };
sb.window = sb;
vm.createContext(sb);
vm.runInContext(fs.readFileSync(path.join(__dirname, 'js', 'sprites.js'), 'utf8'), sb, { filename: 'sprites.js' });
const { Sprites } = sb;

// 每种颜色给一个可辨认的字符
const MARK = {
  'R': '#', 'r': '%',      // 红 / 暗红
  'S': '.', 'C': ',',      // 皮肤 / 奶油
  'N': 'N',                // 棕（头发鞋）
  'B': 'B',                // 蓝背带
  'Y': 'y', 'y': 'o',      // 黄 / 暗金
  'W': 'W',                // 白
  'K': '@',                // 黑描边
  'T': 'T', 'F': 'f',      // 板栗仔身体 / 脚
  'g': 'g', 'G': 'G',      // 绿 / 暗绿
  'E': 'E', 'O': 'O',      // 米色 / 橙
  'o': 'c'
};

function show(name) {
  const rows = Sprites.DEFS[name];
  console.log('\n--- ' + name + ' (' + rows[0].length + 'x' + rows.length + ') ---');
  for (const row of rows) {
    let s = '';
    for (const ch of row) s += (ch === '.' ? ' ' : (MARK[ch] || ch));
    console.log('|' + s + '|');
  }
}

const which = process.argv.slice(2);
const list = which.length ? which : ['mario_small_idle', 'mario_small_walk1', 'mario_big_idle', 'goomba', 'koopa1', 'shell', 'mushroom', 'flower'];
for (const n of list) show(n);
