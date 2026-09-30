/* =====================================================
   CYBER PROSPERITY
   CONTACT FORM VALIDATION + TILT 3D CARD CUSTOMER SERVICE
===================================================== */

document.addEventListener("DOMContentLoaded", () => {

    /* ---------- Validasi form ---------- */

    const form = document.getElementById("contact-form");

    if (form) {

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
    }

    /* ---------- Tilt 3D card customer service ---------- */

    const art = document.querySelector(".cs-art");
    const scene = art && art.querySelector(".cs-scene");

    if (!scene || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let tx = 0, ty = 0, cx = 0, cy = 0, raf = null;

    function loop() {
        cx += (tx - cx) * 0.12;
        cy += (ty - cy) * 0.12;
        scene.style.setProperty("--ry", cx.toFixed(2) + "deg");
        scene.style.setProperty("--rx", cy.toFixed(2) + "deg");
        raf = (Math.abs(tx - cx) > 0.02 || Math.abs(ty - cy) > 0.02)
            ? requestAnimationFrame(loop)
            : null;
    }

    function kick() {
        if (!raf) raf = requestAnimationFrame(loop);
    }

    art.addEventListener("pointermove", (e) => {
        const r = art.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width * 2 - 1;
        const py = (e.clientY - r.top) / r.height * 2 - 1;
        tx = px * 14;
        ty = -py * 9;
        kick();
    });

    art.addEventListener("pointerleave", () => {
        tx = 0;
        ty = 0;
        kick();
    });

});