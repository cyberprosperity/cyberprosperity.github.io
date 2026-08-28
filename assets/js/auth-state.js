// ============================================
// AUTH STATE CHECKER
// Dipasang di SEMUA halaman yang punya navbar
// (index, forum, profile, dll)
// Alur: Cek sesi login -> Kalau login, ganti
//       tombol Sign In/Join jadi nama user + Logout
// ============================================

document.addEventListener("DOMContentLoaded", async () => {

    // Cek apakah ada sesi login aktif
    const { data: { session } } = await supabaseClient.auth.getSession();

    // Cari tombol Sign In dan Join di navbar
    const signInButton = document.querySelector('.cp-signin');
    const joinButton = document.querySelector('.cp-join');

    if (session) {
        // ---- USER SUDAH LOGIN ----
        const user = session.user;
        const displayName =
            user.user_metadata?.full_name ||
            user.user_metadata?.username ||
            user.email;

        // Potong nama yang terlalu panjang supaya lebar navbar tidak
        // berubah drastis / tidak memicu header membungkus ke baris baru
        const shortDisplayName =
            displayName.length > 14
                ? displayName.slice(0, 14) + "…"
                : displayName;

        // --- Struktur 1: Navbar publik (index.html) pakai .cp-signin / .cp-join ---
        if (signInButton) {
            signInButton.textContent = shortDisplayName;
            signInButton.title = displayName; // nama lengkap muncul saat di-hover (tooltip)
            signInButton.href = "profile.html";
        }

        if (joinButton) {
            joinButton.textContent = "Logout";
            joinButton.href = "#";
            joinButton.addEventListener("click", async (e) => {
                e.preventDefault();
                await supabaseClient.auth.signOut();
                window.location.href = "index.html";
            });
        }

        // --- Struktur 2: Sidebar halaman internal (profile, features, forum, dll) ---
        // Cari link "Profile" di sidebar-bottom, ganti teksnya jadi nama user
        const sidebarLinks = document.querySelectorAll(".sidebar-bottom a");
        sidebarLinks.forEach((link) => {
            const span = link.querySelector("span");
            if (!span) return;

            const label = span.textContent.trim();

            if (label === "Profile") {
                span.textContent = shortDisplayName;
                span.title = displayName;
            }

            if (label === "Logout") {
                link.addEventListener("click", async (e) => {
                    e.preventDefault();
                    await supabaseClient.auth.signOut();
                    window.location.href = "index.html";
                });
            }
        });
    }
    // Kalau tidak ada sesi, biarkan tombol Sign In & Join / Profile seperti semula

});