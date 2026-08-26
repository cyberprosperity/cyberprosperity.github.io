// ============================================
// PROFILE PAGE LOGIC (versi lengkap)
// ============================================

document.addEventListener("DOMContentLoaded", async () => {

    // ---- CEK LOGIN ----
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) {
        window.location.href = "login.html";
        return;
    }
    const user = session.user;

    // ---- AMBIL DATA PROFILE ----
    const { data: profile } = await supabaseClient
        .from("profiles")
        .select("full_name, username, avatar_url")
        .eq("id", user.id)
        .maybeSingle();

    const fullName = profile?.full_name || "Pengguna Baru";
    const username = profile?.username || "user";
    const avatarUrl = profile?.avatar_url || "assets/images/avatar/default-avatar.png";

    const nameEl = document.querySelector(".profile-name h1");
    const usernameEl = document.querySelector(".profile-username");
    const avatarEls = document.querySelectorAll(".profile-avatar, .feed-avatar");

    if (nameEl) nameEl.textContent = fullName;
    if (usernameEl) usernameEl.textContent = "@" + username;
    avatarEls.forEach((img) => { img.src = avatarUrl; });

    // ---- UPLOAD AVATAR (klik foto) ----
    const avatarInput = document.querySelector("#avatarInput");
    const avatarImg = document.querySelector(".profile-avatar");

    if (avatarInput) {
        avatarInput.addEventListener("change", async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            if (!file.type.startsWith("image/")) { alert("File harus gambar."); return; }
            if (file.size > 2 * 1024 * 1024) { alert("Maksimal 2MB."); return; }

            const fileExt = file.name.split(".").pop();
            const filePath = `${user.id}/avatar.${fileExt}`;

            const { error: uploadError } = await supabaseClient.storage
                .from("avatars").upload(filePath, file, { upsert: true });
            if (uploadError) { alert("Gagal upload: " + uploadError.message); return; }

            const { data: publicUrlData } = supabaseClient.storage.from("avatars").getPublicUrl(filePath);
            const cacheBustedUrl = publicUrlData.publicUrl + "?t=" + Date.now();

            await supabaseClient.from("profiles").update({ avatar_url: publicUrlData.publicUrl }).eq("id", user.id);

            avatarEls.forEach((img) => { img.src = cacheBustedUrl; });
            alert("Foto profil berhasil diperbarui!");
        });
    }

    if (avatarImg && avatarInput) {
        avatarImg.style.cursor = "pointer";
        avatarImg.addEventListener("click", () => avatarInput.click());
    }

    // ---- TOMBOL SETTINGS (di sebelah Edit Profile) -> arahkan ke settings.html ----
    const settingsBtn = document.querySelector(".btn-setting-profile");
    if (settingsBtn) {
        settingsBtn.addEventListener("click", () => {
            window.location.href = "settings.html";
        });
    }

    // ---- MODAL EDIT PROFILE ----
    const editBtn = document.querySelector(".btn-edit-profile");
    const editModal = document.querySelector("#editProfileModal");
    const editNameInput = document.querySelector("#editFullName");
    const editUsernameInput = document.querySelector("#editUsername");
    const editSaveBtn = document.querySelector("#editProfileSaveBtn");
    const editCancelBtn = document.querySelector("#editProfileCancelBtn");

    if (editBtn && editModal) {
        editBtn.addEventListener("click", () => {
            editNameInput.value = fullName;
            editUsernameInput.value = username;
            editModal.style.display = "flex";
        });
    }

    if (editCancelBtn && editModal) {
        editCancelBtn.addEventListener("click", () => {
            editModal.style.display = "none";
        });
    }

    if (editSaveBtn) {
        editSaveBtn.addEventListener("click", async () => {
            const newName = editNameInput.value.trim();
            const newUsername = editUsernameInput.value.trim();

            if (!newName || !newUsername) {
                alert("Nama dan username tidak boleh kosong.");
                return;
            }

            const { error } = await supabaseClient
                .from("profiles")
                .update({ full_name: newName, username: newUsername })
                .eq("id", user.id);

            if (error) {
                alert("Gagal menyimpan: " + error.message);
                return;
            }

            if (nameEl) nameEl.textContent = newName;
            if (usernameEl) usernameEl.textContent = "@" + newUsername;
            editModal.style.display = "none";
            alert("Profil berhasil diperbarui!");
        });
    }

    // ---- STATISTIK: hitung jumlah Posts asli ----
    const { count: postCount } = await supabaseClient
        .from("post")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("type", "thread");

    const statEls = document.querySelectorAll(".profile-stats .stat strong");
    // urutan di HTML: Followers, Following, Posts
    if (statEls[0]) statEls[0].textContent = "0"; // Followers (belum ada sistem follow)
    if (statEls[1]) statEls[1].textContent = "0"; // Following (belum ada sistem follow)
    if (statEls[2]) statEls[2].textContent = postCount ?? 0; // Posts (asli)

    // ---- STATUS: tampilkan & buat status asli ----
    const statusBox = document.querySelector(".status-box");
    const shareBtn = document.querySelector(".btn-status");
    const feedSection = document.querySelector(".profile-feed");

    function timeAgo(dateString) {
        const diffMs = Date.now() - new Date(dateString).getTime();
        const mins = Math.floor(diffMs / 60000);
        if (mins < 1) return "Baru saja";
        if (mins < 60) return `${mins} menit lalu`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours} jam lalu`;
        const days = Math.floor(hours / 24);
        return `${days} hari lalu`;
    }

    function renderStatusCard(statusPost) {
        const card = document.createElement("div");
        card.className = "profile-card";
        card.innerHTML = `
            <div class="feed-header">
                <img src="${avatarUrl}" class="feed-avatar" alt="${fullName}">
                <div>
                    <strong>${fullName}</strong>
                    <small>${timeAgo(statusPost.created_at)}</small>
                </div>
            </div>
            <p class="feed-text"></p>
            <div class="feed-footer">
                <span><i class="fa-regular fa-heart"></i> 0</span>
                <span><i class="fa-regular fa-comment"></i> 0</span>
            </div>
        `;
        card.querySelector(".feed-text").textContent = statusPost.content;
        return card;
    }

    async function loadStatuses() {
        if (!feedSection) return;

        const { data: statuses, error } = await supabaseClient
            .from("post")
            .select("id, content, created_at")
            .eq("user_id", user.id)
            .eq("type", "status")
            .order("created_at", { ascending: false })
            .limit(10);

        if (error) {
            console.error("Gagal ambil status:", error.message);
            return;
        }

        // Hapus semua kartu status lama (termasuk dummy "Michael Tan")
        feedSection.querySelectorAll(".profile-card").forEach((el) => el.remove());

        if (!statuses || statuses.length === 0) {
            const empty = document.createElement("p");
            empty.style.cssText = "color:#888; text-align:center; padding:24px;";
            empty.textContent = "Belum ada status. Tulis status pertamamu di atas!";
            feedSection.appendChild(empty);
            return;
        }

        statuses.forEach((s) => {
            feedSection.appendChild(renderStatusCard(s));
        });
    }

    if (shareBtn && statusBox) {
        shareBtn.addEventListener("click", async () => {
            const content = statusBox.value.trim();
            if (!content) {
                alert("Tulis sesuatu dulu.");
                return;
            }

            const { error } = await supabaseClient
                .from("post")
                .insert({
                    user_id: user.id,
                    content: content,
                    type: "status"
                });

            if (error) {
                alert("Gagal membagikan status: " + error.message);
                return;
            }

            statusBox.value = "";
            loadStatuses();
        });
    }

    loadStatuses();

});