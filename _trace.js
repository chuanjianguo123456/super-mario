/* 跟踪 bot 在 1-3 tile 76..90 的实际状态 */
const fs = require('fs'), path = require('path'), vm = require('vm');
const FILES = ['font.js','sprites.js','tiles.js','input.js','audio.js','levels.js','world.js','entities.js','game.js'];
function cs(){const n=()=>{};return new Proxy({},{get(t,k){if(k==='measureText')return()=>({width:0});if(k==='createLinearGradient')return()=>({addColorStop:n});return n;},set(){return true;}});}
function cv(w,h){return{width:w||0,height:h||0,getContext:()=>cs(),style:{},addEventListener:()=>{}};}
const kh={};
const sb={console,document:{getElementById:()=>cv(768,720),createElement:()=>cv(),addEventListener:(t,f)=>{(kh[t]=kh[t]||[]).push(f);}},
  requestAnimationFrame:()=>1,performance:{now:()=>0},
  localStorage:{_d:{},getItem(k){return this._d[k]??null;},setItem(k,v){this._d[k]=String(v);}}};
sb.window=sb; sb.window.addEventListener=(t,f)=>{(kh[t]=kh[t]||[]).push(f);};
vm.createContext(sb);
for(const f of FILES) vm.runInContext(fs.readFileSync(path.join(__dirname,'js',f),'utf8'),sb,{filename:f});
const {Game,World}=sb;

const held=new Set();
const fire=(t,c)=>{for(const h of kh[t]||[])h({code:c,repeat:false,preventDefault(){}});};
const press=c=>{if(!held.has(c)){held.add(c);fire('keydown',c);}};
const release=c=>{if(held.has(c)){held.delete(c);fire('keyup',c);}};
const setKeys=cs2=>{for(const c of [...held])if(!cs2.includes(c))release(c);for(const c of cs2)press(c);};

Game.init();
press('Enter'); Game.step(); release('Enter');
// 传送过 1-1、1-2 到 1-3
const p = Game.player;
for (let n = 0; n < 2; n++) {
  while (Game.state !== 'playing') Game.step();
  p.x = Game.level.flagX - 40; p.y = 11*16; p.vx=0; p.vy=0;
  const cur = Game.level.name; let g=0;
  while (Game.level.name === cur && g++ < 3000) { setKeys(['ArrowRight']); Game.step(); }
}
while (Game.state !== 'playing') Game.step();
setKeys([]);
const L = Game.level;
console.log('当前关卡: ' + L.name);

const surf=[];
for(let x=0;x<L.width;x++){let s=null;for(let y=0;y<15;y++)if(World.isSolid(L.tiles[y][x])){s=y*16;break;}surf.push(s);}
console.log('落脚面 tile 74..92:');
for(let x=74;x<=92;x++) console.log('  tile '+x+': '+(surf[x]===null?'坑':'y='+surf[x]));

const PH={maxRun:2.6,jumpVelRun:-6.1,gravity:0.5,gravityHold:0.18,maxFall:7.5};
function clears(hold,dx,rise){let x=0,y=0,vy=PH.jumpVelRun;
 for(let f=0;f<90;f++){x+=PH.maxRun;const h=(f<hold&&vy<0);vy=Math.min(vy+(h?PH.gravityHold:PH.gravity),PH.maxFall);y+=vy;
  if(x>=dx&&-y>=rise)return true; if(y>260)return false;} return false;}
function needHold(dx,rise){for(let h=2;h<=44;h+=2)if(clears(h,dx,rise))return h+2;return 44;}

const solid=(tx,ty)=>World.isSolid(World.tileAt(L,tx,ty));
let hold=0;
const log=[];
for (let i=0;i<900;i++){
  Game.ents.length=0;
  const footRow=Math.floor((p.y+p.h)/16);
  const rt=Math.floor((p.x+p.w-1e-6)/16);
  const bodyRow=Math.floor((p.y+p.h-4)/16);
  let note='';
  if(p.onGround&&hold===0){
    if(!solid(rt+1,footRow)){
      let n=rt+1; while(n<L.width&&surf[n]===null)n++;
      if(n<L.width){const dx=(n*16)-(p.x+p.w)+6, rise=(p.y+p.h)-surf[n];
        hold=needHold(Math.max(8,dx),Math.max(0,rise));
        note='坑沿跳 dx='+dx.toFixed(0)+' rise='+rise+' hold='+hold+' 目标tile='+n;}
      else {hold=30;note='坑沿跳(无目标)';}
    } else if(solid(rt+1,bodyRow)){hold=12;note='墙跳';}
  }
  const keys=['ArrowRight','KeyX'];
  if(hold>0){keys.push('KeyZ');hold--;} else release('KeyZ');
  setKeys(keys);
  Game.step();
  const tile=Math.floor(p.x/16);
  if(tile>=74&&tile<=92) log.push('t'+tile+' x='+p.x.toFixed(1)+' y='+p.y.toFixed(1)+' vx='+p.vx.toFixed(2)+' vy='+p.vy.toFixed(2)+' g='+(p.onGround?1:0)+' hold='+hold+(note?'  << '+note:''));
  if(Game.clear){console.log('\n摸到旗杆，帧 '+i);break;}
  if(Game.state!=='playing'){console.log('\n死亡 x='+p.x.toFixed(0)+' tile '+Math.floor(p.x/16));break;}
}
console.log('\ntile 74..92 轨迹:');
for(const l of log) console.log('  '+l);
