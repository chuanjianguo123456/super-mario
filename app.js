/* PWA shell: browser installs are handled by the platform's own install UI. */
(function () {
  if (!('serviceWorker' in navigator) || location.protocol === 'file:') return;

  window.addEventListener('load', function () {
    navigator.serviceWorker.register('sw.js').catch(function (err) {
      console.warn('Service worker registration failed:', err);
    });
  });
})();
