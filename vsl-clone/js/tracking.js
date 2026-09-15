/**
 * Tracking — Event listeners para Facebook Pixel (seguro, sem onclick inline)
 */
(function () {
  function initTracking() {
    document.querySelectorAll('[data-track-checkout]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (typeof fbq === 'function') {
          fbq('track', 'InitiateCheckout', {
            content_name: 'Treinamento Pragas Doencas Orquideas',
            content_category: 'Curso Online',
            content_ids: ['E103018666W'],
            content_type: 'product',
            value: 97.00,
            currency: 'BRL',
            num_items: 1
          });
        }
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTracking);
  } else {
    initTracking();
  }
})();
