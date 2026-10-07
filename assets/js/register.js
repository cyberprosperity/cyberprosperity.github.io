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

    // Catat konversi Google Ads (hanya jika tag Google termuat)
    function trackRegisterConversion() {
        if (typeof gtag_report_conversion === "function") {
            gtag_report_conversion();
        }
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
                emailRedirectTo: `${window.location.origin}/login.html`,
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

        if (data.session && data.user) {
            await supabaseClient.from("profiles").insert({
                id: data.user.id,
                full_name: fullName,
                username: username,
                phone: phone
            });
        }

        // ---- PELACAKAN KONVERSI GOOGLE ADS ----
        // Hanya dicatat untuk pendaftaran yang benar-benar baru.
        // Jika email sudah terdaftar, Supabase (dengan email confirmation ON)
        // tetap membalas "sukses" tetapi daftar identities-nya kosong.
        const isExistingEmail =
            data.user &&
            Array.isArray(data.user.identities) &&
            data.user.identities.length === 0;

        if (!isExistingEmail) {
            trackRegisterConversion();
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