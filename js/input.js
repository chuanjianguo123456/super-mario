/* 键盘、触屏、标准布局手柄统一输入。每个按键独立记账，避免多键/多指互相松开。 */
var Input = (function () {
  var MAP = {
    'ArrowLeft': 'left', 'KeyA': 'left',
    'ArrowRight': 'right', 'KeyD': 'right',
    'ArrowUp': 'up', 'KeyW': 'up',
    'ArrowDown': 'down', 'KeyS': 'down',
    'Space': 'jump', 'KeyK': 'jump', 'KeyZ': 'jump',
    'ShiftLeft': 'run', 'ShiftRight': 'run', 'KeyJ': 'run', 'KeyX': 'run',
    'Enter': 'start', 'NumpadEnter': 'start', 'KeyC': 'continue',
    'KeyP': 'pause', 'Escape': 'pause', 'KeyR': 'reset', 'KeyM': 'mute', 'F3': 'debug'
  };
  var sources = {}, down = {}, prev = {}, pressed = {}, pending = {};
  var touchBindings = [], padBlocked = false, firstHook = null, hooked = false;

  function firstInput() {
    if (!hooked && firstHook) {
      hooked = true;
      try { firstHook(); } catch (_) {}
    }
  }
  function held(action) {
    for (var id in sources) if (sources[id] === action) return true;
    return false;
  }
  function setSource(id, action, active) {
    if (active) {
      if (!held(action)) pending[action] = true;
      sources[id] = action;
      firstInput();
    } else delete sources[id];
  }
  function keyEvent(e, active) {
    var action = MAP[e.code];
    if (!action) return;
    // 焦点在按钮上时，Enter/Space 交给按钮的 click 事件处理。
    if ((e.code === 'Enter' || e.code === 'Space') && e.target &&
        e.target.closest && e.target.closest('button')) return;
    if (action !== 'reset') e.preventDefault();
    if (active && e.repeat) return;
    setSource('key:' + e.code, action, active);
  }
  window.addEventListener('keydown', function (e) { keyEvent(e, true); });
  window.addEventListener('keyup', function (e) { keyEvent(e, false); });
  window.addEventListener('blur', function () { padBlocked = true; clear(); });
  window.addEventListener('focus', function () { padBlocked = false; });
  if (typeof document !== 'undefined' && document.addEventListener)
    document.addEventListener('visibilitychange', function () {
      padBlocked = !!document.hidden;
      if (padBlocked) clear();
    });

  function button(buttons, index) {
    var b = buttons[index];
    return typeof b === 'number' ? b > 0.5 : !!(b && (b.pressed || b.value > 0.5));
  }
  function pollGamepads() {
    var next = {};
    try {
      if (!padBlocked && typeof navigator !== 'undefined' && navigator.getGamepads) {
        var pads = navigator.getGamepads() || [];
        for (var i = 0; i < pads.length; i++) {
          var p = pads[i];
          if (!p || p.connected === false || p.mapping !== 'standard') continue;
          var a = p.axes || [], b = p.buttons || [];
          var x = Number(a[0]) || 0, y = Number(a[1]) || 0;
          if (x < -0.35 || button(b, 14)) next.left = true;
          if (x > 0.35 || button(b, 15)) next.right = true;
          if (y < -0.35 || button(b, 12)) next.up = true;
          if (y > 0.35 || button(b, 13)) next.down = true;
          if (button(b, 0)) next.jump = true;
          if (button(b, 1) || button(b, 2) || button(b, 7)) next.run = true;
          if (button(b, 9)) { next.start = true; next.pause = true; }
          if (button(b, 8)) next.continue = true;
        }
      }
    } catch (_) { /* 手柄不可用时仍可使用键盘和触屏。 */ }
    var actions = ['left', 'right', 'up', 'down', 'jump', 'run', 'start', 'pause', 'continue'];
    for (var j = 0; j < actions.length; j++)
      setSource('pad:' + actions[j], actions[j], !!next[actions[j]]);
  }
  function poll() {
    pollGamepads();
    var next = {}, id, action;
    for (id in sources) next[sources[id]] = true;
    pressed = pending;
    pending = {};
    for (action in next) if (!prev[action]) pressed[action] = true;
    down = next;
    prev = next;
  }
  function isDown(action) { return !!down[action]; }
  function justPressed(action) { return !!pressed[action]; }
  function clear() {
    sources = {}; down = {}; prev = {}; pressed = {}; pending = {};
    for (var i = 0; i < touchBindings.length; i++) touchBindings[i].reset();
  }
  function setFirstInputHook(fn) { firstHook = fn; }
  function bindTouch(elements) {
    if (!elements) return;
    for (var i = 0; i < elements.length; i++) (function (el) {
      var action = MAP[el.getAttribute('data-key')];
      if (!action || touchBindings.some(function (entry) { return entry.el === el; })) return;
      var prefix = 'touch:' + touchBindings.length + ':', fingers = {};
      touchBindings.push({ el: el, reset: function () {
        fingers = {};
        el.classList.remove('is-held');
      } });
      function press(e) {
        if (e.button != null && e.button !== 0) return;
        e.preventDefault();
        var id = e.pointerId == null ? 0 : e.pointerId;
        fingers[id] = true;
        if (el.setPointerCapture && e.pointerId != null) {
          try { el.setPointerCapture(e.pointerId); } catch (_) {}
        }
        el.classList.add('is-held');
        setSource(prefix + id, action, true);
      }
      function release(e) {
        e.preventDefault();
        var id = e.pointerId == null ? 0 : e.pointerId;
        delete fingers[id];
        setSource(prefix + id, action, false);
        if (!Object.keys(fingers).length) el.classList.remove('is-held');
      }
      el.addEventListener('pointerdown', press);
      el.addEventListener('pointerup', release);
      el.addEventListener('pointercancel', release);
      el.addEventListener('lostpointercapture', release);
      el.addEventListener('click', function (e) {
        if (e.detail !== 0) return; // 物理点击已经由 pointerdown 处理。
        firstInput();
        pending[action] = true; // 键盘/辅助技术激活按钮。
      });
    })(elements[i]);
  }
  return { poll: poll, isDown: isDown, justPressed: justPressed, clear: clear,
    setFirstInputHook: setFirstInputHook, bindTouch: bindTouch };
})();
