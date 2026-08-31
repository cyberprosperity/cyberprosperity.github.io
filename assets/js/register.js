// ============================================
// REGISTER PAGE LOGIC
// Alur: Validasi form -> Kirim ke Supabase Auth ->
//       Notifikasi sukses/gagal -> Redirect
// ============================================

document.addEventListener("DOMContentLoaded", () => {

    const form = document.querySelector(".login-box form");
    const submitButton = form.querySelector(".btn-primary");

    // Buat elemen pesan (error/sukses) secara dinamis,
    // ditaruh tepat di atas tombol Create Account
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
        submitButton.textContent = isLoading ? "Memproses..." : "Create Account";
    }

    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    function isValidPhone(phone) {
        // Wajib format +62 diikuti 8-13 digit, sama seperti pattern di HTML
        return /^\+62[0-9]{8,13}$/.test(phone);
    }

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        clearMessage();

        const fullName = form.full_name.value.trim();
        const username = form.username.value.trim();
        const email = form.email.value.trim();
        const phone = form.phone.value.trim();
        const password = form.password.value;
        const confirmPassword = form.confirm_password.value;

        // ---- VALIDASI FORM ----
        if (!fullName || !username || !email || !phone || !password || !confirmPassword) {
            showMessage("Semua field wajib diisi.", "error");
            return;
        }

        if (!isValidEmail(email)) {
            showMessage("Format email tidak valid.", "error");
            return;
        }

        if (!isValidPhone(phone)) {
            showMessage("Nomor telepon harus diawali +62, contoh: +628123456789", "error");
            return;
        }

        if (password.length < 6) {
            showMessage("Password minimal 6 karakter.", "error");
            return;
        }

        if (password !== confirmPassword) {
            showMessage("Password dan Confirm Password tidak sama.", "error");
            return;
        }

        // ---- KIRIM KE SUPABASE AUTH ----
        setLoading(true);

        const { data, error } = await supabaseClient.auth.signUp({
            email: email,
            password: password,
            options: {
                emailRedirectTo: "http://127.0.0.1:5500/login.html",
                data: {
                    full_name: fullName,
                    username: username,
                    phone: phone
                }
            }
        });

        setLoading(false);

        if (error) {
            showMessage(error.message, "error");
            return;
        }

        // ---- SINKRONISASI AWAL KE TABEL PROFILES ----
        // Kalau email confirmation OFF, user langsung dapat session di sini,
        // jadi kita bisa langsung insert ke profiles (termasuk phone).
        // Kalau email confirmation ON, sinkronisasi ini akan dilakukan oleh
        // login.js saat user pertama kali berhasil login (lihat login.js).
        if (data.session && data.user) {
            await supabaseClient.from("profiles").insert({
                id: data.user.id,
                full_name: fullName,
                username: username,
                phone: phone
            });
        }

        // ---- HASIL / PEMBERITAHUAN ----
        // Jika data.session ada -> email confirmation OFF, user langsung login
        // Jika data.session null -> email confirmation ON, user harus cek email dulu
        if (data.session) {
            showMessage("Akun berhasil dibuat! Mengalihkan ke dashboard...", "success");
            setTimeout(() => {
                window.location.href = "index.html";
            }, 1500);
        } else {
            showMessage(
                "Akun berhasil dibuat! Silakan cek email kamu untuk verifikasi sebelum login.",
                "success"
            );
            form.reset();
        }
    });

});
