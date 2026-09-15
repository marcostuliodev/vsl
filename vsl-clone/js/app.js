/**
 * App — Fungos & Insetos
 * Countdown, FAQ, Sticky CTA, Scroll Reveal, Headline Switcher
 */
(function () {
  'use strict';

  /* ============================================
     HEADLINE SYSTEM — ALEATÓRIO NA ENTRADA
     Seleciona 1 headline aleatória ao carregar a página
     Imagens das seções de pragas e fungos
     ============================================ */
  var headlines = [
    {
      html: '<span class="hero__title--accent">Fungos e Insetos</span> em Orquídeas: O Método Para Erradicar Antes Que Seja Tarde',
      title: 'Fungos e Insetos em Orquídeas | Treinamento Completo',
      image: 'https://images.pexels.com/photos/20826372/pexels-photo-20826372.jpeg?auto=compress&cs=tinysrgb&w=800',
      imageAlt: 'Cochonilhas aglomeradas em caule de planta'
    },
    {
      html: 'Como <span class="hero__title--accent">Eliminar Fungos e Insetos de Orquídeas em 14 Dias</span> — O Método Que 1.200 Produtores Aprovaram',
      title: 'Eliminar Fungos e Insetos de Orquídeas em 14 Dias | Treinamento',
      image: 'https://images.pexels.com/photos/760223/pexels-photo-760223.jpeg?auto=compress&cs=tinysrgb&w=800',
      imageAlt: 'Ácaros-aranha vermelhos em folha de orquídea'
    },
    {
      html: '<span class="hero__title--accent">Suas Orquídeas Estão Morrendo?</span> Descubra os Fungos e Insetos Que Destroem Suas Plantas',
      title: 'Suas Orquídeas Estão Morrendo? | Descubra a Causa',
      image: 'https://images.pexels.com/photos/29220332/pexels-photo-29220332.jpeg?auto=compress&cs=tinysrgb&w=800',
      imageAlt: 'Mofo cinza (Botrytis) crescendo em planta'
    },
    {
      html: '<span class="hero__title--accent">Guia Completo:</span> Com o Conhecimento Certo, Você Erradica Cada Praga e Doença',
      title: 'Curso Completo de Fungos e Insetos em Orquídeas',
      image: 'https://images.pexels.com/photos/5025664/pexels-photo-5025664.jpeg?auto=compress&cs=tinysrgb&w=800',
      imageAlt: 'Dano de tripes em folha de orquídea'
    },
    {
      html: '<span class="hero__title--accent">Fusarium, Botrytis e Cochonilhas:</span> Identifique e Erradique Antes Que Seja Tarde',
      title: 'Fusarium, Botrytis e Cochonilhas | Treinamento Completo',
      image: 'https://images.pexels.com/photos/4856406/pexels-photo-4856406.jpeg?auto=compress&cs=tinysrgb&w=800',
      imageAlt: 'Fungo Fusarium crescendo em caule de planta'
    }
  ];

  var heroEl = document.getElementById('hero-title');
  var heroImageEl = document.getElementById('hero-main-image');

  function applyHeadline(i) {
    var h = headlines[i];
    if (!h) return;
    if (heroEl) {
      heroEl.innerHTML = h.html;
    }
    if (heroImageEl) {
      heroImageEl.src = h.image;
      heroImageEl.alt = h.imageAlt;
    }
    document.title = h.title;
  }

  // Transição suave no hero title
  if (heroEl) {
    heroEl.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
  }

  // Seleciona 1 headline aleatória ao carregar a página
  var randomIndex = Math.floor(Math.random() * headlines.length);
  applyHeadline(randomIndex);

  /* ============================================
     COUNTDOWN
     ============================================ */
  var STORAGE_KEY = 'fi_countdown_end';
  var DURATION = 4 * 60 * 60 * 1000;
  var MAX_FUTURE = 24 * 60 * 60 * 1000;
  var MAX_PAST = 60 * 60 * 1000;

  function getEndTime() {
    try {
      var v = parseInt(localStorage.getItem(STORAGE_KEY), 10);
      if (isNaN(v) || v <= 0) return null;
      var d = v - Date.now();
      if (d > MAX_FUTURE || d < -MAX_PAST) return null;
      return v;
    } catch (e) { return null; }
  }

  var endTime = getEndTime();
  if (!endTime || endTime < Date.now()) {
    endTime = Date.now() + DURATION;
    try { localStorage.setItem(STORAGE_KEY, String(endTime)); } catch (e) {}
  }

  var hEl = document.getElementById('cd-h');
  var mEl = document.getElementById('cd-m');
  var sEl = document.getElementById('cd-s');
  var stickyTimer = document.getElementById('sticky-timer');

  function pad(n) { return String(n).padStart(2, '0'); }

  function tick() {
    var diff = Math.max(0, endTime - Date.now());
    var h = Math.floor(diff / 3600000);
    var m = Math.floor((diff % 3600000) / 60000);
    var s = Math.floor((diff % 60000) / 1000);
    var str = pad(h) + ':' + pad(m) + ':' + pad(s);
    if (hEl) hEl.textContent = pad(h);
    if (mEl) mEl.textContent = pad(m);
    if (sEl) sEl.textContent = pad(s);
    if (stickyTimer) stickyTimer.textContent = str;
    if (diff <= 0) {
      endTime = Date.now() + DURATION;
      try { localStorage.setItem(STORAGE_KEY, String(endTime)); } catch (e) {}
    }
  }
  tick();
  setInterval(tick, 1000);

  /* ============================================
     FAQ ACCORDION
     ============================================ */
  document.querySelectorAll('.faq__question').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var item = btn.closest('.faq__item');
      var wasActive = item.classList.contains('active');

      // Fechar todos
      document.querySelectorAll('.faq__item.active').forEach(function (i) {
        i.classList.remove('active');
        i.querySelector('.faq__question').setAttribute('aria-expanded', 'false');
      });

      // Abrir clicado (se não estava aberto)
      if (!wasActive) {
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
    if (prefersReduced) {
      document.querySelectorAll('[data-reveal]').forEach(function (el) {
        el.classList.add('revealed');
      });
      return;
    }

    if (!('IntersectionObserver' in window)) {
      document.querySelectorAll('[data-reveal]').forEach(function (el) {
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

    document.querySelectorAll('[data-reveal]').forEach(function (el) {
      observer.observe(el);
    });
  }
  initReveal();

  /* ============================================
     STICKY CTA
     ============================================ */
  var stickyEl = document.getElementById('sticky-cta');
  var headerEl = document.getElementById('header');
  var lastScroll = 0;

  function onScroll() {
    var y = window.scrollY;

    // Sticky CTA aparece após scroll
    if (y > 600) {
      stickyEl.classList.add('visible');
    } else {
      stickyEl.classList.remove('visible');
    }

    // Header hide on scroll down, show on scroll up
    if (y > 100) {
      if (y > lastScroll && y > 300) {
        headerEl.classList.add('header--hidden');
      } else {
        headerEl.classList.remove('header--hidden');
      }
    } else {
      headerEl.classList.remove('header--hidden');
    }
    lastScroll = y;
  }

  window.addEventListener('scroll', onScroll, { passive: true });

  /* ============================================
     BACK TO TOP
     ============================================ */
  var btt = document.getElementById('back-to-top');
  window.addEventListener('scroll', function () {
    if (window.scrollY > 800) {
      btt.classList.add('visible');
    } else {
      btt.classList.remove('visible');
    }
  }, { passive: true });

  btt.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  /* ============================================
     SMOOTH ANCHOR SCROLL
     ============================================ */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var target = document.querySelector(a.getAttribute('href'));
      if (target) {
        e.preventDefault();
        var offset = 80;
        var top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top: top, behavior: 'smooth' });
      }
    });
  });

})();
