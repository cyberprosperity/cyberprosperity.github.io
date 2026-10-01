/* ==========================================
CFXPROS - LANDING PAGE PROMO OKTOBER
Kalkulator rebate: total lot x 8 USD
========================================== */

(function () {
  var lot = document.getElementById('lot');
  var rng = document.getElementById('lotRange');
  var out = document.getElementById('rebate');

  function show(v) {
    v = Math.max(0, parseFloat(v) || 0);
    out.textContent = '$' + (v * 8).toLocaleString('id-ID', { maximumFractionDigits: 2 });
  }
  lot.addEventListener('input', function () { rng.value = Math.min(100, lot.value || 0); show(lot.value); });
  rng.addEventListener('input', function () { lot.value = rng.value; show(rng.value); });
  show(lot.value);
})();