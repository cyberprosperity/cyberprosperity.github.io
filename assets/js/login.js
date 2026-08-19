// ============================================
// LOGIN PAGE LOGIC
// Alur: Validasi form -> Sign in ke Supabase Auth ->
//       Notifikasi sukses/gagal -> Redirect
// ============================================

document.addEventListener("DOMContentLoaded", () => {

    const form = document.querySelector(".login-box form");
    const submitButton = form.querySelector(".btn-primary");

    // Buat elemen pesan (error/sukses) secara dinamis,
    // ditaruh tepat di atas tombol Login
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
        submitButton.textContent = isLoading ? "Memproses..." : "Login";
    }

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        clearMessage();

        const email = form.querySelector('input[type="email"]').value.trim();
        const password = form.querySelector('input[type="password"]').value;

        // ---- VALIDASI FORM ----
        if (!email || !password) {
            showMessage("Email dan Password wajib diisi.", "error");
            return;
        }

        // ---- KIRIM KE SUPABASE AUTH ----
        setLoading(true);

        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });

        setLoading(false);

        if (error) {
            // Pesan error umum dari Supabase, kita perjelas ke Bahasa Indonesia
            if (error.message.includes("Invalid login credentials")) {
                showMessage("Email atau password salah.", "error");
            } else if (error.message.includes("Email not confirmed")) {
                showMessage("Email belum diverifikasi. Silakan cek inbox email kamu.", "error");
            } else {
                showMessage(error.message, "error");
            }
            return;
        }

        // ---- HASIL / PEMBERITAHUAN ----
        showMessage("Login berhasil! Mengalihkan...", "success");
        setTimeout(() => {
            window.location.href = "index.html";
        }, 1000);
    });

});