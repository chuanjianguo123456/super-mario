/* 世界层：瓦片查询与 AABB 碰撞解算 */
var World = (function () {
  var T = 16;

  // 实体无法穿过的瓦片
  var SOLID = { 'X': 1, 'B': 1, 'b': 1, '?': 1, 'M': 1, 'V': 1, 'U': 1, 'S': 1,
                'L': 1, 'R': 1, 'l': 1, 'r': 1 };
  // 可被顶的块
  var BUMPABLE = { 'B': 1, 'b': 1, '?': 1, 'M': 1, 'V': 1 };

  // 碰撞盒是半开区间 [x, x+w)；坐标为小数时不能用 -1 求边界所在瓦片
  var EPS = 1e-6;
  function lo(v) { return Math.floor(v / T); }
  function hi(v) { return Math.floor((v - EPS) / T); }

  function tileAt(level, tx, ty) {
    if (tx < 0 || tx >= level.width) return 'X';   // 左右边界视为墙
    if (ty < 0 || ty >= level.height) return ' ';  // 上下开放
    return level.tiles[ty][tx];
  }

  function setTile(level, tx, ty, ch) {
    if (tx < 0 || tx >= level.width || ty < 0 || ty >= level.height) return;
    level.tiles[ty][tx] = ch;
  }

  function isSolid(ch) { return !!SOLID[ch]; }
  function isBumpable(ch) { return !!BUMPABLE[ch]; }

  function solidAtPixel(level, px, py) {
    return isSolid(tileAt(level, Math.floor(px / T), Math.floor(py / T)));
  }

  /** 水平移动并解算；返回是否撞墙 */
  function moveX(level, e) {
    e.x += e.vx;
    if (e.x < 0) { e.x = 0; e.vx = 0; return true; }
    var maxX = level.pixelWidth - e.w;
    if (e.x > maxX) { e.x = maxX; e.vx = 0; return true; }
    if (e.vx === 0) return false;

    var y0 = lo(e.y), y1 = hi(e.y + e.h);
    var hit = false;
    if (e.vx > 0) {
      var cr = hi(e.x + e.w);
      for (var y = y0; y <= y1; y++) {
        if (isSolid(tileAt(level, cr, y))) { e.x = cr * T - e.w; e.vx = 0; hit = true; break; }
      }
    } else {
      var cl = lo(e.x);
      for (var y2 = y0; y2 <= y1; y2++) {
        if (isSolid(tileAt(level, cl, y2))) { e.x = (cl + 1) * T; e.vx = 0; hit = true; break; }
      }
    }
    return hit;
  }

  /** 垂直移动并解算；返回 {ground, head, headTile:{tx,ty,ch}} */
  function moveY(level, e) {
    e.y += e.vy;
    var res = { ground: false, head: false, headTile: null };
    if (e.vy === 0) return res;

    var x0 = lo(e.x), x1 = hi(e.x + e.w);
    if (e.vy > 0) {
      var rb = hi(e.y + e.h);
      for (var x = x0; x <= x1; x++) {
        if (isSolid(tileAt(level, x, rb))) {
          e.y = rb * T - e.h; e.vy = 0; res.ground = true; break;
        }
      }
    } else {
      var rt = lo(e.y);
      var best = null, cxp = e.x + e.w / 2;
      for (var x2 = x0; x2 <= x1; x2++) {
        if (isSolid(tileAt(level, x2, rt))) {
          var d = Math.abs((x2 + 0.5) * T - cxp);
          if (!best || d < best.d) best = { tx: x2, ty: rt, ch: tileAt(level, x2, rt), d: d };
        }
      }
      if (best) {
        e.y = (rt + 1) * T; e.vy = 0;
        res.head = true; res.headTile = best;
      }
    }
    return res;
  }

  /** 脚下是否紧贴实体瓦片 */
  function onGround(level, e) {
    var bottom = e.y + e.h;
    if (Math.abs(bottom - Math.round(bottom)) > 0.01) return false;
    var ry = Math.round(bottom) / T;
    if (ry !== Math.floor(ry)) return false;
    var x0 = lo(e.x), x1 = hi(e.x + e.w);
    for (var x = x0; x <= x1; x++) if (isSolid(tileAt(level, x, ry))) return true;
    return false;
  }

  /** 遍历实体覆盖的瓦片，回调 (ch, tx, ty) */
  function forEachOverlap(level, e, fn) {
    var x0 = lo(e.x), x1 = hi(e.x + e.w);
    var y0 = lo(e.y), y1 = hi(e.y + e.h);
    for (var y = y0; y <= y1; y++)
      for (var x = x0; x <= x1; x++) fn(tileAt(level, x, y), x, y);
  }

  function overlaps(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  /** 检测玩家是否站在水管口，且按下键准备下潜。
      返回 { tx, ty, ch } 水管口瓦片信息，或 null */
  function pipeAtFeet(level, e) {
    if (!e || e.vy !== 0) return null;
    var foot = e.y + e.h;
    var cx = e.x + e.w / 2;
    var tx = Math.floor(cx / T);
    // 脚底必须在瓦片边界的 1px 以内
    if (Math.abs(foot - Math.round(foot / T) * T) > 2) return null;
    var ty = Math.round(foot / T);
    var ch = tileAt(level, tx, ty);
    if (ch === 'L' || ch === 'R') return { tx: tx, ty: ty, ch: ch };
    return null;
  }

  return {
    T: T, SOLID: SOLID,
    tileAt: tileAt, setTile: setTile, isSolid: isSolid, isBumpable: isBumpable,
    solidAtPixel: solidAtPixel, moveX: moveX, moveY: moveY, onGround: onGround,
    forEachOverlap: forEachOverlap, overlaps: overlaps, pipeAtFeet: pipeAtFeet
  };
})();
