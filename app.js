/* PWA shell: installation and offline startup. */
(function () {
  var installButton = document.getElementById('install-app');
  var deferredInstall = null;

  window.addEventListener('beforeinstallprompt', function (event) {
    event.preventDefault();
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

  if (!('serviceWorker' in navigator) || location.protocol === 'file:') return;

  window.addEventListener('load', function () {
    navigator.serviceWorker.register('sw.js').catch(function (err) {
      console.warn('Service worker registration failed:', err);
    });
  });
})();
