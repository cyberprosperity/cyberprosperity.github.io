/* ==========================================
   CFXPROS - FORGOT PASSWORD
   assets/js/forgot-password.js
   ========================================== */
(function () {
  'use strict';

  /* ---------- CONFIG ---------- */
  // Alamat TETAP halaman reset password.
  // Jangan pakai window.location.origin, karena kalau dites dari
  // Live Server hasilnya jadi http://127.0.0.1:5500 (link email rusak).
  var REDIRECT_URL = 'https://cfxpros.com/reset-password.html';

  /* ---------- Ambil client Supabase ---------- */
  // Sesuaikan jika di supabase-client.js nama variabelnya berbeda.
  var client = (typeof supabaseClient !== 'undefined') ? supabaseClient : null;

  var form = document.getElementById('forgotForm');
  var emailInput = document.getElementById('email');
  var button = document.getElementById('submitBtn');
  var message = document.getElementById('formMessage');

  function showMessage(text, type) {
    message.textContent = text;
    message.className = 'form-message show ' + type;
  }

  function clearMessage() {
    message.textContent = '';
    message.className = 'form-message';
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    clearMessage();

    if (!client || !client.auth) {
      showMessage('Konfigurasi Supabase belum benar. Hubungi admin.', 'error');
      console.error('Client Supabase tidak ditemukan. Cek assets/js/supabase-client.js');
      return;
    }

    var email = emailInput.value.trim();

    if (!email) {
      showMessage('Email wajib diisi.', 'error');
      emailInput.focus();
      return;
    }

    if (!emailInput.checkValidity()) {
      showMessage('Format email tidak valid.', 'error');
      emailInput.focus();
      return;
    }

    button.disabled = true;
    var labelAwal = button.textContent;
    button.textContent = 'Mengirim...';

    try {
      var result = await client.auth.resetPasswordForEmail(email, {
        redirectTo: REDIRECT_URL
      });

      if (result.error) {
        console.error(result.error);
        showMessage('Gagal mengirim email: ' + result.error.message, 'error');
      } else {
        showMessage(
          'Jika email terdaftar, link reset password sudah dikirim. ' +
          'Cek kotak masuk dan folder spam.',
          'success'
        );
        form.reset();
      }
    } catch (err) {
      console.error(err);
      showMessage('Terjadi kesalahan jaringan. Coba lagi.', 'error');
    } finally {
      button.disabled = false;
      button.textContent = labelAwal;
    }
  });
})();