/* =====================================================
   CYBER PROSPERITY
   CONTACT FORM VALIDATION
===================================================== */

document.addEventListener("DOMContentLoaded", () => {

    const form = document.getElementById("contact-form");

    if (!form) return;

    const nameInput = document.getElementById("contact-name");
    const emailInput = document.getElementById("contact-email");
    const phoneInput = document.getElementById("contact-phone");
    const messageInput = document.getElementById("contact-message");

    form.addEventListener("submit", (event) => {

        event.preventDefault();

        const fullName = nameInput.value.trim();
        const email = emailInput.value.trim();
        const phone = phoneInput.value.trim();
        const message = messageInput.value.trim();

        if (!fullName) {
            alert("Nama wajib diisi.");
            nameInput.focus();
            return;
        }

        if (!email) {
            alert("Email wajib diisi.");
            emailInput.focus();
            return;
        }

        if (!emailInput.checkValidity()) {
            alert("Masukkan alamat email yang valid.");
            emailInput.focus();
            return;
        }

        if (!phone) {
            alert("Nomor telepon wajib diisi.");
            phoneInput.focus();
            return;
        }

        const normalizedPhone = phone.replace(/[\s()-]/g, "");
        const phonePattern = /^\+?[0-9]{8,15}$/;

        if (!phonePattern.test(normalizedPhone)) {
            alert("Masukkan nomor telepon yang valid.");
            phoneInput.focus();
            return;
        }

        if (!message) {
            alert("Pesan wajib diisi.");
            messageInput.focus();
            return;
        }

        alert("Data sudah lengkap dan siap dikirim.");

    });

});