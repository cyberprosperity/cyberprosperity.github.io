/* ==========================================
CFXPROS - LANDING PAGE KOMUNITAS
assets/js/landingpage.js
Tidak mengubah tampilan. Hanya merapikan tautan eksternal.
========================================== */

(function () {
  document.addEventListener('DOMContentLoaded', function () {
    // Tautan ke domain lain dibuka aman (rel noopener) bila memakai target _blank
    document.querySelectorAll('a[target="_blank"]').forEach(function (a) {
      a.setAttribute('rel', 'noopener noreferrer');
    });
  });
})();