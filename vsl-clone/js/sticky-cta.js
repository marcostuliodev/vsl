/**
 * Sticky CTA — Barra fixa no mobile após scroll
 */
(function () {
  var sticky = document.getElementById('sticky-cta');
  if (!sticky) return;

  var shown = false;
  function checkScroll() {
    if (window.scrollY > 600 && !shown) {
      sticky.style.display = 'block';
      shown = true;
    }
  }
  window.addEventListener('scroll', checkScroll, { passive: true });
  checkScroll();

  /* Timer interno da sticky bar */
  var timerElement = document.getElementById('timer');
  if (!timerElement) return;

  var deadline = new Date();
  deadline.setTime(deadline.getTime() + 5 * 60 * 60 * 1000);

  function updateTimer() {
    var distance = deadline - Date.now();
    if (distance < 0) {
      timerElement.textContent = 'EXPIRADO';
      timerElement.style.color = '#ff4444';
      return;
    }
    var h = Math.floor((distance % (1000 * 60 * 60 * 5)) / (1000 * 60 * 60));
    var m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    var s = Math.floor((distance % (1000 * 60)) / 1000);
    timerElement.textContent =
      String(h).padStart(2, '0') + ':' +
      String(m).padStart(2, '0') + ':' +
      String(s).padStart(2, '0');
  }

  updateTimer();
  setInterval(updateTimer, 1000);
})();
