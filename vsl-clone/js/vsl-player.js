/**
 * VSL Player — Libera conteúdo e redimensiona iframe (SEGURANÇA: postMessage sanitizado)
 */
(function () {
  var SELECTOR = '[data-vslplay="5f2e38a8-3abb-4ee8-af75-2f6107e92f5e"]';
  var ALLOWED_ORIGIN = 'https://iframe.vslplay.com';

  // Whitelist de tipos de mensagem aceitos
  var ALLOWED_TYPES = new Set(['height', 'button-visibility']);

  // Sanitizar valor numérico — aceitar SOMENTE número seguro
  function sanitizeNumericValue(val) {
    if (typeof val === 'number' && isFinite(val) && val >= 0 && val <= 10000) {
      return val;
    }
    if (typeof val === 'string') {
      var parsed = parseFloat(val);
      if (!isNaN(parsed) && isFinite(parsed) && parsed >= 0 && parsed <= 10000) {
        return parsed;
      }
    }
    return null;
  }

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
    // 1. Validar origem rigorosamente
    if (e.origin !== ALLOWED_ORIGIN) return;

    // 2. Validar estrutura da mensagem
    if (!e.data || typeof e.data !== 'object') return;
    if (e.data.from !== 'vslplay-player') return;

    // 3. Validar tipo contra whitelist
    var msgType = e.data.type;
    if (!ALLOWED_TYPES.has(msgType)) return;

    var content = document.querySelector(SELECTOR);
    if (!content) return;

    if (msgType === 'height') {
      // 4. Sanitizar valor — aceitar SOMENTE número seguro
      var sanitized = sanitizeNumericValue(e.data.value);
      if (sanitized === null) return; // Descartar valor inválido
      content.style.paddingTop = 'calc(56.25% + ' + sanitized + 'px)';
    } else if (msgType === 'button-visibility') {
      // 5. Validar que value é booleano estrito
      if (e.data.value === true) {
        forceReleaseVSL();
      } else if (e.data.value === false && !vslReleased) {
        document.querySelectorAll('.vslplay-show').forEach(function (el) {
          el.style.setProperty('display', 'none', 'important');
        });
      }
    }
  });
})();
