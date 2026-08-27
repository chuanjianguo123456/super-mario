/* 键盘输入：按下状态 + 边沿触发 */
var Input = (function () {
  var MAP = {
    'ArrowLeft': 'left', 'KeyA': 'left',
    'ArrowRight': 'right', 'KeyD': 'right',
    'ArrowUp': 'up', 'KeyW': 'up',
    'ArrowDown': 'down', 'KeyS': 'down',
    'Space': 'jump', 'KeyK': 'jump', 'KeyZ': 'jump',
    'ShiftLeft': 'run', 'ShiftRight': 'run', 'KeyJ': 'run', 'KeyX': 'run',
    'Enter': 'start', 'NumpadEnter': 'start',
    'KeyC': 'continue',
    'KeyP': 'pause', 'Escape': 'pause',
    'KeyR': 'reset', 'KeyM': 'mute'
  };

  var down = {}, pressed = {}, prev = {};
  var onFirstInput = null, fired = false;

  function set(code, isDown, e) {
    var act = MAP[code];
    if (!act) return;
    if (e && (act !== 'reset')) e.preventDefault();
    if (isDown) {
      if (!fired && onFirstInput) { fired = true; try { onFirstInput(); } catch (_) {} }
      down[act] = true;
    } else {
      down[act] = false;
    }
  }

  window.addEventListener('keydown', function (e) {
    if (e.repeat) { if (MAP[e.code]) e.preventDefault(); return; }
    set(e.code, true, e);
  });
  window.addEventListener('keyup', function (e) { set(e.code, false, e); });
  window.addEventListener('blur', function () { down = {}; prev = {}; pressed = {}; });

  /** 每帧开始时调用：计算本帧的边沿触发 */
  function poll() {
    pressed = {};
    for (var k in down) if (down[k] && !prev[k]) pressed[k] = true;
    for (var j in down) prev[j] = down[j];
  }

  function isDown(a) { return !!down[a]; }
  function justPressed(a) { return !!pressed[a]; }
  function clear() { down = {}; prev = {}; pressed = {}; }
  function setFirstInputHook(fn) { onFirstInput = fn; }

  function bindTouch(elements) {
    if (!elements) return;
    for (var i = 0; i < elements.length; i++) {
      (function (el) {
        var code = el.getAttribute('data-key');
        if (!code) return;
        function press(e) {
          if (e) { e.preventDefault(); if (e.pointerId != null && el.setPointerCapture) el.setPointerCapture(e.pointerId); }
          el.classList.add('is-held');
          set(code, true, e);
        }
        function release(e) {
          if (e) e.preventDefault();
          el.classList.remove('is-held');
          set(code, false, e);
        }
        el.addEventListener('pointerdown', press);
        el.addEventListener('pointerup', release);
        el.addEventListener('pointercancel', release);
        el.addEventListener('lostpointercapture', release);
      })(elements[i]);
    }
  }

  return { poll: poll, isDown: isDown, justPressed: justPressed, clear: clear,
    setFirstInputHook: setFirstInputHook, bindTouch: bindTouch };
})();
