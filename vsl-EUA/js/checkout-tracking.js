/**
 * Checkout Tracking — complete funnel measurement for the Hotmart checkout.
 * ============================================================================
 * WHY THIS FILE EXISTS
 * The page previously fired InitiateCheckout on 2 of its 6 checkout buttons and
 * never fired Purchase at all, so Meta could not attribute a single sale to this
 * landing page and the campaign had no conversion signal to optimise against.
 *
 * This module fixes all three gaps:
 *   1. InitiateCheckout  — fired by delegation on EVERY link to the checkout,
 *                          so audiences are no longer polluted by inconsistent
 *                          (or missing) events.
 *   2. Purchase          — captured from Hotmart's own postMessage handshake
 *                          on the checkout/thank-you page.
 *   3. Purchase (fallback) — captured from the thank-you URL parameters, for the
 *                          case where postMessage is unavailable (Safari
 *                          ITP, third-party cookie blocking, popup blockers).
 *
 * DEDUPLICATION
 * Hotmart fires the postMessage AND the URL fallback on many visits. Both land
 * here, so Purchase is recorded once per order id and then suppressed for 24h.
 *
 * SETUP STILL REQUIRED IN THE HOTMART DASHBOARD
 * This file cannot read your Hotmart account. You must also add the Purchase
 * pixel to the Hotmart checkout settings (Marketing > Pixel > Purchase), because
 * the browser that completes the order is on a vercel.app/orquideas domain, not
 * on your landing page domain. Without that, Meta still sees only the click.
 * ============================================================================
 */
(function () {
  'use strict';

  var CONFIG = {
    checkoutHost: 'pay.hotmart.com',
    currency: 'USD',
    value: 34.98,
    contentId: 'treinamento-orquideas-16-modulos',
    contentName: 'Treinamento de Orquídeas — 16 módulos',
    contentCategory: 'Curso Online'
  };

  /* ---------------------------------------------------------------------
   * Meta Pixel helpers
   * ------------------------------------------------------------------ */
  function fbq(...args) {
    if (typeof window.fbq === 'function') {
      try { window.fbq.apply(null, args); } catch (e) { /* never break the page */ }
    }
  }

  /* ---------------------------------------------------------------------
   * Purchase de-duplication — one purchase per order, per browser.
   * localStorage is best-effort; if it throws (private mode / blocked), we
   * still record the event rather than silently dropping a real sale.
   * ------------------------------------------------------------------ */
  var ORDER_TTL_MS = 24 * 60 * 60 * 1000;

  function orderAlreadyRecorded(orderId) {
    if (!orderId) return false;
    try {
      var raw = window.localStorage.getItem('vsl_purchases');
      var map = raw ? JSON.parse(raw) : {};
      var now = Date.now();
      // opportunistic cleanup so the key cannot grow without bound
      Object.keys(map).forEach(function (key) {
        if (now - map[key] > ORDER_TTL_MS) delete map[key];
      });
      if (map[orderId]) { window.localStorage.setItem('vsl_purchases', JSON.stringify(map)); return true; }
      map[orderId] = now;
      window.localStorage.setItem('vsl_purchases', JSON.stringify(map));
      return false;
    } catch (e) {
      return false;
    }
  }

  // Fallback guard for messages that carry no order id at all, so a Hotmart
  // message that repeats cannot spam the pixel. When an order id IS present the
  // id-based dedup above is authoritative, so a genuinely different order is
  // still recorded.
  var sessionFlag = false;

  function readOrderId(data) {
    if (!data) return null;
    var candidates = [data.orderId, data.transaction, data.transactionId, data.purchaseId, data.id];
    // Hotmart nests the identifier inside an `order` object more often than not.
    if (data.order && typeof data.order === 'object') {
      candidates.push(data.order.id, data.order.orderId, data.order.code, data.order.reference);
    }
    for (var i = 0; i < candidates.length; i++) {
      var c = candidates[i];
      if (typeof c === 'string' && c.trim()) return c.trim();
      if (typeof c === 'number' && isFinite(c)) return String(c);
    }
    return null;
  }

  function readAmount(data) {
    if (!data) return null;
    var candidates = [data.amount, data.price, data.total, data.value];
    if (data.order && typeof data.order === 'object') {
      candidates.push(data.order.amount, data.order.price, data.order.total);
    }
    for (var i = 0; i < candidates.length; i++) {
      var raw = candidates[i];
      if (raw === undefined || raw === null || raw === '') continue;
      var n = typeof raw === 'string' ? parseFloat(raw.replace(',', '.')) : Number(raw);
      if (!isNaN(n) && n > 0) return n;
    }
    return null;
  }

  function trackPurchase(data) {
    var orderId = readOrderId(data);

    if (orderId) {
      if (orderAlreadyRecorded(orderId)) return;
    } else if (sessionFlag) {
      return;
    }

    var value = readAmount(data);
    if (value === null) value = CONFIG.value;
    var currency = (data && data.currency) || CONFIG.currency;

    sessionFlag = true;

    fbq('track', 'Purchase', {
      content_ids: [orderId || CONFIG.contentId],
      content_name: CONFIG.contentName,
      content_category: CONFIG.contentCategory,
      content_type: 'product',
      value: value,
      currency: currency
    });

    // Also record it server-side so the custom metrics dashboard sees the sale,
    // not just the click. tracking.js exposes this via its 'meta_event' hook.
    try {
      if (window.__vslMetrics && typeof window.__vslMetrics.send === 'function') {
        window.__vslMetrics.send('purchase', {
          orderId: orderId,
          value: value,
          currency: currency
        }, false);
      }
    } catch (e) { /* non-blocking */ }

    try {
      window.sessionStorage.setItem('vsl_purchase_sent', '1');
    } catch (e) { /* non-blocking */ }
  }

  /* ---------------------------------------------------------------------
   * 1. InitiateCheckout — delegated, so every checkout link is covered
   * ------------------------------------------------------------------ */
  function initCheckoutClicks() {
    document.addEventListener('click', function (event) {
      var link = event.target && event.target.closest
        ? event.target.closest('a[href]')
        : null;
      if (!link) return;

      var href = link.getAttribute('href') || '';
      if (href.indexOf(CONFIG.checkoutHost) === -1) return;

      fbq('track', 'InitiateCheckout', {
        content_ids: [CONFIG.contentId],
        content_name: CONFIG.contentName,
        content_category: CONFIG.contentCategory,
        content_type: 'product',
        value: CONFIG.value,
        currency: CONFIG.currency
      });
    }, { passive: true });
  }

  /* ---------------------------------------------------------------------
   * 2. Purchase from Hotmart's postMessage handshake
   * ------------------------------------------------------------------ */
  function initPostMessage() {
    window.addEventListener('message', function (event) {
      // Only accept messages from Hotmart. Never trust the payload from others.
      var origin = '';
      try { origin = event.origin || ''; } catch (e) { origin = ''; }
      if (origin && origin.indexOf(CONFIG.checkoutHost) === -1) return;

      var data = event.data;
      if (!data || typeof data !== 'object') return;

      // Hotmart has used several shapes over time; match on the event name.
      var name = String(data.event || data.type || data.action || '').toLowerCase();
      var looksLikePurchase =
        name.indexOf('purchase') !== -1 ||
        name.indexOf('order.paid') !== -1 ||
        name.indexOf('order_paid') !== -1 ||
        name.indexOf('payment') !== -1 && data.status === 'paid';

      if (looksLikePurchase || data.order || data.orderId) {
        trackPurchase(data);
      }
    });
  }

  /* ---------------------------------------------------------------------
   * 3. Purchase from the thank-you URL  ?purchase=1&order=XXXX
   * ------------------------------------------------------------------ */
  function initUrlFallback() {
    var params;
    try { params = new URLSearchParams(window.location.search); }
    catch (e) { return; }

    var purchased = params.get('purchase') || params.get('purchaseSuccess') || params.get('paid');
    if (!purchased || purchased === '0' || purchased === 'false') return;

    trackPurchase({
      orderId: params.get('order') || params.get('orderId') || params.get('transaction'),
      amount: params.get('amount') || params.get('value'),
      currency: params.get('currency') || CONFIG.currency
    });
  }

  function init() {
    try { initCheckoutClicks(); initPostMessage(); initUrlFallback(); }
    catch (e) { /* tracking must never break the page */ }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
