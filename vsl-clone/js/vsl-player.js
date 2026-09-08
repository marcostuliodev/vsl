/**
 * VSL Player — Libera conteúdo e redimensiona iframe
 */
(function () {
  var SELECTOR = '[data-vslplay="5f2e38a8-3abb-4ee8-af75-2f6107e92f5e"]';

  function releaseVSLContent() {
    document.querySelectorAll('.vslplay-show').forEach(function (el) {
      el.style.setProperty('display', 'block', 'important');
      el.classList.remove('elementor-invisible');
    });
  }

  var vslReleased = false;
  function forceReleaseVSL() {
    if (vslReleased) return;
    vslReleased = true;
    releaseVSLContent();
  }

  setTimeout(forceReleaseVSL, 50);

  window.addEventListener('message', function (e) {
    if (e.origin !== 'https://iframe.vslplay.com' || e.data.from !== 'vslplay-player') return;

    var content = document.querySelector(SELECTOR);
    if (!content) return;

    if (e.data.type === 'height') {
      content.style.paddingTop = e.data.value
        ? 'calc(56.25% + ' + e.data.value + 'px)'
        : '56.25%';
    } else if (e.data.type === 'button-visibility') {
      if (e.data.value) {
        forceReleaseVSL();
      } else if (!vslReleased) {
        document.querySelectorAll('.vslplay-show').forEach(function (el) {
          el.style.setProperty('display', 'none', 'important');
        });
      }
    }
  });
})();
