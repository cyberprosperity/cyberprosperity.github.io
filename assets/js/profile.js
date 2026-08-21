// ============================================
// PROFILE PAGE LOGIC
// Alur: Cek login -> Ambil data dari tabel profiles ->
//       Tampilkan nama & username asli -> Fitur upload avatar
// ============================================

document.addEventListener("DOMContentLoaded", async () => {

    // ---- CEK LOGIN ----
    const { data: { session } } = await supabaseClient.auth.getSession();

    if (!session) {
        // Kalau belum login, tendang ke halaman login
        window.location.href = "login.html";
        return;
    }

    const user = session.user;

    // ---- AMBIL DATA PROFILE DARI DATABASE ----
    const { data: profile, error } = await supabaseClient
        .from("profiles")
        .select("full_name, username, avatar_url")
        .eq("id", user.id)
        .maybeSingle();

    if (error) {
        console.error("Gagal ambil data profile:", error.message);
    }

    const fullName = profile?.full_name || "Pengguna Baru";
    const username = profile?.username || "user";
    const avatarUrl = profile?.avatar_url || "assets/images/avatar/default-avatar.png";

    // ---- TAMPILKAN DATA ASLI KE HALAMAN ----
    const nameEl = document.querySelector(".profile-name h1");
    const usernameEl = document.querySelector(".profile-username");
    const avatarEls = document.querySelectorAll(".profile-avatar, .feed-avatar");

    if (nameEl) nameEl.textContent = fullName;
    if (usernameEl) usernameEl.textContent = "@" + username;

    avatarEls.forEach((img) => {
        img.src = avatarUrl;
    });

    // ---- FITUR UPLOAD AVATAR ----
    const avatarInput = document.querySelector("#avatarInput");
    const avatarImg = document.querySelector(".profile-avatar");

    if (avatarInput) {
        avatarInput.addEventListener("change", async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            // Validasi sederhana
            if (!file.type.startsWith("image/")) {
                alert("File harus berupa gambar.");
                return;
            }
            if (file.size > 2 * 1024 * 1024) {
                alert("Ukuran gambar maksimal 2MB.");
                return;
            }

            const fileExt = file.name.split(".").pop();
            const filePath = `${user.id}/avatar.${fileExt}`;

            // Upload ke Supabase Storage bucket 'avatars'
            const { error: uploadError } = await supabaseClient
                .storage
                .from("avatars")
                .upload(filePath, file, { upsert: true });

            if (uploadError) {
                alert("Gagal upload foto: " + uploadError.message);
                return;
            }

            // Ambil URL publik dari file yang baru diupload
            const { data: publicUrlData } = supabaseClient
                .storage
                .from("avatars")
                .getPublicUrl(filePath);

            const newAvatarUrl = publicUrlData.publicUrl;
            const cacheBustedUrl = newAvatarUrl + "?t=" + Date.now();

            // Simpan URL avatar baru ke tabel profiles
            const { error: updateError } = await supabaseClient
                .from("profiles")
                .update({ avatar_url: newAvatarUrl })
                .eq("id", user.id);

            if (updateError) {
                alert("Gagal simpan foto ke profile: " + updateError.message);
                return;
            }

            // Update tampilan avatar langsung tanpa reload
            avatarEls.forEach((img) => {
                img.src = cacheBustedUrl;
            });

            alert("Foto profil berhasil diperbarui!");
        });
    }

    // Klik foto avatar untuk buka file picker
    if (avatarImg && avatarInput) {
        avatarImg.style.cursor = "pointer";
        avatarImg.addEventListener("click", () => {
            avatarInput.click();
        });
    }

});