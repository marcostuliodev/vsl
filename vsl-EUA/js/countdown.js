/**
 * Countdown — Timer do banner de urgência
 * Usa localStorage para manter consistência entre recarregamentos
 */
(function () {
  var STORAGE_KEY = 'vsl_countdown_end';
  var DURATION_MS = 4 * 60 * 60 * 1000; // 4 horas

  var endTime = localStorage.getItem(STORAGE_KEY);
  if (!endTime || parseInt(endTime) < Date.now()) {
    endTime = Date.now() + DURATION_MS;
    localStorage.setItem(STORAGE_KEY, endTime);
  }
  endTime = parseInt(endTime);

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
      localStorage.setItem(STORAGE_KEY, endTime);
    }
  }

  update();
  setInterval(update, 1000);
})();
