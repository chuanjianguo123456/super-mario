/* PWA shell: installation and offline startup. */
(function () {
  var installButton = document.getElementById('install-app');
  var soundButton = document.getElementById('sound-app');
  var fullscreenButton = document.getElementById('fullscreen-app');
  var deferredInstall = null;
  var isDesktop = !!(window.desktop && window.desktop.isDesktop);
  var desktopBridge = isDesktop ? window.desktop : null;
  var desktopFullscreen = false;

  function syncSoundButton() {
    if (!soundButton || !window.Sound) return;
    var enabled = Sound.isEnabled();
    soundButton.textContent = enabled ? '♫' : '—';
    soundButton.setAttribute('aria-label', enabled ? '关闭声音' : '打开声音');
    soundButton.title = enabled ? '关闭声音' : '打开声音';
  }

  function isFullscreen() {
    if (desktopBridge) return desktopFullscreen;
    return !!(document.fullscreenElement || document.webkitFullscreenElement);
  }

  function syncFullscreenButton() {
    if (!fullscreenButton) return;
    var active = isFullscreen();
    fullscreenButton.textContent = active ? '×' : '⛶';
    fullscreenButton.setAttribute('aria-label', active ? '退出全屏' : '进入全屏');
    fullscreenButton.title = active ? '退出全屏' : '进入全屏';
  }

  function setDesktopFullscreen(active) {
    if (typeof active !== 'boolean') return;
    desktopFullscreen = active;
    syncFullscreenButton();
  }

  if (isDesktop && installButton) installButton.hidden = true;

  if (desktopBridge && typeof desktopBridge.onFullscreenChange === 'function') {
    desktopBridge.onFullscreenChange(setDesktopFullscreen);
  }

  window.addEventListener('beforeinstallprompt', function (event) {
    event.preventDefault();
    if (desktopBridge) {
      deferredInstall = null;
      if (installButton) installButton.hidden = true;
      return;
    }
    deferredInstall = event;
    if (installButton) installButton.hidden = false;
  });

  window.addEventListener('appinstalled', function () {
    deferredInstall = null;
    if (installButton) installButton.hidden = true;
  });

  if (installButton) {
    installButton.addEventListener('click', function () {
      if (!deferredInstall) return;
      var prompt = deferredInstall;
      deferredInstall = null;
      installButton.hidden = true;
      prompt.prompt();
      prompt.userChoice.catch(function () {});
    });
  }

  if (soundButton) {
    soundButton.addEventListener('click', function () {
      if (window.Game && Game.toggleSound) Game.toggleSound();
      syncSoundButton();
    });
  }

  if (fullscreenButton) {
    fullscreenButton.addEventListener('click', function () {
      if (desktopBridge && typeof desktopBridge.toggleFullscreen === 'function') {
        Promise.resolve(desktopBridge.toggleFullscreen())
          .then(setDesktopFullscreen)
          .catch(function () {});
        return;
      }

      var root = document.documentElement;
      if (isFullscreen()) {
        var exit = document.exitFullscreen || document.webkitExitFullscreen;
        if (exit) Promise.resolve(exit.call(document)).catch(function () {});
      } else {
        var request = root.requestFullscreen || root.webkitRequestFullscreen;
        if (request) Promise.resolve(request.call(root)).catch(function () {});
      }
    });
  }
  if (!desktopBridge) {
    document.addEventListener('fullscreenchange', syncFullscreenButton);
    document.addEventListener('webkitfullscreenchange', syncFullscreenButton);
  }
  document.addEventListener('visibilitychange', function () {
    if (document.hidden && window.Game && Game.setPaused) Game.setPaused(true);
  });

  window.addEventListener('load', function () {
    syncSoundButton();
    syncFullscreenButton();
  });

  if (!('serviceWorker' in navigator) || location.protocol === 'file:') return;

  window.addEventListener('load', function () {
    navigator.serviceWorker.register('sw.js').catch(function (err) {
      console.warn('Service worker registration failed:', err);
    });
  });
})();
