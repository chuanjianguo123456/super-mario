/* 主游戏：状态机、玩家物理、相机、渲染 */
var Game = (function () {
  var T = 16;
  var VW = 256, VH = 240; // 逻辑分辨率
  var SCALE = 3;

  // 玩家物理参数
  var P = {
    walkAccel: 0.14, runAccel: 0.2, friction: 0.14,
    maxWalk: 1.55, maxRun: 2.6, turnAccel: 0.35,
    jumpVel: -5.6, jumpVelRun: -6.1,
    gravity: 0.5, gravityHold: 0.18, maxFall: 7.5,
    stompBounce: -3.6, stompBounceHold: -4.6
  };
  var COYOTE_FRAMES = 5;
  var JUMP_BUFFER_FRAMES = 6;

  var COMBO = [100, 200, 400, 500, 800, 1000, 2000, 4000, 5000, 8000];

  var canvas, ctx;
  var state = 'title';
  var stateTimer = 0;
  var frame = 0;
  var acc = 0, last = 0;
  var paused = false;

  var levelIndex = 0;
  var level = null;
  var ents = [];
  var bumps = [];
  var cam = 0, camMax = 0;

  var score = 0, coins = 0, lives = 3, highScore = 0, worldsCleared = 0;
  var timeLeft = 400, timeAcc = 0;
  var clear = null;
  var pipeTransition = null;

  var player = {
    x: 0, y: 0, w: 12, h: 15, vx: 0, vy: 0,
    face: 1, power: 0, onGround: false,
    jumping: false, walkAnim: 0, skid: false,
    invuln: 0, growTimer: 0, shrinking: false,
    dead: false, deadTimer: 0, deadBounced: false,
    stompCombo: 0, onPole: false, autoWalk: false,
    coyoteTimer: 0, jumpBufferTimer: 0,
    cometTimer: 0, cometBossTarget: null
  };

  /* ---------- 存档 ---------- */
  function loadSave() {
    try {
      highScore = parseInt(localStorage.getItem('mario_high') || '0', 10) || 0;
      worldsCleared = Math.max(0, Math.min(Levels.count,
        parseInt(localStorage.getItem('mario_cleared') || '0', 10) || 0));
      if (localStorage.getItem('mario_sound') === '0' && Sound.isEnabled()) Sound.toggle();
    } catch (e) {
      highScore = 0;
      worldsCleared = 0;
    }
  }
  function saveHigh() {
    if (score <= highScore) return;
    highScore = score;
    try { localStorage.setItem('mario_high', String(highScore)); } catch (e) {}
  }
  function recordClear(idx) {
    var cleared = Math.min(Levels.count, idx + 1);
    if (cleared <= worldsCleared) return;
    worldsCleared = cleared;
    try { localStorage.setItem('mario_cleared', String(worldsCleared)); } catch (e) {}
  }
  function saveSound() {
    try { localStorage.setItem('mario_sound', Sound.isEnabled() ? '1' : '0'); } catch (e) {}
  }

  function toggleSound() {
    var enabled = Sound.toggle();
    saveSound();
    return enabled;
  }

  function setPaused(value) {
    if (state !== 'playing') return false;
    value = !!value;
    if (paused === value) return true;
    paused = value;
    Sound.sfx.pause();
    if (paused) Sound.stopMusic(); else Sound.startMusic(level.theme);
    return true;
  }

  /* ---------- 关卡装载 ---------- */
  function loadLevel(idx, keepStats) {
    levelIndex = idx;
    level = Levels.build(idx);
    ents = [];
    bumps = [];
    cam = 0; camMax = 0;
    timeLeft = level.time; timeAcc = 0;
    clear = null;
    pipeTransition = null;

    for (var i = 0; i < level.enemies.length; i++) {
      var e = level.enemies[i];
      if (e.kind === 'g') ents.push(new Entities.Goomba(e.x, e.y));
      else if (e.kind === 'k') ents.push(new Entities.Koopa(e.x, e.y));
    }
    for (var p = 0; p < level.piranhas.length; p++) {
      var plant = level.piranhas[p];
      ents.push(new Entities.Piranha(plant.x, plant.pipeY));
    }
    if (level.boss) ents.push(new Entities.Bowser(level.boss.x, level.boss.y));

    var pw = player.power;
    var cometTimer = player.cometTimer;
    player.x = level.spawn.x;
    player.w = 12;
    player.h = keepStats && pw > 0 ? 30 : 15;
    if (!keepStats) player.power = 0;
    player.y = level.spawn.y - player.h;
    player.vx = 0; player.vy = 0;
    player.face = 1; player.onGround = false; player.jumping = false;
    player.walkAnim = 0; player.skid = false;
    player.invuln = 0; player.growTimer = 0; player.shrinking = false;
    player.dead = false; player.deadTimer = 0; player.deadBounced = false;
    player.stompCombo = 0; player.onPole = false; player.autoWalk = false;
    player.coyoteTimer = 0; player.jumpBufferTimer = 0;
    player.cometTimer = keepStats ? cometTimer : 0;
    player.cometBossTarget = null;
  }

  function spawn(e) { ents.push(e); }

  function addScore(n, x, y) {
    score += n;
    if (x != null) ents.push(new Entities.ScorePop(x, y, String(n)));
  }

  function addCoin() {
    coins++;
    score += 200;
    Sound.sfx.coin();
    if (coins >= 100) { coins -= 100; oneUp(); }
  }

  function oneUp() {
    lives++;
    Sound.sfx.oneup();
  }

  /* ---------- 顶块 ---------- */
  function bumpBlock(tx, ty, ch) {
    var px = tx * T, py = ty * T;

    if (ch === 'B') { // 空砖：大号或火力可打碎
      if (player.power > 0) {
        World.setTile(level, tx, ty, ' ');
        Sound.sfx.brick();
        addScore(50);
        var th = level.theme;
        spawn(new Entities.Debris(px + 1, py, -1.2, -4.2, th));
        spawn(new Entities.Debris(px + 8, py, 1.2, -4.2, th));
        spawn(new Entities.Debris(px + 1, py + 8, -1.6, -2.6, th));
        spawn(new Entities.Debris(px + 8, py + 8, 1.6, -2.6, th));
        flipEnemiesOn(tx, ty);
        return;
      }
      Sound.sfx.bump();
      pushBump(tx, ty);
      flipEnemiesOn(tx, ty);
      return;
    }

    if (ch === 'b' || ch === '?') { // 出金币
      World.setTile(level, tx, ty, 'U');
      spawn(new Entities.CoinPop(px, py - T));
      addCoin();
      addScore(0);
      pushBump(tx, ty);
      flipEnemiesOn(tx, ty);
      return;
    }

    if (ch === 'M') { // 道具块
      World.setTile(level, tx, ty, 'U');
      if (player.power === 0) spawn(new Entities.Mushroom(px, py, 'grow'));
      else spawn(new Entities.Flower(px, py));
      Sound.sfx.bump();
      pushBump(tx, ty);
      flipEnemiesOn(tx, ty);
      return;
    }

    if (ch === 'V') { // 1UP 块
      World.setTile(level, tx, ty, 'U');
      spawn(new Entities.Mushroom(px, py, '1up'));
      Sound.sfx.bump();
      pushBump(tx, ty);
      flipEnemiesOn(tx, ty);
      return;
    }

    if (ch === 'C') { // 彗星能量块
      World.setTile(level, tx, ty, 'U');
      spawn(new Entities.Comet(px, py));
      Sound.sfx.bump();
      pushBump(tx, ty);
      flipEnemiesOn(tx, ty);
      return;
    }

    Sound.sfx.bump(); // U / S / X 等硬块
  }

  function pushBump(tx, ty) { bumps.push({ tx: tx, ty: ty, t: 0 }); }

  /** 顶块时把站在块上的敌人掀翻 */
  function flipEnemiesOn(tx, ty) {
    var top = ty * T;
    for (var i = 0; i < ents.length; i++) {
      var e = ents[i];
      if (e.dead || e.type === 'fx' || e.type === 'fireball') continue;
      if (e.x + e.w <= tx * T || e.x >= (tx + 1) * T) continue;
      if (Math.abs((e.y + e.h) - top) > 4) continue;
      e.flipOut();
      addScore(100, e.x, e.y);
    }
  }

  /* ---------- 玩家 ---------- */
  function playerHitbox() { return { x: player.x, y: player.y, w: player.w, h: player.h }; }

  function grow() {
    if (player.power === 0) {
      player.power = 1;
      player.y -= 15; player.h = 30;
      player.growTimer = 30;
    } else {
      player.power = 1;
    }
    Sound.sfx.powerup();
  }

  function getFire() {
    player.power = 2;
    if (player.h === 15) { player.y -= 15; player.h = 30; player.growTimer = 30; }
    Sound.sfx.powerup();
  }

  function shrink() {
    player.power = 0;
    player.h = 15; player.y += 15;
    player.growTimer = 30;
    player.invuln = 120;
    player.shrinking = true;
    Sound.sfx.powerdown();
  }

  function hurt() {
    if (player.cometTimer > 0 || player.invuln > 0 || player.dead || clear) return;
    if (player.power > 0) shrink();
    else die();
  }

  function die() {
    if (player.dead) return;
    player.cometTimer = 0;
    player.cometBossTarget = null;
    player.dead = true;
    player.deadTimer = 0;
    player.deadBounced = false;
    player.vx = 0; player.vy = 0;
    player.onPole = false;
    Sound.sfx.death();
    state = 'dying';
    stateTimer = 0;
  }

  function shootFire() {
    if (player.power < 2) return;
    var n = 0;
    for (var i = 0; i < ents.length; i++) if (ents[i].type === 'fireball') n++;
    if (n >= 2) return;
    var fx = player.face > 0 ? player.x + player.w : player.x - 8;
    spawn(new Entities.Fireball(fx, player.y + (player.h > 20 ? 10 : 4), player.face));
    Sound.sfx.fire();
  }

  function pipeLinkAt(pipe) {
    var leftX = pipe.ch === 'R' ? pipe.tx - 1 : pipe.tx;
    for (var i = 0; i < level.pipeLinks.length; i++) {
      if (level.pipeLinks[i].x === leftX) return level.pipeLinks[i];
    }
    return null;
  }

  function tryEnterPipe() {
    if (!Input.isDown('down') || !player.onGround || pipeTransition) return false;
    var pipe = World.pipeAtFeet(level, player);
    if (!pipe) return false;
    var link = pipeLinkAt(pipe);
    if (!link) return false;

    var leftX = pipe.ch === 'R' ? pipe.tx - 1 : pipe.tx;
    player.x = leftX * T + (T * 2 - player.w) / 2;
    player.vx = 0; player.vy = 0;
    player.jumping = false; player.skid = false;
    pipeTransition = { t: 0, distance: player.h, to: link.to };
    Sound.sfx.bump();
    return true;
  }

  function updatePipeTransition() {
    pipeTransition.t++;
    if (pipeTransition.t <= pipeTransition.distance) {
      player.y += 1;
      return;
    }

    var to = pipeTransition.to;
    var power = player.power;
    var cometTimer = player.cometTimer;
    loadLevel(to.level, true);
    player.power = power;
    player.h = power > 0 ? 30 : 15;
    player.cometTimer = cometTimer;
    player.x = to.x * T + 2;
    player.y = to.y * T - player.h;
    player.vx = 0; player.vy = 0;
    player.invuln = 45;
    camMax = Math.max(0, player.x - 96);
    updateCamera();
    pipeTransition = null;
    Sound.stopMusic();
    Sound.startMusic(level.theme);
  }

  function beginJump() {
    player.vy = Math.abs(player.vx) > 1.9 ? P.jumpVelRun : P.jumpVel;
    player.jumping = true;
    player.onGround = false;
    player.coyoteTimer = 0;
    player.jumpBufferTimer = 0;
    if (player.power > 0) Sound.sfx.jumpBig(); else Sound.sfx.jump();
  }

  function tickCometTimer() {
    if (player.cometTimer <= 0) return;
    player.cometTimer--;
    if (player.cometTimer === 0) player.cometBossTarget = null;
  }

  function updatePlayer() {
    if (player.growTimer > 0) {
      tickCometTimer();
      player.growTimer--; if (player.growTimer === 0) player.shrinking = false;
      return;
    }
    if (player.invuln > 0) player.invuln--;
    if (tryEnterPipe()) return;
    tickCometTimer();

    if (player.onGround) player.coyoteTimer = COYOTE_FRAMES;
    else if (player.coyoteTimer > 0) player.coyoteTimer--;
    if (player.jumpBufferTimer > 0) player.jumpBufferTimer--;
    if (Input.justPressed('jump')) player.jumpBufferTimer = JUMP_BUFFER_FRAMES;

    var left = Input.isDown('left'), right = Input.isDown('right');
    var run = Input.isDown('run');
    var maxSpd = run ? P.maxRun : P.maxWalk;

    if (Input.justPressed('run')) shootFire();

    // 水平
    if (left && !right) {
      player.face = -1;
      if (player.vx > 0) player.vx -= P.turnAccel;
      else player.vx -= (run ? P.runAccel : P.walkAccel);
    } else if (right && !left) {
      player.face = 1;
      if (player.vx < 0) player.vx += P.turnAccel;
      else player.vx += (run ? P.runAccel : P.walkAccel);
    } else {
      if (player.vx > 0) player.vx = Math.max(0, player.vx - P.friction);
      else if (player.vx < 0) player.vx = Math.min(0, player.vx + P.friction);
    }
    if (player.vx > maxSpd) player.vx = maxSpd;
    if (player.vx < -maxSpd) player.vx = -maxSpd;

    player.skid = player.onGround && ((player.vx > 0.4 && left) || (player.vx < -0.4 && right));

    // 跳跃
    if (player.jumpBufferTimer > 0 && (player.onGround || player.coyoteTimer > 0)) {
      beginJump();
    }
    if (!Input.isDown('jump')) player.jumping = false;

    World.moveX(level, player);

    var g = (player.jumping && player.vy < 0) ? P.gravityHold : P.gravity;
    player.vy = Math.min(player.vy + g, P.maxFall);
    var r = World.moveY(level, player);
    player.onGround = r.ground;
    if (r.ground) {
      player.jumping = false;
      player.stompCombo = 0;
      player.coyoteTimer = COYOTE_FRAMES;
      if (player.jumpBufferTimer > 0) beginJump();
    }
    if (r.head && r.headTile) bumpBlock(r.headTile.tx, r.headTile.ty, r.headTile.ch);

    // 动画
    if (player.onGround && Math.abs(player.vx) > 0.1) player.walkAnim += Math.abs(player.vx) * 0.6;
    else if (player.onGround) player.walkAnim = 0;

    // 吃金币瓦片
    World.forEachOverlap(level, player, function (ch, tx, ty) {
      if (ch === 'o') { World.setTile(level, tx, ty, ' '); addCoin(); }
    });

    // 掉坑
    if (player.y > level.pixelHeight + 16) {
      if (!player.dead) {
        player.cometTimer = 0;
        player.dead = true; player.deadTimer = 30; player.deadBounced = true;
        Sound.sfx.death(); state = 'dying'; stateTimer = 0;
      }
    }

    // 到旗杆
    if (level.flagX != null && !clear && player.x + player.w >= level.flagX + 6) startClear();
    if (level.axeX != null && !clear && World.overlaps(player, {
      x: level.axeX, y: level.flagBaseY - 20, w: 16, h: 20
    })) startBossClear();
  }

  /* ---------- 实体交互 ---------- */
  function isEnemy(e) {
    return e.type === 'goomba' || e.type === 'koopa' || e.type === 'shell' ||
      e.type === 'piranha' || e.type === 'bowser';
  }

  function killByHit(e, pts, x, y) {
    e.flipOut();
    addScore(pts, x, y);
  }

  function clearWithComet(e) {
    e.remove = true;
    addScore(200, e.x, e.y);
    spawn(new Entities.Puff(e.x + e.w / 2 - 8, e.y + e.h / 2 - 8));
    Sound.sfx.kick();
  }

  function updateEntities() {
    for (var i = 0; i < ents.length; i++) {
      var e = ents[i];
      if (e.remove) continue;
      e.update(G);
    }

    // 敌人之间 / 火球 / 龟壳
    for (var a = 0; a < ents.length; a++) {
      var ea = ents[a];
      if (ea.remove || ea.dead) continue;

      if (ea.type === 'fireball') {
        for (var b = 0; b < ents.length; b++) {
          var tb = ents[b];
          if (tb.remove || tb.dead || !isEnemy(tb)) continue;
          if (World.overlaps(ea, tb)) {
            if (tb.type === 'bowser') tb.hit(G);
            else if (tb.type === 'piranha') {
              tb.remove = true;
              addScore(200, tb.x, tb.y);
            } else killByHit(tb, 200, tb.x, tb.y);
            Sound.sfx.kick();
            ea.burst(G);
            break;
          }
        }
        continue;
      }

      if (ea.type === 'shell' && ea.moving) {
        for (var c = 0; c < ents.length; c++) {
          var tc = ents[c];
          if (tc === ea || tc.remove || tc.dead || !isEnemy(tc)) continue;
          if (World.overlaps(ea, tc)) {
            ea.kickCombo = Math.min(ea.kickCombo + 1, COMBO.length - 1);
            if (tc.type === 'bowser') {
              if (tc.hit(G)) ea.vx = -ea.vx;
            }
            else if (tc.type === 'piranha') {
              tc.remove = true;
              addScore(COMBO[ea.kickCombo], tc.x, tc.y);
            } else killByHit(tc, COMBO[ea.kickCombo], tc.x, tc.y);
            Sound.sfx.kick();
          }
        }
      }
    }

    // 玩家 vs 实体
    if (!player.dead && !clear && player.growTimer === 0) {
      var pb = playerHitbox();
      var cometBossTouch = null;
      for (var k = 0; k < ents.length; k++) {
        var e2 = ents[k];
        if (e2.remove || e2.type === 'fx' || e2.type === 'fireball') continue;
        if (!World.overlaps(pb, e2)) continue;

        if (e2.type === 'bowserfire') {
          e2.remove = true;
          hurt();
          continue;
        }

        if (e2.type === 'comet') {
          e2.remove = true;
          player.cometTimer = 480;
          Sound.sfx.comet();
          addScore(1000, e2.x, e2.y - 8);
          continue;
        }

        if (player.cometTimer > 0 && isEnemy(e2)) {
          if (e2.type === 'bowser') {
            cometBossTouch = e2;
            if (player.cometBossTarget !== e2) e2.hit(G);
          }
          else clearWithComet(e2);
          continue;
        }

        if (e2.type === 'mushroom') {
          e2.remove = true;
          if (e2.kind === '1up') { oneUp(); addScore(0, e2.x, e2.y - 8); ents.push(new Entities.ScorePop(e2.x, e2.y - 8, '1UP')); }
          else { grow(); addScore(1000, e2.x, e2.y - 8); }
          continue;
        }
        if (e2.type === 'flower') {
          e2.remove = true;
          getFire();
          addScore(1000, e2.x, e2.y - 8);
          continue;
        }
        if (e2.dead || e2.harmless) {
          if (e2.type === 'shell' && !e2.moving) {
            // 静止龟壳：踢走
            var dir = (player.x + player.w / 2) < (e2.x + e2.w / 2) ? 1 : -1;
            e2.kick(dir, G);
            addScore(400, e2.x, e2.y);
          }
          continue;
        }

        if (e2.type === 'piranha' || e2.type === 'bowser') {
          hurt();
          continue;
        }

        // 踩踏判定：下落中且脚部在敌人上半部
        var footPrev = player.y + player.h - player.vy;
        var stomp = player.vy > 0 && footPrev <= e2.y + e2.h * 0.55;
        if (stomp) {
          player.vy = Input.isDown('jump') ? P.stompBounceHold : P.stompBounce;
          player.jumping = Input.isDown('jump');
          player.onGround = false;
          if (e2.type === 'shell') {
            if (e2.moving) { e2.moving = false; e2.vx = 0; Sound.sfx.stomp(); addScore(100, e2.x, e2.y); }
            else { var d2 = player.face; e2.kick(d2, G); addScore(400, e2.x, e2.y); }
          } else if (e2.type === 'koopa') {
            e2.stomped(G);
            addScore(COMBO[player.stompCombo], e2.x, e2.y);
            player.stompCombo = Math.min(player.stompCombo + 1, COMBO.length - 1);
          } else {
            e2.stomped(G);
            addScore(COMBO[player.stompCombo], e2.x, e2.y);
            player.stompCombo = Math.min(player.stompCombo + 1, COMBO.length - 1);
          }
        } else {
          hurt();
        }
      }
      player.cometBossTarget = cometBossTouch;
    }

    // 清理
    var keep = [];
    for (var m = 0; m < ents.length; m++) if (!ents[m].remove) keep.push(ents[m]);
    ents = keep;
  }

  /* ---------- 过关 ---------- */
  function startClear() {
    var bonus = flagBonusForY(player.y);
    clear = { phase: 'slide', t: 0, flagY: level.flagTopY + 8, bonusDone: false };
    player.cometTimer = 0;
    player.onPole = true;
    player.x = level.flagX + 4;
    player.vx = 0; player.vy = 0;
    player.face = -1;
    Sound.sfx.flag();
    addScore(bonus, player.x, player.y - 12);
  }

  function startBossClear() {
    if (clear) return;
    clear = { phase: 'boss', t: 0, flagY: 0, bonusDone: false };
    player.cometTimer = 0;
    player.vx = 0; player.vy = 0;
    player.autoWalk = true;
    for (var i = 0; i < ents.length; i++) {
      if (ents[i].type === 'bowser' && !ents[i].dead) ents[i].flipOut();
      if (ents[i].type === 'bowserfire') ents[i].remove = true;
    }
    addScore(5000, player.x, player.y - 12);
    Sound.sfx.clear();
  }

  function updateClear() {
    clear.t++;

    if (clear.phase === 'boss') {
      if (clear.t < 48) {
        player.vx = 1.1;
        World.moveX(level, player);
        player.walkAnim += 0.7;
      } else player.vx = 0;

      if (timeLeft > 0) {
        var bossDec = Math.min(timeLeft, 5);
        timeLeft -= bossDec;
        score += bossDec * 50;
        if (clear.t % 6 === 0) Sound.sfx.coin();
      }
      if (timeLeft <= 0 && clear.t > 90) {
        player.autoWalk = false;
        clear.phase = 'done';
        clear.t = 0;
      }
      return;
    }

    var poleBottom = level.flagBaseY - player.h;

    if (clear.phase === 'slide') {
      player.y += 2;
      clear.flagY = Math.min(level.flagBaseY - 12, clear.flagY + 2);
      if (player.y >= poleBottom) {
        player.y = poleBottom;
        clear.phase = 'hop';
        clear.t = 0;
      }
    } else if (clear.phase === 'hop') {
      if (clear.t === 6) {
        player.onPole = false;
        player.x += 12;
        player.face = 1;
        player.vx = 1.4;
        player.vy = -1.5;
      }
      if (clear.t > 6) {
        World.moveX(level, player);
        player.vy = Math.min(player.vy + P.gravity, P.maxFall);
        var r = World.moveY(level, player);
        if (r.ground) { clear.phase = 'walk'; clear.t = 0; Sound.sfx.clear(); }
      }
    } else if (clear.phase === 'walk') {
      var goal = level.castleX != null ? level.castleX + 36 : level.pixelWidth - 24;
      if (player.x < goal) {
        player.vx = 1.4;
        World.moveX(level, player);
        player.walkAnim += 0.9;
      } else {
        player.vx = 0;
      }
      player.vy = Math.min(player.vy + P.gravity, P.maxFall);
      World.moveY(level, player);

      // 剩余时间换分：每帧 3 点，每点 50 分
      if (timeLeft > 0) {
        var dec = Math.min(timeLeft, 3);
        timeLeft -= dec;
        score += dec * 50;
        if (clear.t % 6 === 0) Sound.sfx.coin();
        if (timeLeft <= 0) clear.bonusDone = true;
      }
      if (player.x >= goal && timeLeft <= 0) { clear.phase = 'done'; clear.t = 0; }
      if (clear.t > 900) { clear.phase = 'done'; clear.t = 0; }
    } else if (clear.phase === 'done') {
      if (clear.t > 90) nextLevel();
    }
  }

  function nextLevel() {
    recordClear(levelIndex);
    saveHigh();
    if (levelIndex + 1 >= Levels.count) {
      state = 'win'; stateTimer = 0;
      Sound.stopMusic();
      return;
    }
    player.cometTimer = 0;
    loadLevel(levelIndex + 1, true);
    state = 'levelstart'; stateTimer = 0;
    Sound.stopMusic();
  }

  /* ---------- 相机 ---------- */
  function updateCamera() {
    var target = player.x + player.w / 2 - 96;
    if (target > camMax) camMax = target;
    cam = camMax;
    var maxCam = level.pixelWidth - VW;
    if (cam < 0) cam = 0;
    if (cam > maxCam) cam = maxCam;
  }

  var G = {
    get level() { return level; },
    get player() { return player; },
    get ents() { return ents; },
    spawn: spawn,
    addScore: addScore,
    addCoin: addCoin,
    hurt: hurt
  };

  function flagBonusForY(y) {
    var bottom = level.flagBaseY - player.h;
    var span = Math.max(1, bottom - level.flagTopY);
    var height = (bottom - y) / span;
    if (height >= 0.8) return 5000;
    if (height >= 0.6) return 2000;
    if (height >= 0.4) return 800;
    if (height >= 0.2) return 400;
    return 100;
  }

  /* ---------- 渲染：背景与瓦片 ---------- */
  function drawBackground() {
    var th = Tiles.THEMES[level.theme] || Tiles.THEMES.overworld;
    ctx.fillStyle = th.sky;
    ctx.fillRect(0, 0, VW, VH);

    var d = level.decor;
    for (var i = 0; i < d.length; i++) {
      var o = d[i];
      var px = Math.round(o.k === 'cloud' ? o.x - cam * 0.5 : o.x - cam);
      if (px > VW + 96 || px < -160) continue;
      if (o.k === 'hill') Tiles.hill(ctx, px, o.y, o.w, o.h, level.theme);
      else if (o.k === 'bush') Tiles.bush(ctx, px, o.y, o.w, level.theme);
      else if (o.k === 'cloud') Tiles.cloud(ctx, px, o.y, o.w, level.theme);
    }

    if (level.castleX != null) {
      var cxp = Math.round(level.castleX - cam);
      if (cxp < VW + 96 && cxp > -128) Tiles.castle(ctx, cxp, level.castleY, level.theme);
    }
    if (level.flagX != null) {
      var fxp = Math.round(level.flagX - cam);
      if (fxp < VW + 32 && fxp > -32) {
        var fy = clear ? clear.flagY : level.flagTopY + 8;
        Tiles.flagpole(ctx, fxp, level.flagBaseY, level.flagTopY, fy);
      }
    }
    if (level.axeX != null) {
      var ax = Math.round(level.axeX - cam);
      if (ax > -16 && ax < VW + 16) {
        var ay = level.flagBaseY - 20;
        ctx.fillStyle = '#fcfcfc';
        ctx.fillRect(ax + 7, ay, 2, 20);
        ctx.fillStyle = '#fcd800';
        ctx.fillRect(ax + 2, ay, 12, 4);
        ctx.fillRect(ax + 4, ay + 4, 8, 3);
      }
    }
  }

  function visualTile(ch) {
    if (ch === 'b') return 'B';
    if (ch === 'V') return '?';
    return ch;
  }

  function bumpOffset(tx, ty) {
    for (var i = 0; i < bumps.length; i++) {
      var b = bumps[i];
      if (b.tx === tx && b.ty === ty) return -Math.round(Math.sin(Math.PI * (b.t / 10)) * 7);
    }
    return 0;
  }

  var QSEQ = [0, 0, 0, 1, 1, 2, 2, 1, 1, 0];
  var COINSEQ = ['coin_a', 'coin_b', 'coin_c', 'coin_b'];

  function drawTiles() {
    var x0 = Math.floor(cam / T), x1 = Math.ceil((cam + VW) / T);
    var qf = QSEQ[Math.floor(frame / 8) % QSEQ.length];
    var cf = COINSEQ[Math.floor(frame / 6) % 4];
    for (var tx = x0; tx <= x1; tx++) {
      for (var ty = 0; ty < level.height; ty++) {
        var ch = World.tileAt(level, tx, ty);
        if (ch === ' ') continue;
        var px = tx * T - cam, py = ty * T;
        if (ch === 'o') { Sprites.draw(ctx, cf, px, py, false, null); continue; }
        Tiles.draw(ctx, visualTile(ch), px, py + bumpOffset(tx, ty), level.theme, qf);
      }
    }
  }

  /* ---------- 渲染：玩家 ---------- */
  function playerSprite() {
    var big = player.h > 20;
    var pre = big ? 'mario_big_' : 'mario_small_';

    if (player.dead) return 'mario_small_dead';
    if (player.onPole) return pre + 'walk2';
    if (!player.onGround) return pre + 'jump';
    if (player.skid) return pre + 'skid';
    if (Math.abs(player.vx) > 0.1) {
      var f = Math.floor(player.walkAnim / 4) % 4;
      return pre + (f === 0 ? 'walk1' : (f === 1 ? 'walk2' : (f === 2 ? 'walk3' : 'walk2')));
    }
    return pre + 'idle';
  }

  function drawPlayer() {
    // 变身/受伤闪烁
    if (player.growTimer > 0) {
      var flash = Math.floor(player.growTimer / 4) % 2 === 0;
      var useBig = player.shrinking ? flash : !flash;
      var nm = useBig ? 'mario_big_idle' : 'mario_small_idle';
      var sh = useBig ? 32 : 16;
      var variant = player.power === 2 ? 'fire' : null;
      Sprites.draw(ctx, nm, player.x - cam - 2, player.y + player.h - sh + 1, player.face < 0, variant);
      return;
    }
    if (player.invuln > 0 && Math.floor(frame / 3) % 2 === 0) return;

    var name = playerSprite();
    var v = player.power === 2 ? 'fire' : null;
    var sz = Sprites.size(name);
    var dx = player.x - cam - 2;
    var dy = player.y + player.h - sz.h + (player.dead ? 0 : 1);
    if (player.dead) dy = player.y - 1;
    Sprites.draw(ctx, name, dx, dy, player.face < 0 && !player.onPole, v);
  }

  function drawCometAura() {
    if (player.cometTimer <= 0 || player.dead) return;

    var cx = Math.round(player.x - cam + player.w / 2);
    var cy = Math.round(player.y + player.h / 2);
    var pulse = Math.floor(frame / 2) % 8;
    var particles = [
      [-10, -4], [-6, -11], [2, -13], [9, -8],
      [12, 1], [7, 10], [-2, 12], [-10, 7]
    ];
    for (var i = 0; i < particles.length; i++) {
      var p = particles[(i + pulse) % particles.length];
      ctx.fillStyle = i % 2 === 0 ? '#58d8ff' : '#fcd800';
      ctx.fillRect(cx + p[0], cy + p[1], i % 3 === 0 ? 3 : 2, i % 3 === 0 ? 3 : 2);
    }
    ctx.fillStyle = '#fcfcfc';
    ctx.fillRect(cx - 1, cy - 1, 3, 3);
  }

  /* ---------- 渲染：HUD ---------- */
  function pad(n, w) {
    var s = String(n);
    while (s.length < w) s = '0' + s;
    return s;
  }

  function miniMario(x, y) {
    ctx.fillStyle = '#d82800'; ctx.fillRect(x + 1, y, 6, 2);
    ctx.fillStyle = '#fca044'; ctx.fillRect(x + 1, y + 2, 6, 3);
    ctx.fillStyle = '#6a3000'; ctx.fillRect(x, y + 2, 2, 2);
    ctx.fillStyle = '#d82800'; ctx.fillRect(x + 1, y + 5, 6, 2);
    ctx.fillStyle = '#0058f8'; ctx.fillRect(x + 1, y + 7, 6, 1);
  }

  function miniCoin(x, y) {
    ctx.fillStyle = '#fcd800'; ctx.fillRect(x + 1, y, 4, 8); ctx.fillRect(x, y + 1, 6, 6);
    ctx.fillStyle = '#e0a800'; ctx.fillRect(x + 2, y + 2, 2, 4);
  }

  function drawHUD() {
    var c = '#fcfcfc';
    Font.drawShadow(ctx, 'MARIO', 8, 8, c, 1);
    Font.drawShadow(ctx, pad(score, 6), 8, 17, c, 1);

    var blink = Math.floor(frame / 12) % 2 === 0;
    miniCoin(62, 17);
    Font.drawShadow(ctx, (blink ? '*' : '-') + pad(coins, 2), 70, 17, c, 1);

    Font.drawShadow(ctx, 'WORLD', 106, 8, c, 1);
    Font.drawShadow(ctx, level.name, 112, 17, c, 1);

    miniMario(152, 16);
    Font.drawShadow(ctx, '*' + pad(lives, 2), 162, 17, c, 1);

    Font.drawShadow(ctx, 'TIME', 208, 8, c, 1);
    Font.drawShadow(ctx, pad(Math.max(0, timeLeft), 3), 212, 17, timeLeft <= 100 && blink ? '#f87858' : c, 1);

    if (player.cometTimer > 0) {
      Font.drawShadow(ctx, 'COMET ' + Math.ceil(player.cometTimer / 60) + 'S', 8, 28, '#58d8ff', 1);
    }
  }

  function activeBoss() {
    for (var i = 0; i < ents.length; i++) {
      if (ents[i].type === 'bowser' && !ents[i].dead) return ents[i];
    }
    return null;
  }

  function drawBossHUD() {
    var boss = activeBoss();
    if (!boss) return;

    var x = 82, y = 35, w = 84, h = 7;
    Font.drawShadow(ctx, 'BOWSER', 82, 26, '#fcfcfc', 1);
    ctx.fillStyle = '#000000';
    ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
    ctx.fillStyle = '#5a5a5a';
    ctx.fillRect(x, y, w, h);

    var hp = Math.max(0, Math.min(5, boss.hp));
    var fill = Math.round(w * hp / 5);
    ctx.fillStyle = hp <= 1 ? '#d82800' : '#f87800';
    ctx.fillRect(x, y, fill, h);
    ctx.fillStyle = '#fcd800';
    for (var notch = 1; notch < 5; notch++) ctx.fillRect(x + Math.round(w * notch / 5) - 1, y, 2, h);
  }

  /* ---------- 渲染：覆盖层 ---------- */
  function dim(alpha) {
    ctx.fillStyle = 'rgba(0,0,0,' + alpha + ')';
    ctx.fillRect(0, 0, VW, VH);
  }

  function drawTitle() {
    var th = Tiles.THEMES.overworld;
    ctx.fillStyle = th.sky; ctx.fillRect(0, 0, VW, VH);
    for (var i = 0; i < 6; i++) Tiles.cloud(ctx, ((i * 53 + frame * 0.2) % (VW + 64)) - 32, 24 + (i % 3) * 26, 32, 'overworld');
    Tiles.hill(ctx, 20, 160, 80, 48, 'overworld');
    Tiles.hill(ctx, 170, 176, 48, 32, 'overworld');
    Tiles.bush(ctx, 110, 196, 48, 'overworld');
    for (var x = 0; x < VW; x += T) { Tiles.draw(ctx, 'X', x, 208, 'overworld'); Tiles.draw(ctx, 'X', x, 224, 'overworld'); }

    Font.drawCentered(ctx, 'SUPER', 128, 44, '#fcfcfc', 4);
    Font.drawCentered(ctx, 'MARIO', 128, 76, '#d82800', 4);
    Font.drawCentered(ctx, 'TOP-' + pad(highScore, 6), 128, 112, '#fcd800', 1);
    Font.drawCentered(ctx, 'WORLDS CLEAR ' + worldsCleared + '/' + Levels.count, 128, 122, '#fcfcfc', 1);

    Sprites.draw(ctx, 'mario_big_idle', 40, 176, false, null);
    Sprites.draw(ctx, 'goomba', 200, 192, false, null);
    Sprites.draw(ctx, 'coin_a', 168, 176, false, null);

    if (Math.floor(frame / 20) % 2 === 0) {
      var startText = worldsCleared > 0 ? 'ENTER-NEW RUN C-CONTINUE' : 'PRESS ENTER OR JUMP';
      Font.drawCentered(ctx, startText, 128, 134, '#fcfcfc', 1);
    }
    Font.drawCentered(ctx, 'ARROWS-MOVE   Z-JUMP   X-RUN/FIRE', 128, 149, '#fcfcfc', 1);
    Font.drawCentered(ctx, 'P-PAUSE   R-RESTART   M-SOUND', 128, 159, '#fcfcfc', 1);
  }

  function drawLevelStart() {
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, VW, VH);
    Font.drawCentered(ctx, 'WORLD ' + level.name, 128, 96, '#fcfcfc', 2, false);
    miniMario(112, 124);
    Font.drawCentered(ctx, '*  ' + pad(lives, 2), 136, 124, '#fcfcfc', 2, false);
  }

  function drawGameOver() {
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, VW, VH);
    Font.drawCentered(ctx, 'GAME OVER', 128, 96, '#fcfcfc', 2, false);
    Font.drawCentered(ctx, 'SCORE ' + pad(score, 6), 128, 124, '#fcd800', 1, false);
    if (score >= highScore && score > 0)
      Font.drawCentered(ctx, 'NEW RECORD!', 128, 138, '#f87858', 1, false);
    if (Math.floor(frame / 20) % 2 === 0)
      Font.drawCentered(ctx, 'PRESS ENTER OR JUMP', 128, 188, '#fcfcfc', 1, false);
  }

  function drawWin() {
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, VW, VH);
    Font.drawCentered(ctx, 'THANK YOU MARIO!', 128, 72, '#fcfcfc', 2, false);
    Font.drawCentered(ctx, 'ALL ' + Levels.count + ' WORLDS CLEAR', 128, 104, '#fcd800', 1, false);
    Font.drawCentered(ctx, 'SCORE ' + pad(score, 6), 128, 120, '#fcfcfc', 1, false);
    Font.drawCentered(ctx, 'TOP-' + pad(highScore, 6), 128, 134, '#fcfcfc', 1, false);
    Sprites.draw(ctx, 'mario_big_idle', 120, 152, false, player.power === 2 ? 'fire' : null);
    if (Math.floor(frame / 20) % 2 === 0)
      Font.drawCentered(ctx, 'PRESS ENTER OR JUMP', 128, 200, '#fcfcfc', 1, false);
  }

  /* ---------- 主渲染 ---------- */
  function render() {
    ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
    ctx.imageSmoothingEnabled = false;

    if (state === 'title') { drawTitle(); ctx.setTransform(1, 0, 0, 1, 0, 0); return; }
    if (state === 'levelstart') { drawLevelStart(); ctx.setTransform(1, 0, 0, 1, 0, 0); return; }
    if (state === 'gameover') { drawGameOver(); ctx.setTransform(1, 0, 0, 1, 0, 0); return; }
    if (state === 'win') { drawWin(); ctx.setTransform(1, 0, 0, 1, 0, 0); return; }

    drawBackground();
    drawTiles();

    // 特效在后，敌人在前
    var i, e;
    for (i = 0; i < ents.length; i++) {
      e = ents[i];
      if (e.type === 'fx') e.draw(ctx, cam);
    }
    for (i = 0; i < ents.length; i++) {
      e = ents[i];
      if (e.type !== 'fx') e.draw(ctx, cam);
    }

    drawCometAura();
    drawPlayer();
    drawHUD();
    drawBossHUD();

    if (clear && clear.phase === 'done')
      Font.drawCentered(ctx, 'COURSE CLEAR!', 128, 104, '#fcfcfc', 2);
    if (paused) {
      dim(0.55);
      Font.drawCentered(ctx, 'PAUSE', 128, 104, '#fcfcfc', 3);
      Font.drawCentered(ctx, 'P-RESUME   R-RESTART', 128, 136, '#fcfcfc', 1);
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  /* ---------- 状态更新 ---------- */
  function startGame(startAt) {
    score = 0; coins = 0; lives = 3;
    player.power = 0; player.cometTimer = 0;
    Sound.setSpeed(1);
    loadLevel(startAt || 0, false);
    state = 'levelstart'; stateTimer = 0;
  }

  function respawn() {
    lives--;
    if (lives <= 0) {
      saveHigh();
      state = 'gameover'; stateTimer = 0;
      Sound.sfx.gameover();
      return;
    }
    player.power = 0; player.cometTimer = 0;
    Sound.setSpeed(1);
    loadLevel(levelIndex, false);
    state = 'levelstart'; stateTimer = 0;
  }

  function updateDying() {
    stateTimer++;
    if (!player.deadBounced && stateTimer === 24) {
      player.deadBounced = true;
      player.vy = -5.6;
    }
    if (player.deadBounced) {
      player.vy = Math.min(player.vy + 0.4, 8);
      player.y += player.vy;
    }
    if (stateTimer > 160) respawn();
  }

  function updateTimer() {
    if (clear) return;
    timeAcc++;
    if (timeAcc < 24) return; // 每 0.4 秒减 1
    timeAcc = 0;
    timeLeft--;
    if (timeLeft === 100) Sound.setSpeed(1.35);
    if (timeLeft <= 0) { timeLeft = 0; die(); }
  }

  function updateBumps() {
    var keep = [];
    for (var i = 0; i < bumps.length; i++) {
      bumps[i].t++;
      if (bumps[i].t < 10) keep.push(bumps[i]);
    }
    bumps = keep;
  }

  function step() {
    Input.poll();
    frame++;

    if (Input.justPressed('mute')) toggleSound();

    if (state === 'title') {
      if (Input.justPressed('continue') && worldsCleared > 0) {
        Sound.resume();
        startGame(Math.min(worldsCleared, Levels.count - 1));
      } else if (Input.justPressed('start') || Input.justPressed('jump')) {
        Sound.resume();
        startGame();
      }
      return;
    }
    if (state === 'levelstart') {
      stateTimer++;
      if (stateTimer > 108 || Input.justPressed('start')) {
        state = 'playing'; stateTimer = 0;
        Sound.startMusic(level.theme);
      }
      return;
    }
    if (state === 'gameover') {
      stateTimer++;
      if (Input.justPressed('start') || Input.justPressed('jump')) { startGame(); }
      else if (stateTimer > 200) { state = 'title'; stateTimer = 0; }
      return;
    }
    if (state === 'win') {
      stateTimer++;
      if ((Input.justPressed('start') || Input.justPressed('jump')) && stateTimer > 40) startGame();
      return;
    }
    if (state === 'dying') {
      updateDying();
      updateEntities();
      return;
    }

    // playing
    if (Input.justPressed('pause')) {
      setPaused(!paused);
    }
    if (Input.justPressed('reset')) {
      Sound.setSpeed(1);
      loadLevel(levelIndex, false);
      state = 'levelstart'; stateTimer = 0;
      paused = false;
      return;
    }
    if (paused) return;

    if (pipeTransition) {
      updatePipeTransition();
      updateEntities();
      updateBumps();
      updateCamera();
      return;
    }

    if (clear) updateClear();
    else { updatePlayer(); updateTimer(); }

    updateEntities();
    updateBumps();
    updateCamera();
  }

  /* ---------- 主循环 ---------- */
  var STEP = 1000 / 60;

  function loop(now) {
    var dt = now - last;
    last = now;
    if (dt > 200) dt = STEP; // 切标签页回来不要暴走
    acc += dt;
    var guard = 0;
    while (acc >= STEP && guard++ < 5) { step(); acc -= STEP; }
    Sound.update();
    render();
    requestAnimationFrame(loop);
  }

  function init() {
    canvas = document.getElementById('screen');
    canvas.width = VW * SCALE;
    canvas.height = VH * SCALE;
    ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    var errs = Sprites.validate();
    if (errs.length) console.warn('精灵数据异常:\n' + errs.join('\n'));

    loadSave();
    Input.setFirstInputHook(function () { Sound.init(); Sound.resume(); });
    loadLevel(0, false);
    state = 'title'; stateTimer = 0;
    last = performance.now();
    requestAnimationFrame(loop);
  }

  return {
    init: init, step: step, render: render,
    startGame: startGame,
    get state() { return state; }, set state(v) { state = v; },
    get player() { return player; },
    get level() { return level; },
    get ents() { return ents; },
    get score() { return score; },
    get coins() { return coins; },
    get lives() { return lives; },
    get timeLeft() { return timeLeft; },
    get worldsCleared() { return worldsCleared; },
    get clear() { return clear; },
    get pipeTransition() { return pipeTransition; },
    setPaused: setPaused,
    toggleSound: toggleSound,
    get paused() { return paused; },
    get cam() { return cam; },
    get frame() { return frame; }
  };
})();

if (typeof window !== 'undefined') {
  window.addEventListener('load', function () { Game.init(); });
}
