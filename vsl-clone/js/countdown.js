/**
 * Countdown — Timer com validação de integridade no localStorage
 */
(function () {
  var STORAGE_KEY = 'vsl_countdown_end';
  var DURATION_MS = 4 * 60 * 60 * 1000; // 4 horas
  var MAX_REASONABLE = 24 * 60 * 60 * 1000; // Máximo 24h no futuro
  var MAX_PAST = 60 * 60 * 1000; // Máximo 1h no passado

  function getEndTime() {
    var stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    var val = parseInt(stored, 10);
    if (isNaN(val) || val <= 0) return null;
    var diff = val - Date.now();
    if (diff > MAX_REASONABLE || diff < -MAX_PAST) return null;
    return val;
  }

  var endTime = getEndTime();
  if (endTime === null || endTime < Date.now()) {
    endTime = Date.now() + DURATION_MS;
    try {
      localStorage.setItem(STORAGE_KEY, String(endTime));
    } catch (e) {
      // localStorage indisponível — ignorar
    }
  }

  var hEl = document.getElementById('cd-hours');
  var mEl = document.getElementById('cd-minutes');
  var sEl = document.getElementById('cd-seconds');

  function update() {
    var diff = Math.max(0, endTime - Date.now());
    var h = Math.floor(diff / (1000 * 60 * 60));
    var m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    var s = Math.floor((diff % (1000 * 60)) / 1000);

    if (hEl) hEl.textContent = String(h).padStart(2, '0');
    if (mEl) mEl.textContent = String(m).padStart(2, '0');
    if (sEl) sEl.textContent = String(s).padStart(2, '0');

    if (diff <= 0) {
      endTime = Date.now() + DURATION_MS;
      try {
        localStorage.setItem(STORAGE_KEY, String(endTime));
      } catch (e) {
        // ignorar
      }
    }
  }

  update();
  setInterval(update, 1000);
})();
