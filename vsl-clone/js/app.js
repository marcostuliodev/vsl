/**
 * App — Pragas & Doenças em Orquídeas
 * FAQ, Reveal, Sticky CTA, Scroll suave e hooks leves de analytics
 */
(function () {
  'use strict';

  /* ============================================
     FAQ / ACCORDION
     ============================================ */
  var faqItems = document.querySelectorAll('.faq__item');

  faqItems.forEach(function (item) {
    var btn = item.querySelector('.faq__question');
    if (!btn) return;

    btn.addEventListener('click', function () {
      var wasActive = item.classList.contains('active');

      faqItems.forEach(function (other) {
        if (other === item) return;
        other.classList.remove('active');
        var otherBtn = other.querySelector('.faq__question');
        if (otherBtn) otherBtn.setAttribute('aria-expanded', 'false');
      });

      if (wasActive) {
        item.classList.remove('active');
        btn.setAttribute('aria-expanded', 'false');
      } else {
        item.classList.add('active');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });

  /* ============================================
     SCROLL REVEAL
     ============================================ */
  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function initReveal() {
    var targets = document.querySelectorAll('[data-reveal]');

    if (prefersReduced || !('IntersectionObserver' in window)) {
      targets.forEach(function (el) {
        el.classList.add('revealed');
      });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    targets.forEach(function (el) {
      observer.observe(el);
    });
  }
  initReveal();

  /* ============================================
     STICKY CTA / HEADER / BACK TO TOP
     ============================================ */
  var stickyEl = document.getElementById('sticky-cta');
  var headerEl = document.getElementById('header');
  var btt = document.getElementById('back-to-top');
  var lastScroll = 0;

  function onScroll() {
    var y = window.scrollY;

    if (stickyEl) {
      if (y > 600) {
        stickyEl.classList.add('visible');
      } else {
        stickyEl.classList.remove('visible');
      }
    }

    if (headerEl) {
      if (y > 100) {
        if (y > lastScroll && y > 300) {
          headerEl.classList.add('header--hidden');
        } else {
          headerEl.classList.remove('header--hidden');
        }
      } else {
        headerEl.classList.remove('header--hidden');
      }
    }

    if (btt) {
      if (y > 800) {
        btt.classList.add('visible');
      } else {
        btt.classList.remove('visible');
      }
    }

    lastScroll = y;
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (btt) {
    btt.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: prefersReduced ? 'auto' : 'smooth' });
    });
  }

  /* ============================================
     SCROLL SUAVE PARA ÂNCORAS
     ============================================ */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var href = a.getAttribute('href');
      if (!href || href === '#') return;
      var target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      var top = target.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top: top, behavior: prefersReduced ? 'auto' : 'smooth' });
    });
  });

  /* ============================================
     ANALYTICS — hooks leves (sem pixels novos)
     ============================================ */
  var MILESTONES = [25, 50, 75];
  var VSL_ORIGIN = 'https://iframe.vslplay.com';

  function emit(event, params) {
    var payload = params || {};
    var detail = { event: event, params: payload };

    document.dispatchEvent(new CustomEvent('vsl:analytics', { detail: detail }));

    if (typeof window.fbq !== 'function') return;

    try {
      if (event === 'video_start') {
        window.fbq('track', 'VideoStart', payload);
      } else if (event === 'video_progress') {
        window.fbq('track', 'VideoProgress', payload);
      } else if (event === 'cta_click' || event === 'checkout_click') {
        window.fbq('track', 'ClickButton', payload);
      }
    } catch (err) {
      /* fbq indisponível ou bloqueado: evento já foi emitido via CustomEvent */
    }
  }

  function labelOf(el) {
    return (el && el.textContent ? el.textContent : '').replace(/\s+/g, ' ').trim();
  }

  function trackVideo(video) {
    var source = video.getAttribute('data-track-name') || 'video';
    var sent = {};
    var started = false;

    video.addEventListener('play', function () {
      if (started) return;
      started = true;
      emit('video_start', {
        content_name: source,
        content_type: 'product',
        content_category: 'treinamento'
      });
    });

    video.addEventListener('timeupdate', function () {
      var duration = video.duration;
      if (!isFinite(duration) || duration <= 0) return;
      var percent = (video.currentTime / duration) * 100;
      MILESTONES.forEach(function (mark) {
        if (sent[mark] || percent < mark) return;
        sent[mark] = true;
        emit('video_progress', {
          content_name: source,
          content_type: 'product',
          value: mark / 100
        });
      });
    });
  }

  document.querySelectorAll('video').forEach(trackVideo);

  var vslFrame = document.getElementById('vsl-player');
  if (vslFrame) {
    var iframe = vslFrame.querySelector('iframe');
    var vslStarted = false;
    var vslSent = {};

    function markVSL(mark) {
      if (mark === 0) {
        if (vslStarted) return;
        vslStarted = true;
        emit('video_start', {
          content_name: 'apresentacao',
          content_type: 'product',
          content_category: 'treinamento'
        });
        return;
      }
      if (vslSent[mark]) return;
      vslSent[mark] = true;
      emit('video_progress', {
        content_name: 'apresentacao',
        content_type: 'product',
        value: mark / 100
      });
    }

    if (iframe) {
      iframe.addEventListener('click', function () {
        markVSL(0);
      });
    }

    window.addEventListener('message', function (e) {
      if (e.origin !== VSL_ORIGIN) return;
      var data = e.data;
      if (!data || typeof data !== 'object' || typeof data.type !== 'string') return;

      var type = data.type.toLowerCase();
      var value = typeof data.value === 'number' ? data.value : NaN;

      if (type === 'video_start' || type === 'play' || type === 'started') {
        markVSL(0);
        return;
      }

      if ((type === 'progress' || type === 'video_progress' || type === 'percent') && isFinite(value)) {
        var percent = value > 0 && value <= 1 ? value * 100 : value;
        MILESTONES.forEach(function (mark) {
          if (percent >= mark) markVSL(mark);
        });
      }
    });
  }

  document.addEventListener('click', function (e) {
    var el = e.target && e.target.closest ? e.target.closest('[data-track]') : null;
    if (!el) return;

    var kind = el.getAttribute('data-track');

    if (kind === 'checkout') {
      emit('checkout_click', {
        content_name: labelOf(el),
        content_category: 'checkout'
      });
      return;
    }

    if (kind === 'cta') {
      emit('cta_click', {
        content_name: labelOf(el),
        content_category: 'treinamento'
      });
    }
  });

})();
