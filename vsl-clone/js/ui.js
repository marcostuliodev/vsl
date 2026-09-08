/**
 * UI — Reveal on scroll, FAQ accordion, fix invisible, lazy load
 */
(function () {
  /* ---- Fix: Remove elementor-invisible dos CTAs ---- */
  function fixInvisible() {
    document.querySelectorAll('.elementor-invisible').forEach(function (el) {
      el.classList.remove('elementor-invisible');
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fixInvisible);
  } else {
    fixInvisible();
  }
  window.addEventListener('load', fixInvisible);
  setTimeout(fixInvisible, 300);
  setTimeout(fixInvisible, 900);

  /* ---- Reveal on Scroll (IntersectionObserver) ---- */
  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function initRevealScroll() {
    var items = document.querySelectorAll('.reveal-scroll');
    if (!items.length) return;

    if (prefersReducedMotion) {
      items.forEach(function (el) {
        el.style.opacity = '1';
        el.style.filter = 'none';
        el.style.transform = 'none';
      });
      return;
    }

    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var el = entry.target;
            el.style.opacity = '1';
            el.style.filter = 'none';
            el.style.transform = 'none';
            el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.unobserve(el);
          }
        });
      }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

      items.forEach(function (el) { observer.observe(el); });
    } else {
      items.forEach(function (el) {
        el.style.opacity = '1';
        el.style.filter = 'none';
        el.style.transform = 'none';
      });
    }
  }

  document.addEventListener('DOMContentLoaded', initRevealScroll);
  window.addEventListener('load', initRevealScroll);
  setTimeout(initRevealScroll, 300);
  setTimeout(initRevealScroll, 900);
  setTimeout(function () {
    document.querySelectorAll('.reveal-scroll').forEach(function (el) {
      el.style.opacity = '1';
      el.style.filter = 'none';
      el.style.transform = 'none';
    });
  }, 2500);

  /* ---- FAQ Accordion ---- */
  var faqItems = document.querySelectorAll('#orchid-faq .faq-item');
  faqItems.forEach(function (item) {
    var question = item.querySelector('.faq-question');
    var answer = item.querySelector('.faq-answer');
    var num = item.querySelector('.number').textContent.trim();

    question.setAttribute('role', 'button');
    question.setAttribute('tabindex', '0');
    question.setAttribute('aria-expanded', item.classList.contains('active') ? 'true' : 'false');
    question.setAttribute('aria-controls', 'faq-answer-' + num);
    answer.setAttribute('id', 'faq-answer-' + num);
    answer.setAttribute('role', 'region');

    function toggle() {
      if (item.classList.contains('active')) {
        item.classList.remove('active');
        question.setAttribute('aria-expanded', 'false');
      } else {
        faqItems.forEach(function (i) {
          i.classList.remove('active');
          i.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
        });
        item.classList.add('active');
        question.setAttribute('aria-expanded', 'true');
      }
    }

    question.addEventListener('click', toggle);
    question.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggle();
      }
    });
  });

  /* ---- Lazy Load (Elementor) ---- */
  function lazyloadRunObserver() {
    var lazyloadBackgrounds = document.querySelectorAll('.e-con.e-parent:not(.e-lazyloaded)');
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var el = entry.target;
          if (el) el.classList.add('e-lazyloaded');
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: '200px 0px 200px 0px' });
    lazyloadBackgrounds.forEach(function (el) { observer.observe(el); });
  }
  document.addEventListener('DOMContentLoaded', lazyloadRunObserver);
  document.addEventListener('elementor/lazyload/observe', lazyloadRunObserver);
})();
