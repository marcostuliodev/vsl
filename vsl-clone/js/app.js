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
      html: '<span class="hero__title--accent">Fungos e Insetos</span> em Orquídeas: Aprenda a Reconhecer e Manear Problemas',
      title: 'Fungos e Insetos em Orquídeas | Curso Educativo',
      image: 'https://images.pexels.com/photos/20826372/pexels-photo-20826372.jpeg?auto=compress&cs=tinysrgb&w=800',
      imageAlt: 'Cochonilhas aglomeradas em caule de planta',
      bonus: 'Ao adquirir o curso, você ganha de brinde o e-book de cultivo de orquídeas, conforme as condições do checkout.'
    },
    {
      html: 'Como <span class="hero__title--accent">Observar e Manear Fungos e Insetos em Orquídeas</span> — Conteúdo Educativo e Prático',
      title: 'Observar e Manear Fungos e Insetos em Orquídeas | Curso',
      image: 'https://images.pexels.com/photos/760223/pexels-photo-760223.jpeg?auto=compress&cs=tinysrgb&w=800',
      imageAlt: 'Ácaros-aranha vermelhos em folha de orquídea',
      bonus: 'Ao adquirir o curso, você ganha de brinde o e-book de cultivo de orquídeas, conforme as condições do checkout.'
    },
    {
      html: '<span class="hero__title--accent">Suas Orquídeas Mostram Sinais de Alerta?</span> Aprenda a Observar e Cuidar Melhor',
      title: 'Sinais de Alerta em Orquídeas | Curso Educativo',
      image: 'https://images.pexels.com/photos/29220332/pexels-photo-29220332.jpeg?auto=compress&cs=tinysrgb&w=800',
      imageAlt: 'Mofo cinza (Botrytis) crescendo em planta',
      bonus: 'Ao adquirir o curso, você ganha de brinde o e-book de cultivo de orquídeas, conforme as condições do checkout.'
    },
    {
      html: '<span class="hero__title--accent">Guia Completo:</span> Conhecimento e Cuidados para o Cultivo',
      title: 'Guia de Cuidados para Cultivo de Orquídeas',
      image: 'https://images.pexels.com/photos/37648232/pexels-photo-37648232.jpeg?auto=compress&cs=tinysrgb&w=800',
      imageAlt: 'Dano de tripes em folha de orquídea',
      bonus: 'Ao adquirir o curso, você ganha de brinde o e-book de cultivo de orquídeas, conforme as condições do checkout.'
    },
    {
      html: '<span class="hero__title--accent">Fusarium, Botrytis e Cochonilhas:</span> Aprenda a Reconhecer e Prevenir Problemas',
      title: 'Fusarium, Botrytis e Cochonilhas | Curso Educativo',
      image: 'https://images.pexels.com/photos/4856406/pexels-photo-4856406.jpeg?auto=compress&cs=tinysrgb&w=800',
      imageAlt: 'Fungo Fusarium crescendo em caule de planta',
      bonus: 'Ao adquirir o curso, você ganha de brinde o e-book de cultivo de orquídeas, conforme as condições do checkout.'
    }
  ];

  var heroEl = document.getElementById('hero-title');
  var heroImageEl = document.getElementById('hero-main-image');
  var heroBonusEl = document.getElementById('hero-bonus');

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
    if (heroBonusEl && h.bonus) {
      heroBonusEl.textContent = h.bonus;
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
