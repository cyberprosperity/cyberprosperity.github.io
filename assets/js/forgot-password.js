// ============================================
// FORGOT PASSWORD PAGE LOGIC
// Alur: Validasi email -> Kirim link reset via Supabase ->
//       Notifikasi ke user
// ============================================

document.addEventListener("DOMContentLoaded", () => {

    const form = document.querySelector(".login-box form");
    const submitButton = form.querySelector(".btn-primary");

    // Buat elemen pesan (error/sukses) secara dinamis,
    // ditaruh tepat di atas tombol Send Reset Link
    const messageBox = document.createElement("p");
    messageBox.className = "form-message";
    messageBox.style.display = "none";
    submitButton.parentNode.insertBefore(messageBox, submitButton);

    function showMessage(text, type) {
        messageBox.textContent = text;
        messageBox.style.display = "block";
        messageBox.style.color = type === "error" ? "#ff6b6b" : "#4caf50";
        messageBox.style.marginBottom = "10px";
        messageBox.style.fontSize = "14px";
    }

    function clearMessage() {
        messageBox.style.display = "none";
        messageBox.textContent = "";
    }

    function setLoading(isLoading) {
        submitButton.disabled = isLoading;
        submitButton.textContent = isLoading ? "Mengirim..." : "Send Reset Link";
    }

    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        clearMessage();

        const email = form.querySelector('input[type="email"]').value.trim();

        // ---- VALIDASI FORM ----
        if (!email) {
            showMessage("Email wajib diisi.", "error");
            return;
        }

        if (!isValidEmail(email)) {
            showMessage("Format email tidak valid.", "error");
            return;
        }

        // ---- KIRIM PERMINTAAN RESET KE SUPABASE ----
        setLoading(true);

        const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
            redirectTo: "http://127.0.0.1:5500/reset-password.html"
        });

        setLoading(false);

        if (error) {
            showMessage(error.message, "error");
            return;
        }

        // ---- HASIL / PEMBERITAHUAN ----
        showMessage(
            "Link reset password sudah dikirim! Silakan cek email kamu.",
            "success"
        );
        form.reset();
    });

});