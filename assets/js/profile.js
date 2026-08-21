// ============================================
// PROFILE.JS
// Cek login, ambil data asli user (full_name,
// username, avatar_url) dari tabel profiles,
// dan tangani upload foto profil ke Storage
// ============================================

document.addEventListener("DOMContentLoaded", async () => {

    // 1. Cek session — kalau belum login, lempar ke login.html
    const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();

    if (sessionError || !session) {
        window.location.href = "login.html";
        return;
    }

    const user = session.user;

    // 2. Ambil data profil dari tabel profiles
    const { data: profile, error: profileError } = await supabaseClient
        .from("profiles")
        .select("full_name, username, avatar_url")
        .eq("id", user.id)
        .single();

    if (profileError) {
        console.error("Gagal ambil data profil:", profileError.message);
        return;
    }

    const nameEl = document.getElementById("profileName");
    const usernameEl = document.getElementById("profileUsername");

    if (nameEl) {
        nameEl.textContent = profile.full_name || "Nama belum diisi";
    }

    if (usernameEl) {
        usernameEl.textContent = "@" + (profile.username || "username");
    }

    if (profile.avatar_url) {
        document.querySelectorAll(".profile-avatar, .feed-avatar").forEach(img => {
            img.src = profile.avatar_url;
        });
    }

    // 3. Fitur upload avatar
    const avatarInput = document.getElementById("avatarUploadInput");

    if (avatarInput) {
        avatarInput.addEventListener("change", async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const fileExt = file.name.split(".").pop();
            const filePath = `${user.id}/avatar.${fileExt}`;

            const { error: uploadError } = await supabaseClient.storage
                .from("avatars")
                .upload(filePath, file, { upsert: true });

            if (uploadError) {
                alert("Gagal upload foto: " + uploadError.message);
                return;
            }

            const { data: publicUrlData } = supabaseClient.storage
                .from("avatars")
                .getPublicUrl(filePath);

            const avatarUrl = publicUrlData.publicUrl + "?t=" + Date.now();

            const { error: updateError } = await supabaseClient
                .from("profiles")
                .update({ avatar_url: avatarUrl })
                .eq("id", user.id);

            if (updateError) {
                alert("Gagal simpan avatar ke profil: " + updateError.message);
                return;
            }

            document.querySelectorAll(".profile-avatar, .feed-avatar").forEach(img => {
                img.src = avatarUrl;
            });
        });
    }

});