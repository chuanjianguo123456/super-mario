/* 实体：敌人、道具、火球、特效 */
var Entities = (function () {
  var T = 16;
  var GRAVITY = 0.48;
  var ENEMY_SPEED = 0.58;
  var SHELL_SPEED = 3.3;
  var ITEM_SPEED = 0.85;

  /* ---------- 基类 ---------- */
  function Entity(x, y, w, h) {
    this.x = x; this.y = y; this.w = w; this.h = h;
    this.vx = 0; this.vy = 0;
    this.remove = false;
    this.dead = false;      // 已被击败（进入飞出动画）
    this.harmless = false;  // 不再伤害玩家
    this.type = 'entity';
    this.anim = 0;
    this.sx = 0; this.sy = 0; // 精灵相对碰撞盒的偏移
    this.sprite = null;
    this.flip = false;
    this.variant = null;
  }

  Entity.prototype.physics = function (level, gravity) {
    World.moveX(level, this);
    this.vy = Math.min(this.vy + (gravity == null ? GRAVITY : gravity), 8);
    return World.moveY(level, this);
  };

  Entity.prototype.offscreenKill = function (level) {
    if (this.y > level.pixelHeight + 64) this.remove = true;
  };

  Entity.prototype.draw = function (ctx, cam) {
    if (!this.sprite) return;
    Sprites.draw(ctx, this.sprite, this.x - cam + this.sx, this.y + this.sy, this.flip, this.variant);
  };

  /** 被下方顶块击飞 */
  Entity.prototype.flipOut = function () {
    if (this.dead) return;
    this.dead = true; this.harmless = true;
    this.vy = -5; this.vx = 0;
    this.flippedOut = true;
    this.type = 'dying';
  };

  /* ---------- 板栗仔 ---------- */
  function Goomba(x, y) {
    Entity.call(this, x + 2, y - 16, 12, 16);
    this.sx = -2; this.sy = 0;
    this.type = 'goomba';
    // 关卡装载后可能在第一次 update 前就进入渲染，先使用稳定的待机帧。
    this.sprite = 'goomba';
    this.vx = -ENEMY_SPEED;
    this.flatTimer = 0;
  }
  Goomba.prototype = Object.create(Entity.prototype);

  Goomba.prototype.update = function (g) {
    if (this.flatTimer > 0) {
      this.flatTimer--;
      this.sprite = 'goomba_flat';
      this.sy = 0;
      if (this.flatTimer === 0) this.remove = true;
      return;
    }
    if (this.flippedOut) {
      this.vy += GRAVITY;
      this.y += this.vy;
      this.anim += 1;
      this.sprite = 'goomba';
      this.flip = false;
      this.offscreenKill(g.level);
      return;
    }
    if (World.moveX(g.level, this)) this.vx = -this.vx;
    this.vy = Math.min(this.vy + GRAVITY, 8);
    World.moveY(g.level, this);
    this.anim += Math.abs(this.vx) * 0.5;
    this.sprite = 'goomba';
    this.flip = (Math.floor(this.anim / 6) % 2) === 1;
    this.offscreenKill(g.level);
  };

  Goomba.prototype.stomped = function (g) {
    this.flatTimer = 22;
    this.harmless = true;
    this.dead = true;
    this.vx = 0; this.vy = 0;
    this.h = 8; this.y += 8;
    Sound.sfx.stomp();
  };

  Goomba.prototype.draw = function (ctx, cam) {
    var y = this.y + this.sy - (this.flatTimer > 0 ? 8 : 0);
    if (this.flippedOut) {
      // 上下翻转画
      ctx.save();
      ctx.translate(Math.round(this.x - cam + this.sx), Math.round(this.y + 16));
      ctx.scale(1, -1);
      Sprites.draw(ctx, 'goomba', 0, 0, false, null);
      ctx.restore();
      return;
    }
    Sprites.draw(ctx, this.sprite, this.x - cam + this.sx, y, this.flip, this.variant);
  };

  /* ---------- 乌龟 ---------- */
  function Koopa(x, y, variant) {
    Entity.call(this, x + 2, y - 24, 12, 24);
    this.sx = -2; this.sy = 0;
    this.type = 'koopa';
    this.sprite = 'koopa1';
    this.vx = -ENEMY_SPEED;
    this.variant = variant || null;
  }
  Koopa.prototype = Object.create(Entity.prototype);

  Koopa.prototype.update = function (g) {
    if (this.flippedOut) {
      this.vy += GRAVITY; this.y += this.vy;
      this.sprite = 'koopa1';
      this.offscreenKill(g.level);
      return;
    }
    if (World.moveX(g.level, this)) this.vx = -this.vx;
    this.vy = Math.min(this.vy + GRAVITY, 8);
    World.moveY(g.level, this);
    this.anim += Math.abs(this.vx) * 0.6;
    this.sprite = (Math.floor(this.anim / 7) % 2) === 0 ? 'koopa1' : 'koopa2';
    this.flip = this.vx > 0;
    this.offscreenKill(g.level);
  };

  Koopa.prototype.stomped = function (g) {
    // 缩成龟壳
    var s = new Shell(this.x - 2, this.y + this.h, this.variant);
    g.spawn(s);
    this.remove = true;
    Sound.sfx.stomp();
    return s;
  };

  Koopa.prototype.draw = function (ctx, cam) {
    if (this.flippedOut) {
      ctx.save();
      ctx.translate(Math.round(this.x - cam + this.sx), Math.round(this.y + 24));
      ctx.scale(1, -1);
      Sprites.draw(ctx, 'koopa1', 0, 0, false, this.variant);
      ctx.restore();
      return;
    }
    Sprites.draw(ctx, this.sprite, this.x - cam + this.sx, this.y + this.sy, this.flip, this.variant);
  };

  /* ---------- 龟壳 ---------- */
  function Shell(x, y, variant) {
    Entity.call(this, x + 2, y - 16, 12, 15);
    this.sx = -2; this.sy = -1;
    this.type = 'shell';
    this.sprite = 'shell';
    this.moving = false;
    this.idleTimer = 0;
    this.variant = variant === 'shellR' ? 'shellR' : null;
    this.kickCombo = 0;
  }
  Shell.prototype = Object.create(Entity.prototype);

  Shell.prototype.update = function (g) {
    if (this.flippedOut) {
      this.vy += GRAVITY; this.y += this.vy;
      this.offscreenKill(g.level);
      return;
    }
    if (this.moving) {
      this.idleTimer = 0;
      if (World.moveX(g.level, this)) {
        this.vx = -this.vx;
        Sound.sfx.bump();
      }
    } else {
      this.vx = 0;
      this.idleTimer++;
      if (this.idleTimer > 380) { // 复活成乌龟
        var k = new Koopa(this.x - 2, this.y + this.h, this.variant);
        g.spawn(k);
        this.remove = true;
        return;
      }
    }
    this.vy = Math.min(this.vy + GRAVITY, 8);
    World.moveY(g.level, this);
    this.offscreenKill(g.level);
  };

  Shell.prototype.kick = function (dir, g) {
    this.moving = true;
    this.vx = SHELL_SPEED * dir;
    this.harmless = false;
    this.kickCombo = 0;
    Sound.sfx.kick();
  };

  Shell.prototype.stomped = function (g) {
    if (this.moving) { this.moving = false; this.vx = 0; Sound.sfx.stomp(); }
    else this.kick(1, g);
    return this;
  };

  Shell.prototype.draw = function (ctx, cam) {
    var wob = (!this.moving && this.idleTimer > 300 && Math.floor(this.idleTimer / 5) % 2 === 0) ? 1 : 0;
    if (this.flippedOut) {
      ctx.save();
      ctx.translate(Math.round(this.x - cam + this.sx), Math.round(this.y + 16));
      ctx.scale(1, -1);
      Sprites.draw(ctx, 'shell', 0, 0, false, this.variant);
      ctx.restore();
      return;
    }
    Sprites.draw(ctx, 'shell', this.x - cam + this.sx + wob, this.y + this.sy, false, this.variant);
  };

  /* ---------- 蘑菇 ---------- */
  function Mushroom(x, y, kind) {
    Entity.call(this, x + 2, y, 12, 16);
    this.sx = -2;
    this.type = 'mushroom';
    this.kind = kind || 'grow'; // grow | 1up
    this.variant = this.kind === '1up' ? '1up' : null;
    this.sprite = 'mushroom';
    this.emerge = 16; // 从块中升起的剩余像素
    this.vx = 0;
  }
  Mushroom.prototype = Object.create(Entity.prototype);

  Mushroom.prototype.update = function (g) {
    if (this.emerge > 0) {
      this.emerge--; this.y -= 1;
      if (this.emerge === 0) this.vx = ITEM_SPEED;
      return;
    }
    if (World.moveX(g.level, this)) this.vx = -this.vx;
    this.vy = Math.min(this.vy + GRAVITY, 8);
    World.moveY(g.level, this);
    this.offscreenKill(g.level);
  };

  /* ---------- 彗星能量 ---------- */
  function Comet(x, y) {
    Entity.call(this, x + 2, y, 12, 16);
    this.sx = -2;
    this.type = 'comet';
    this.sprite = 'comet';
    this.harmless = true;
    this.emerge = 16;
  }
  Comet.prototype = Object.create(Entity.prototype);

  Comet.prototype.update = function (g) {
    if (this.emerge > 0) {
      this.emerge--; this.y -= 1;
      if (this.emerge === 0) this.vx = ITEM_SPEED;
      return;
    }

    var beforeMove = this.vx;
    if (World.moveX(g.level, this)) this.vx = -beforeMove;
    this.vy = Math.min(this.vy + GRAVITY, 8);
    var r = World.moveY(g.level, this);
    if (r.ground) this.vy = -4;
    this.flip = this.vx < 0;
    this.offscreenKill(g.level);
  };

  /* ---------- 火焰花 ---------- */
  function Flower(x, y) {
    Entity.call(this, x + 2, y, 12, 16);
    this.sx = -2;
    this.type = 'flower';
    this.sprite = 'flower';
    this.emerge = 16;
  }
  Flower.prototype = Object.create(Entity.prototype);

  Flower.prototype.update = function (g) {
    if (this.emerge > 0) { this.emerge--; this.y -= 1; }
    this.anim++;
    this.variant = (Math.floor(this.anim / 6) % 2) === 1 ? 'flower2' : null;
  };

  /* ---------- 火球 ---------- */
  function Fireball(x, y, dir) {
    Entity.call(this, x, y, 8, 8);
    this.type = 'fireball';
    this.sprite = 'fireball';
    this.vx = 3.6 * dir;
    this.vy = 1.5;
    this.life = 200;
  }
  Fireball.prototype = Object.create(Entity.prototype);

  Fireball.prototype.update = function (g) {
    this.life--;
    if (this.life <= 0) { this.burst(g); return; }
    if (World.moveX(g.level, this)) { this.burst(g); return; }
    this.vy = Math.min(this.vy + 0.35, 6);
    var r = World.moveY(g.level, this);
    if (r.ground) this.vy = -2.6; // 弹跳
    this.anim += 1;
    if (this.y > g.level.pixelHeight + 32) this.remove = true;
  };

  Fireball.prototype.burst = function (g) {
    this.remove = true;
    g.spawn(new Puff(this.x - 4, this.y - 4));
  };

  Fireball.prototype.draw = function (ctx, cam) {
    var a = Math.floor(this.anim / 3) % 4;
    ctx.save();
    ctx.translate(Math.round(this.x - cam + 4), Math.round(this.y + 4));
    ctx.rotate(a * Math.PI / 2);
    Sprites.draw(ctx, 'fireball', -4, -4, false, null);
    ctx.restore();
  };

  /* ---------- 特效 ---------- */
  function Puff(x, y) {
    Entity.call(this, x, y, 16, 16);
    this.type = 'fx'; this.harmless = true; this.life = 12;
  }
  Puff.prototype = Object.create(Entity.prototype);
  Puff.prototype.update = function () { if (--this.life <= 0) this.remove = true; };
  Puff.prototype.draw = function (ctx, cam) {
    var t = 1 - this.life / 12;
    var r = 3 + t * 6;
    ctx.fillStyle = t < 0.5 ? '#fcd800' : '#f87800';
    var cx = Math.round(this.x - cam + 8), cy = Math.round(this.y + 8);
    ctx.fillRect(cx - r, cy - 2, r * 2, 4);
    ctx.fillRect(cx - 2, cy - r, 4, r * 2);
  };

  /** 顶块弹出的金币 */
  function CoinPop(x, y) {
    Entity.call(this, x, y, 16, 16);
    this.type = 'fx'; this.harmless = true;
    this.vy = -6.4; this.life = 40;
  }
  CoinPop.prototype = Object.create(Entity.prototype);
  CoinPop.prototype.update = function () {
    this.vy += 0.42; this.y += this.vy; this.anim += 1;
    if (--this.life <= 0) this.remove = true;
  };
  CoinPop.prototype.draw = function (ctx, cam) {
    var f = Math.floor(this.anim / 3) % 4;
    var n = f === 0 ? 'coin_a' : (f === 1 ? 'coin_b' : (f === 2 ? 'coin_c' : 'coin_b'));
    Sprites.draw(ctx, n, this.x - cam, this.y, false, null);
  };

  /** 飘起的分数文字 */
  function ScorePop(x, y, text) {
    Entity.call(this, x, y, 8, 8);
    this.type = 'fx'; this.harmless = true;
    this.text = text; this.life = 50;
  }
  ScorePop.prototype = Object.create(Entity.prototype);
  ScorePop.prototype.update = function () {
    this.y -= 0.7;
    if (--this.life <= 0) this.remove = true;
  };
  ScorePop.prototype.draw = function (ctx, cam) {
    var alpha = this.life < 10 ? this.life / 10 : 1;
    if (alpha < 0.3) return;
    var color = this.text === '1UP' ? '#32d800' : '#fcfcfc';
    Font.draw(ctx, this.text, Math.round(this.x - cam), Math.round(this.y), color, 1);
  };

  /** 砖块碎片 */
  function Debris(x, y, vx, vy, theme) {
    Entity.call(this, x, y, 8, 8);
    this.type = 'fx'; this.harmless = true;
    this.vx = vx; this.vy = vy; this.life = 90;
    this.theme = theme || 'overworld';
    this.spin = 0;
  }
  Debris.prototype = Object.create(Entity.prototype);
  Debris.prototype.update = function (g) {
    this.vy += 0.42;
    this.x += this.vx; this.y += this.vy;
    this.spin += 0.35;
    if (--this.life <= 0 || this.y > g.level.pixelHeight + 32) this.remove = true;
  };
  Debris.prototype.draw = function (ctx, cam) {
    var th = Tiles.THEMES[this.theme] || Tiles.THEMES.overworld;
    ctx.save();
    ctx.translate(Math.round(this.x - cam + 4), Math.round(this.y + 4));
    ctx.rotate(this.spin);
    ctx.fillStyle = th.brick;
    ctx.fillRect(-4, -4, 8, 8);
    ctx.fillStyle = th.brickHi;
    ctx.fillRect(-4, -4, 8, 2);
    ctx.fillStyle = th.brickLo;
    ctx.fillRect(-4, 2, 8, 2);
    ctx.restore();
  };

  /* ---------- 食人花 ---------- */
  function Piranha(x, pipeTopY) {
    // x 是水管左侧像素坐标，pipeTopY 是水管口顶部的像素 y。
    Entity.call(this, x + 2, pipeTopY, 12, 24);
    this.sx = -2; this.sy = 0;
    this.type = 'piranha';
    this.sprite = 'piranha';
    this.pipeY = pipeTopY;
    this.hiddenY = pipeTopY;
    this.visibleY = pipeTopY - 24;
    this.emergeTimer = 0;
    this.phase = 'hidden'; // hidden | extending | visible | retracting
    this.harmless = true;
    this.anim = 0;
  }
  Piranha.prototype = Object.create(Entity.prototype);

  Piranha.prototype.update = function (g) {
    var px = g.player.x + g.player.w / 2;
    var cx = this.x + this.w / 2;
    var tooClose = Math.abs(px - cx) < 24;

    // 玩家贴近管口时保持缩回，避免从身体中突然冒出。
    if (tooClose && (this.phase === 'hidden' || this.phase === 'extending')) {
      this.emergeTimer = 0;
      this.phase = 'hidden';
      this.y = this.hiddenY;
      this.harmless = true;
      return;
    }

    this.emergeTimer++;
    if (this.emergeTimer >= 120) this.emergeTimer = 0;

    if (this.emergeTimer < 24) {
      this.phase = 'hidden';
      this.y = this.hiddenY;
      this.harmless = true;
    } else if (this.emergeTimer < 42) {
      this.phase = 'extending';
      this.y = this.hiddenY - ((this.emergeTimer - 24) / 18) * 24;
      this.harmless = true;
    } else if (this.emergeTimer < 78) {
      this.phase = 'visible';
      this.y = this.visibleY;
      this.harmless = false;
    } else if (this.emergeTimer < 96) {
      this.phase = 'retracting';
      this.y = this.visibleY + ((this.emergeTimer - 78) / 18) * 24;
      this.harmless = true;
    } else {
      this.phase = 'hidden';
      this.y = this.hiddenY;
      this.harmless = true;
    }

    this.anim++;
  };

  Piranha.prototype.stomped = function () {
    // 食人花不能被踩死。
  };

  Piranha.prototype.flipOut = function () {
    // 食人花不能被顶块或龟壳击杀。
  };

  Piranha.prototype.draw = function (ctx, cam) {
    if (this.phase === 'hidden') return;
    Sprites.draw(ctx, 'piranha', this.x - cam + this.sx, this.y + this.sy, false, null);
  };

  /* ---------- 库巴（Boss） ---------- */
  function Bowser(x, y) {
    Entity.call(this, x, y - 32, 28, 32);
    this.sx = -2; this.sy = 0;
    this.type = 'bowser';
    this.sprite = 'bowser';
    this.vx = -0.9;
    this.hp = 6;               // 6 发火球或触碰斧头即死
    this.jumpTimer = 0;
    this.fireTimer = 0;
    this.hurtTimer = 0;
    this.harmless = false;
    this.flip = false;
    this.anim = 0;
  }
  Bowser.prototype = Object.create(Entity.prototype);

  Bowser.prototype.update = function (g) {
    if (this.flippedOut) {
      this.vy += GRAVITY; this.y += this.vy;
      this.offscreenKill(g.level);
      return;
    }

    this.jumpTimer++;
    this.fireTimer++;
    if (this.hurtTimer > 0) this.hurtTimer--;

    // 水平移动
    var beforeMove = this.vx;
    if (World.moveX(g.level, this)) this.vx = -beforeMove;

    // 周期性跳跃
    if (this.jumpTimer > 85 && this.vy === 0) {
      this.vy = -6.0;
      this.jumpTimer = 0;
    }

    this.vy = Math.min(this.vy + GRAVITY, 8);
    var r = World.moveY(g.level, this);
    if (r.ground && this.vy > 0) this.vy = 0;

    // 周期性喷火
    if (this.fireTimer > 110) {
      this.fireTimer = 0;
      var fx = this.vx < 0 ? this.x - 8 : this.x + this.w;
      g.spawn(new BowserFire(fx, this.y + 16, this.vx < 0 ? -1 : 1));
    }

    this.anim += 0.3;
    this.flip = this.vx > 0;
    this.offscreenKill(g.level);
  };

  Bowser.prototype.hit = function (g) {
    if (this.dead || this.hurtTimer > 0) return false;
    this.hurtTimer = 20;
    this.hp--;
    g.spawn(new Puff(this.x + this.w / 2 - 8, this.y + this.h / 2 - 8));
    Sound.sfx.kick();
    if (this.hp <= 0) {
      this.flipOut();
      g.addScore(5000, this.x, this.y);
      return true;
    }
    // 受伤后短暂加速
    var dir = this.vx < 0 ? -1 : 1;
    this.vx = dir * Math.min(Math.abs(this.vx) + 0.15, 1.4);
    return true;
  };

  Bowser.prototype.stomped = function () {
    // 库巴不能被踩死
  };

  Bowser.prototype.flipOut = function () {
    if (this.dead) return;
    this.dead = true; this.harmless = true;
    this.vy = -6;
    this.vx = 0;
    this.flippedOut = true;
    this.type = 'dying';
  };

  Bowser.prototype.draw = function (ctx, cam) {
    if (this.flippedOut) {
      ctx.save();
      ctx.translate(Math.round(this.x - cam + this.sx), Math.round(this.y + 32));
      ctx.scale(1, -1);
      Sprites.draw(ctx, 'bowser', 0, 0, false, null);
      ctx.restore();
      return;
    }
    Sprites.draw(ctx, 'bowser', this.x - cam + this.sx, this.y + this.sy, this.flip, null);
  };

  /* ---------- 库巴火焰 ---------- */
  function BowserFire(x, y, dir) {
    Entity.call(this, x, y, 16, 16);
    this.type = 'bowserfire';
    this.sprite = null;
    this.vx = 1.6 * dir;
    this.vy = 0;
    this.life = 180;
    this.baseY = y;
    this.anim = 0;
  }
  BowserFire.prototype = Object.create(Entity.prototype);

  BowserFire.prototype.update = function (g) {
    this.life--;
    if (this.life <= 0) { this.remove = true; return; }
    this.x += this.vx;
    this.y = this.baseY + Math.sin(this.anim * 0.3) * 1.5;
    this.anim++;
    if (this.x < -32 || this.x > g.level.pixelWidth + 32) this.remove = true;
    if (this.y > g.level.pixelHeight + 32) this.remove = true;
  };

  BowserFire.prototype.draw = function (ctx, cam) {
    var a = Math.floor(this.anim / 4) % 4;
    var r = 4 + a * 2;
    ctx.fillStyle = a % 2 === 0 ? '#fcd800' : '#f87800';
    var cx = Math.round(this.x - cam + 8), cy = Math.round(this.y + 8);
    ctx.fillRect(cx - r, cy - 2, r * 2, 4);
    ctx.fillRect(cx - 2, cy - r, 4, r * 2);
  };

  return {
    Entity: Entity, Goomba: Goomba, Koopa: Koopa, Shell: Shell,
    Mushroom: Mushroom, Comet: Comet, Flower: Flower, Fireball: Fireball,
    Piranha: Piranha, Bowser: Bowser, BowserFire: BowserFire,
    Puff: Puff, CoinPop: CoinPop, ScorePop: ScorePop, Debris: Debris,
    GRAVITY: GRAVITY
  };
})();
