/* 诊断：打印关卡局部地形 + 跟踪卡住位置与顶块过程 */
const fs = require('fs'), path = require('path'), vm = require('vm');
const DIR = __dirname;
const FILES = ['font.js','sprites.js','tiles.js','input.js','audio.js','levels.js','world.js','entities.js','game.js'];

function ctxStub(){const n=()=>{};return new Proxy({},{get(t,k){if(k==='measureText')return()=>({width:0});if(k==='createLinearGradient')return()=>({addColorStop:n});return n;},set(){return true;}});}
function cv(w,h){return{width:w||0,height:h||0,getContext:()=>ctxStub(),style:{},addEventListener:()=>{}};}
const kh={};let raf=[];
const sb={console,document:{getElementById:()=>cv(768,720),createElement:()=>cv(),addEventListener:(t,f)=>{(kh[t]=kh[t]||[]).push(f);}},
  requestAnimationFrame:f=>{raf.push(f);return 1;},performance:{now:()=>0},
  localStorage:{_d:{},getItem(k){return this._d[k]??null;},setItem(k,v){this._d[k]=String(v);}}};
sb.window=sb; sb.window.addEventListener=(t,f)=>{(kh[t]=kh[t]||[]).push(f);};
vm.createContext(sb);
for(const f of FILES) vm.runInContext(fs.readFileSync(path.join(DIR,'js',f),'utf8'),sb,{filename:f});
const {Game,Levels,World,Entities}=sb;

const held=new Set();
const fire=(t,c)=>{for(const h of kh[t]||[])h({code:c,repeat:false,preventDefault(){}});};
const press=c=>{if(!held.has(c)){held.add(c);fire('keydown',c);}};
const release=c=>{if(held.has(c)){held.delete(c);fire('keyup',c);}};
const setKeys=cs=>{for(const c of [...held])if(!cs.includes(c))release(c);for(const c of cs)press(c);};

function dumpArea(L, x0, x1, label) {
  console.log('\n--- ' + label + ' (tile ' + x0 + '..' + x1 + ') ---');
  let hdr = '    ';
  for (let x = x0; x <= x1; x++) hdr += String(x % 10);
  console.log(hdr);
  for (let y = 0; y < 15; y++) {
    let s = String(y).padStart(2, ' ') + ': ';
    for (let x = x0; x <= x1; x++) s += L.tiles[y][x];
    console.log(s);
  }
}

const L0 = Levels.build(0);
dumpArea(L0, 40, 62, '1-1 卡住区域附近');

/* 跑跳穿越，记录卡住位置 */
Game.init();
press('Enter'); Game.step(); release('Enter');
while (Game.state !== 'playing') Game.step();
Game.ents.length = 0;
const p = Game.player;

let maxX = 0, stallAt = null, hist = [];
for (let i = 0; i < 1500; i++) {
  const keys = ['ArrowRight', 'KeyX'];
  if (i % 32 < 14) keys.push('KeyZ');
  setKeys(keys);
  Game.step();
  if (Game.state !== 'playing') { console.log('\n中断于状态 ' + Game.state + ' @x=' + p.x.toFixed(0)); break; }
  if (p.x > maxX) { maxX = p.x; }
  hist.push({ i, x: +p.x.toFixed(1), y: +p.y.toFixed(1), vx: +p.vx.toFixed(2), vy: +p.vy.toFixed(2), g: p.onGround });
}
console.log('\n跑跳最远 x=' + maxX.toFixed(1) + ' (tile ' + Math.floor(maxX / 16) + ')');
console.log('最后 12 帧:');
for (const h of hist.slice(-12)) console.log('  ' + JSON.stringify(h));

/* 顶块诊断 */
console.log('\n=== 顶块诊断 ===');
setKeys([]); press('KeyR'); Game.step(); release('KeyR');
while (Game.state !== 'playing') Game.step();
Game.ents.length = 0;
for (let i = 0; i < 30; i++) Game.step();

console.log('1-1 第9行 tile 16..24: "' + Game.level.tiles[9].slice(16, 25).join('') + '"');
console.log('玩家 h=' + p.h + ' 落地 y=' + p.y + ' 脚底=' + (p.y + p.h));

p.x = 21 * 16 + 2; p.y = 10 * 16 - p.h; p.vy = 0;
console.log('放置到 x=' + p.x + ' y=' + p.y + ' 头顶=' + p.y + ' 目标块 row9 底边=' + (10 * 16));
for (let i = 0; i < 6; i++) Game.step();
console.log('落地后 y=' + p.y + ' onGround=' + p.onGround + ' 脚底=' + (p.y + p.h) + ' (tile row ' + ((p.y + p.h) / 16) + ')');

release('KeyZ'); Game.step(); press('KeyZ');
for (let i = 0; i < 50; i++) {
  Game.step();
  const t = World.tileAt(Game.level, 21, 9);
  if (i < 22) console.log('  帧' + i + ' y=' + p.y.toFixed(1) + ' vy=' + p.vy.toFixed(2) + ' 头顶tile=' + Math.floor(p.y / 16) + ' row9[21]=' + t + ' 实体数=' + Game.ents.length);
  if (t === 'U') { console.log('  -> 块已变 U，帧 ' + i); break; }
}
console.log('实体: ' + Game.ents.map(e => e.type + '@' + e.x.toFixed(0) + ',' + e.y.toFixed(0)).join(' | '));
