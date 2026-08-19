// ============================================
// RESET PASSWORD PAGE LOGIC
// Alur: User klik link reset dari email -> mendarat di halaman ini
//       dengan sesi sementara dari Supabase -> isi password baru ->
//       updateUser() -> redirect ke login
// ============================================

document.addEventListener("DOMContentLoaded", () => {

    const form = document.querySelector(".login-box form");
    const submitButton = form.querySelector(".btn-primary");

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
        submitButton.textContent = isLoading ? "Memproses..." : "Update Password";
    }

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        clearMessage();

        const newPassword = form.new_password.value;
        const confirmNewPassword = form.confirm_new_password.value;

        // ---- VALIDASI FORM ----
        if (!newPassword || !confirmNewPassword) {
            showMessage("Semua field wajib diisi.", "error");
            return;
        }

        if (newPassword.length < 6) {
            showMessage("Password minimal 6 karakter.", "error");
            return;
        }

        if (newPassword !== confirmNewPassword) {
            showMessage("Password dan Konfirmasi Password tidak sama.", "error");
            return;
        }

        // ---- UPDATE PASSWORD DI SUPABASE ----
        setLoading(true);

        const { error } = await supabaseClient.auth.updateUser({
            password: newPassword
        });

        setLoading(false);

        if (error) {
            showMessage(error.message, "error");
            return;
        }

        // ---- HASIL / PEMBERITAHUAN ----
        showMessage("Password berhasil diubah! Mengalihkan ke login...", "success");
        setTimeout(() => {
            window.location.href = "login.html";
        }, 1500);
    });

});