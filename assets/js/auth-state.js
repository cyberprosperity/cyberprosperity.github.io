// ============================================
// AUTH STATE CHECKER
// Dipasang di SEMUA halaman yang punya navbar
// (index, forum, profile, dll)
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

        // Ambil nama terbaru + role dari tabel "profiles" - ini sumber yang sama
        // dipakai Settings & Forum, supaya nama selalu sinkron di semua halaman.
        const { data: profileData } = await supabaseClient
            .from("profiles")
            .select("full_name, username, role")
            .eq("id", user.id)
            .maybeSingle();

        const isAdmin = profileData?.role === "admin";

        const displayName =
            profileData?.full_name ||
            profileData?.username ||
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
        const sidebarBottom = document.querySelector(".sidebar-bottom");

        if (sidebarBottom) {
            // Cari link "Profile" di sidebar-bottom, ganti teksnya jadi nama user
            const sidebarLinks = sidebarBottom.querySelectorAll("a");
            let logoutLink = null;

            sidebarLinks.forEach((link) => {
                const span = link.querySelector("span");
                if (!span) return;

                const label = span.textContent.trim();

                if (label === "Profile") {
                    span.textContent = shortDisplayName;
                    span.title = displayName;
                }

                if (label === "Logout") {
                    logoutLink = link;
                    link.addEventListener("click", async (e) => {
                        e.preventDefault();
                        await supabaseClient.auth.signOut();
                        window.location.href = "index.html";
                    });
                }
            });

            // Kalau akun ini admin, sisipkan link "Kelola Artikel" tepat
            // sebelum tombol Logout. User biasa tidak akan lihat link ini
            // sama sekali (bukan cuma disembunyikan CSS, memang tidak
            // pernah ditambahkan ke halaman untuk role selain admin).
            if (isAdmin && logoutLink && !sidebarBottom.querySelector('[data-admin-link]')) {
                logoutLink.insertAdjacentHTML("beforebegin", `
                    <a href="admin/artikel.html" data-admin-link>
                        <i class="fa-solid fa-newspaper"></i>
                        <span>Kelola Artikel</span>
                    </a>
                `);
            }
        }

    } else {
        // ---- USER BELUM LOGIN ----

        const sidebarBottom = document.querySelector(".sidebar-bottom");
        if (sidebarBottom) {
            sidebarBottom.innerHTML = `
                <a href="register.html">
                    <i class="fa-solid fa-user-plus"></i>
                    <span>Sign Up</span>
                </a>
                <a href="login.html">
                    <i class="fa-solid fa-right-to-bracket"></i>
                    <span>Log In</span>
                </a>
            `;
        }

    }

});