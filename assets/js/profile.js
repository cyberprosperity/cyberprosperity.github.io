// ============================================
// PROFILE PAGE LOGIC (final + Follow + Lihat Profil Orang Lain)
// ============================================

document.addEventListener("DOMContentLoaded", async () => {

    const { data: { session } } = await supabaseClient.auth.getSession();
    const currentUser = session ? session.user : null;

    const urlParams = new URLSearchParams(window.location.search);
    const viewedUserId = urlParams.get("id") || (currentUser ? currentUser.id : null);

    // ---- TAMPILAN GUEST tanpa target profil (buka profile.html sendiri, belum login) ----
    if (!viewedUserId) {
        const mainEl = document.querySelector(".main-content") || document.body;
        mainEl.innerHTML = `
            <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:70vh; text-align:center; padding:24px;">
                <i class="fa-regular fa-circle-user" style="font-size:64px; color:#555; margin-bottom:16px;"></i>
                <h2 style="color:#fff; margin-bottom:8px;">Kamu belum login</h2>
                <p style="color:#999; margin-bottom:24px; max-width:360px;">
                    Masuk ke akun kamu untuk melihat dan mengelola profil Cyber Prosperity.
                </p>
                <div style="display:flex; gap:12px;">
                    <a href="login.html" style="padding:12px 24px; border-radius:8px; background:#FFD700; color:#000; font-weight:bold; text-decoration:none;">Login</a>
                    <a href="register.html" style="padding:12px 24px; border-radius:8px; background:#333; color:#fff; text-decoration:none;">Daftar</a>
                </div>
            </div>
        `;
        return;
    }

    const isOwnProfile = !!currentUser && viewedUserId === currentUser.id;

    const { data: profile, error: profileError } = await supabaseClient
        .from("profiles")
        .select("full_name, username, avatar_url, cover_url, bio")
        .eq("id", viewedUserId)
        .maybeSingle();

    if (profileError || !profile) {
        const mainEl = document.querySelector(".main-content") || document.body;
        mainEl.innerHTML = `
            <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:70vh; text-align:center; padding:24px;">
                <h2 style="color:#fff; margin-bottom:8px;">Profil tidak ditemukan</h2>
                <p style="color:#999;">User yang kamu cari mungkin sudah tidak ada.</p>
            </div>
        `;
        return;
    }

    let fullName = profile?.full_name || "Pengguna Baru";
    let username = profile?.username || "user";
    let avatarUrl = profile?.avatar_url || "assets/images/avatar/default-avatar.png";
    let coverUrl = profile?.cover_url || "";
    let bio = profile?.bio || "";

    const nameEl = document.querySelector(".profile-name h1");
    const usernameEl = document.querySelector(".profile-username");
    const bioEl = document.querySelector(".profile-bio");
    const avatarEls = document.querySelectorAll(".profile-avatar, .feed-avatar");
    const coverEl = document.querySelector(".profile-cover");

    if (nameEl) nameEl.textContent = fullName;
    if (usernameEl) usernameEl.textContent = "@" + username;
    if (bioEl) bioEl.textContent = bio;
    avatarEls.forEach((img) => { img.src = avatarUrl; });

    if (coverEl) {
        if (coverUrl) {
            coverEl.style.backgroundImage = `url('${coverUrl}')`;
            coverEl.style.backgroundSize = "cover";
            coverEl.style.backgroundPosition = "center";
        } else {
            coverEl.style.backgroundImage = "none";
        }
    }

    // ==========================================
    // TOMBOL AKSI: Edit Profile/Settings (profil sendiri) vs Follow (profil orang lain)
    // ==========================================
    const editBtn = document.querySelector(".btn-edit-profile");
    const settingsBtn = document.querySelector(".btn-setting-profile");
    const followBtn = document.querySelector(".btn-follow-profile");
    const statusComposerSection = document.querySelector(".profile-status");

    let isFollowing = false;
    let followerCount = 0;
    let followingCount = 0;

    async function loadFollowCounts() {
        const [followerCountRes, followingCountRes, myFollowRes] = await Promise.all([
            supabaseClient.from("follows").select("id", { count: "exact", head: true }).eq("following_id", viewedUserId),
            supabaseClient.from("follows").select("id", { count: "exact", head: true }).eq("follower_id", viewedUserId),
            currentUser
                ? supabaseClient.from("follows").select("id").eq("follower_id", currentUser.id).eq("following_id", viewedUserId).maybeSingle()
                : Promise.resolve({ data: null })
        ]);

        followerCount = followerCountRes.count ?? 0;
        followingCount = followingCountRes.count ?? 0;
        isFollowing = !!myFollowRes.data;

        const statEls = document.querySelectorAll(".profile-stats .stat strong");
        if (statEls[0]) statEls[0].textContent = followerCount;
        if (statEls[1]) statEls[1].textContent = followingCount;
    }

    function updateFollowBtnUI() {
        if (!followBtn) return;
        followBtn.innerHTML = isFollowing
            ? '<i class="fa-solid fa-user-check"></i><span class="btn-label">Following</span>'
            : '<i class="fa-solid fa-user-plus"></i><span class="btn-label">Follow</span>';
    }

    await loadFollowCounts();

    if (isOwnProfile) {
        if (followBtn) followBtn.style.display = "none";
    } else {
        if (editBtn) editBtn.style.display = "none";
        if (settingsBtn) settingsBtn.style.display = "none";
        if (statusComposerSection) statusComposerSection.style.display = "none";

        if (followBtn) {
            followBtn.style.display = "inline-flex";
            updateFollowBtnUI();

            followBtn.addEventListener("click", async () => {
                if (!currentUser) {
                    const ok = confirm("Anda harus login untuk follow user ini.\n\nLogin sekarang?");
                    if (ok) window.location.href = "login.html";
                    return;
                }

                followBtn.disabled = true;

                if (isFollowing) {
                    const { error } = await supabaseClient
                        .from("follows")
                        .delete()
                        .eq("follower_id", currentUser.id)
                        .eq("following_id", viewedUserId);
                    if (error) { alert("Gagal unfollow: " + error.message); followBtn.disabled = false; return; }
                    isFollowing = false;
                    followerCount = Math.max(0, followerCount - 1);
                } else {
                    const { error } = await supabaseClient
                        .from("follows")
                        .insert({ follower_id: currentUser.id, following_id: viewedUserId });
                    if (error) { alert("Gagal follow: " + error.message); followBtn.disabled = false; return; }
                    isFollowing = true;
                    followerCount += 1;
                }

                const statEls = document.querySelectorAll(".profile-stats .stat strong");
                if (statEls[0]) statEls[0].textContent = followerCount;

                updateFollowBtnUI();
                followBtn.disabled = false;
            });
        }
    }

    // ---- UPLOAD AVATAR (hanya profil sendiri) ----
    const avatarInput = document.querySelector("#avatarInput");
    const avatarImg = document.querySelector(".profile-avatar");

    if (isOwnProfile && avatarInput) {
        avatarInput.addEventListener("change", async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            if (!file.type.startsWith("image/")) { alert("File harus gambar."); return; }
            if (file.size > 2 * 1024 * 1024) { alert("Maksimal 2MB."); return; }

            const fileExt = file.name.split(".").pop();
            const filePath = `${currentUser.id}/avatar.${fileExt}`;

            const { error: uploadError } = await supabaseClient.storage
                .from("avatars").upload(filePath, file, { upsert: true });
            if (uploadError) { alert("Gagal upload: " + uploadError.message); return; }

            const { data: publicUrlData } = supabaseClient.storage.from("avatars").getPublicUrl(filePath);
            avatarUrl = publicUrlData.publicUrl;
            const cacheBustedUrl = avatarUrl + "?t=" + Date.now();

            await supabaseClient.from("profiles").update({ avatar_url: avatarUrl }).eq("id", currentUser.id);
            document.querySelectorAll(".profile-avatar, .feed-avatar").forEach((img) => { img.src = cacheBustedUrl; });
            alert("Foto profil berhasil diperbarui!");
        });
    }

    if (isOwnProfile && avatarImg && avatarInput) {
        avatarImg.style.cursor = "pointer";
        avatarImg.addEventListener("click", () => avatarInput.click());
    }

    // ---- TOMBOL SETTINGS ----
    if (isOwnProfile && settingsBtn) {
        settingsBtn.addEventListener("click", () => { window.location.href = "settings.html"; });
    }

    // ---- MODAL EDIT PROFILE (hanya profil sendiri) ----
    const editModal = document.querySelector("#editProfileModal");
    const editNameInput = document.querySelector("#editFullName");
    const editUsernameInput = document.querySelector("#editUsername");
    const editBioInput = document.querySelector("#editBio");
    const editSaveBtn = document.querySelector("#editProfileSaveBtn");
    const editCancelBtn = document.querySelector("#editProfileCancelBtn");

    if (isOwnProfile && editBtn && editModal) {
        editBtn.addEventListener("click", () => {
            editNameInput.value = fullName;
            editUsernameInput.value = username;
            if (editBioInput) editBioInput.value = bio;
            editModal.style.display = "flex";
        });
    }
    if (editCancelBtn && editModal) {
        editCancelBtn.addEventListener("click", () => { editModal.style.display = "none"; });
    }
    if (isOwnProfile && editSaveBtn) {
        editSaveBtn.addEventListener("click", async () => {
            const newName = editNameInput.value.trim();
            const newUsername = editUsernameInput.value.trim();
            const newBio = editBioInput ? editBioInput.value.trim() : bio;
            if (!newName || !newUsername) { alert("Nama dan username tidak boleh kosong."); return; }

            const { error } = await supabaseClient
                .from("profiles")
                .update({ full_name: newName, username: newUsername, bio: newBio })
                .eq("id", currentUser.id);
            if (error) { alert("Gagal menyimpan: " + error.message); return; }

            fullName = newName; username = newUsername; bio = newBio;
            if (nameEl) nameEl.textContent = newName;
            if (usernameEl) usernameEl.textContent = "@" + newUsername;
            if (bioEl) bioEl.textContent = newBio;
            editModal.style.display = "none";
            alert("Profil berhasil diperbarui!");
        });
    }

    // ---- STATISTIK POSTS (thread yang dibuat oleh user yang sedang dilihat) ----
    const { count: postCount } = await supabaseClient
        .from("post").select("id", { count: "exact", head: true })
        .eq("user_id", viewedUserId).eq("type", "thread");

    const statEls = document.querySelectorAll(".profile-stats .stat strong");
    if (statEls[2]) statEls[2].textContent = postCount ?? 0;

    // ============================================
    // MOOD & FOTO (composer status) — hanya aktif kalau profil sendiri
    // (statusComposerSection sudah disembunyikan di atas kalau bukan profil sendiri)
    // ============================================
    const statusBox = document.querySelector(".status-box");
    const toolButtons = document.querySelectorAll(".status-tools button");
    const moodBtn = toolButtons[0];
    const fotoBtn = toolButtons[1];

    let selectedMood = "";
    let pendingImageUrl = null;

    let statusImageInput = null;
    let imagePreviewWrap = null;
    let moodPicker = null;

    if (isOwnProfile) {
        // Hidden file input untuk Foto
        statusImageInput = document.createElement("input");
        statusImageInput.type = "file";
        statusImageInput.accept = "image/*";
        statusImageInput.hidden = true;
        document.body.appendChild(statusImageInput);

        // Preview gambar terpilih
        imagePreviewWrap = document.createElement("div");
        imagePreviewWrap.style.cssText = "display:none; margin-top:10px; position:relative; width:fit-content;";
        imagePreviewWrap.innerHTML = `
            <img style="max-width:200px; border-radius:8px;">
            <span style="position:absolute; top:-8px; right:-8px; background:#e11d48; color:#fff; width:22px; height:22px; border-radius:50%; display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:12px;">✕</span>
        `;
        if (statusBox) statusBox.insertAdjacentElement("afterend", imagePreviewWrap);

        // Mood picker
        moodPicker = document.createElement("div");
        moodPicker.style.cssText = "display:none; gap:8px; margin-top:8px;";
        ["😀", "😢", "😡", "😍", "🚀", "🔥", "🙏"].forEach((emoji) => {
            const btn = document.createElement("span");
            btn.textContent = emoji;
            btn.style.cssText = "cursor:pointer; font-size:20px;";
            btn.addEventListener("click", () => {
                selectedMood = emoji;
                if (statusBox) statusBox.value = (emoji + " " + statusBox.value).trim();
                moodPicker.style.display = "none";
            });
            moodPicker.appendChild(btn);
        });
        if (statusBox) statusBox.insertAdjacentElement("afterend", moodPicker);

        if (moodBtn) {
            moodBtn.addEventListener("click", () => {
                moodPicker.style.display = moodPicker.style.display === "none" ? "flex" : "none";
            });
        }

        if (fotoBtn) {
            fotoBtn.addEventListener("click", () => statusImageInput.click());
        }

        statusImageInput.addEventListener("change", async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            if (!file.type.startsWith("image/")) { alert("File harus gambar."); return; }
            if (file.size > 3 * 1024 * 1024) { alert("Maksimal 3MB."); return; }

            const fileExt = file.name.split(".").pop();
            const filePath = `${currentUser.id}/post-${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabaseClient.storage
                .from("avatars").upload(filePath, file);
            if (uploadError) { alert("Gagal upload foto: " + uploadError.message); return; }

            const { data: publicUrlData } = supabaseClient.storage.from("avatars").getPublicUrl(filePath);
            pendingImageUrl = publicUrlData.publicUrl;

            imagePreviewWrap.querySelector("img").src = pendingImageUrl;
            imagePreviewWrap.style.display = "block";
        });

        imagePreviewWrap.querySelector("span").addEventListener("click", () => {
            pendingImageUrl = null;
            imagePreviewWrap.style.display = "none";
            statusImageInput.value = "";
        });
    }

    // ============================================
    // STATUS FEED (status milik user yang sedang dilihat)
    // ============================================
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

    async function renderStatusCard(statusPost) {
        const isOwner = !!currentUser && statusPost.user_id === currentUser.id;

        const [likeCountRes, myLikeRes, commentCountRes] = await Promise.all([
            supabaseClient.from("likes").select("id", { count: "exact", head: true }).eq("post_id", statusPost.id),
            currentUser
                ? supabaseClient.from("likes").select("id").eq("post_id", statusPost.id).eq("user_id", currentUser.id).maybeSingle()
                : Promise.resolve({ data: null }),
            supabaseClient.from("comments").select("id", { count: "exact", head: true }).eq("post_id", statusPost.id)
        ]);

        let likeCount = likeCountRes.count ?? 0;
        let isLiked = !!myLikeRes.data;
        const commentCount = commentCountRes.count ?? 0;

        const card = document.createElement("div");
        card.className = "profile-card";

        const header = document.createElement("div");
        header.className = "feed-header";
        header.innerHTML = `
            <img src="${avatarUrl}" class="feed-avatar" alt="${fullName}">
            <div><strong></strong><small>${timeAgo(statusPost.created_at)}</small></div>
        `;
        header.querySelector("strong").textContent = fullName;

        if (isOwner) {
            const ownerActions = document.createElement("div");
            ownerActions.style.cssText = "margin-left:auto; display:flex; gap:12px; align-items:center;";
            ownerActions.innerHTML = `
                <i class="fa-regular fa-pen-to-square edit-status-btn" style="cursor:pointer; color:#aaa;"></i>
                <i class="fa-solid fa-trash delete-status-btn" style="cursor:pointer; color:#aaa;"></i>
            `;
            header.appendChild(ownerActions);
        }

        const textEl = document.createElement("p");
        textEl.className = "feed-text";
        textEl.textContent = statusPost.content;

        let imageEl = null;
        if (statusPost.image_url) {
            imageEl = document.createElement("img");
            imageEl.src = statusPost.image_url;
            imageEl.className = "feed-post-image";
            imageEl.addEventListener("click", () => {
                window.open(statusPost.image_url, "_blank");
            });
        }

        const footer = document.createElement("div");
        footer.className = "feed-footer";
        footer.style.cssText = "display:flex; align-items:center; gap:16px; flex-wrap:wrap;";
        footer.innerHTML = `
            <span class="like-btn" style="cursor:pointer;">
                <i class="fa-${isLiked ? "solid" : "regular"} fa-heart" style="${isLiked ? "color:#e11d48;" : ""}"></i>
                <span class="like-count">${likeCount}</span>
            </span>
            <span class="comment-toggle-btn" style="cursor:pointer;">
                <i class="fa-regular fa-comment"></i>
                <span class="comment-count">${commentCount}</span>
            </span>
            <span class="share-fb-btn" style="cursor:pointer;" title="Share ke Facebook">
                <i class="fa-brands fa-facebook" style="color:#1877f2;"></i>
            </span>
            <span class="share-wa-btn" style="cursor:pointer;" title="Share ke WhatsApp">
                <i class="fa-brands fa-whatsapp" style="color:#25d366;"></i>
            </span>
        `;

        const commentSection = document.createElement("div");
        commentSection.className = "comment-section";
        commentSection.style.cssText = "display:none; margin-top:14px; border-top:1px solid #2a2d3a; padding-top:14px;";
        const commentList = document.createElement("div");
        commentList.className = "comment-list";
        commentSection.appendChild(commentList);

        const commentInputWrap = document.createElement("div");
        commentInputWrap.style.cssText = "display:flex; gap:8px; margin-top:10px;";
        commentInputWrap.innerHTML = `
            <input type="text" class="comment-input" placeholder="${currentUser ? 'Tulis komentar...' : 'Login untuk berkomentar...'}"
                   style="flex:1; padding:8px 12px; border-radius:8px; border:1px solid #333; background:#1a1c26; color:#fff;">
            <button class="comment-submit-btn" style="padding:8px 14px; border-radius:8px; border:none; background:#FFD700; color:#000; font-weight:bold; cursor:pointer;">Kirim</button>
        `;
        commentSection.appendChild(commentInputWrap);

        card.appendChild(header);
        card.appendChild(textEl);
        if (imageEl) card.appendChild(imageEl);
        card.appendChild(footer);
        card.appendChild(commentSection);

        const editBtnEl = header.querySelector(".edit-status-btn");
        if (editBtnEl) {
            editBtnEl.addEventListener("click", () => {
                const textarea = document.createElement("textarea");
                textarea.value = statusPost.content;
                textarea.rows = 3;
                textarea.style.cssText = "width:100%; padding:8px; border-radius:8px; border:1px solid #333; background:#1a1c26; color:#fff;";
                const saveBtn = document.createElement("button");
                saveBtn.textContent = "Simpan";
                saveBtn.style.cssText = "margin-top:8px; padding:8px 14px; border-radius:8px; border:none; background:#FFD700; color:#000; font-weight:bold; cursor:pointer;";

                textEl.replaceWith(textarea);
                textarea.insertAdjacentElement("afterend", saveBtn);

                saveBtn.addEventListener("click", async () => {
                    const newContent = textarea.value.trim();
                    if (!newContent) { alert("Status tidak boleh kosong."); return; }
                    const { error } = await supabaseClient.from("post").update({ content: newContent }).eq("id", statusPost.id);
                    if (error) { alert("Gagal simpan: " + error.message); return; }
                    statusPost.content = newContent;
                    textEl.textContent = newContent;
                    textarea.replaceWith(textEl);
                    saveBtn.remove();
                });
            });
        }

        const deleteBtnEl = header.querySelector(".delete-status-btn");
        if (deleteBtnEl) {
            deleteBtnEl.addEventListener("click", async () => {
                if (!confirm("Hapus status ini?")) return;
                const { error } = await supabaseClient.from("post").delete().eq("id", statusPost.id);
                if (error) { alert("Gagal hapus: " + error.message); return; }
                card.remove();
            });
        }

        const likeBtn = footer.querySelector(".like-btn");
        likeBtn.addEventListener("click", async () => {
            if (!currentUser) {
                const ok = confirm("Anda harus login untuk menyukai status ini.\n\nLogin sekarang?");
                if (ok) window.location.href = "login.html";
                return;
            }
            const icon = likeBtn.querySelector("i");
            const countEl = likeBtn.querySelector(".like-count");
            if (isLiked) {
                const { error } = await supabaseClient.from("likes").delete().eq("post_id", statusPost.id).eq("user_id", currentUser.id);
                if (error) return;
                isLiked = false; likeCount -= 1;
            } else {
                const { error } = await supabaseClient.from("likes").insert({ post_id: statusPost.id, user_id: currentUser.id });
                if (error) return;
                isLiked = true; likeCount += 1;
            }
            icon.className = `fa-${isLiked ? "solid" : "regular"} fa-heart`;
            icon.style.color = isLiked ? "#e11d48" : "";
            countEl.textContent = likeCount;
        });

        const commentToggleBtn = footer.querySelector(".comment-toggle-btn");
        let commentsLoaded = false;

        async function loadComments() {
            const { data: comments, error } = await supabaseClient
                .from("comments")
                .select("id, user_id, content, created_at, profiles(full_name, username)")
                .eq("post_id", statusPost.id)
                .order("created_at", { ascending: true });
            if (error) { console.error(error.message); return; }

            commentList.innerHTML = "";
            if (!comments || comments.length === 0) {
                commentList.innerHTML = '<p style="color:#888; font-size:13px;">Belum ada komentar.</p>';
                return;
            }

            comments.forEach((c) => {
                const isCommentOwner = !!currentUser && c.user_id === currentUser.id;
                const cName = c.profiles?.full_name || c.profiles?.username || "Pengguna";
                const cEl = document.createElement("div");
                cEl.style.cssText = "margin-bottom:10px; display:flex; justify-content:space-between; gap:8px;";
                const cText = document.createElement("div");
                cText.innerHTML = `<strong style="font-size:13px;"></strong><br><span class="comment-text" style="font-size:13px; color:#ccc;"></span>`;
                cText.querySelector("strong").textContent = cName;
                cText.querySelector(".comment-text").textContent = c.content;
                cEl.appendChild(cText);

                if (isCommentOwner) {
                    const actions = document.createElement("div");
                    actions.style.cssText = "display:flex; gap:8px; align-items:start; flex-shrink:0;";
                    actions.innerHTML = `
                        <i class="fa-regular fa-pen-to-square edit-comment-btn" style="cursor:pointer; color:#888; font-size:12px;"></i>
                        <i class="fa-solid fa-trash delete-comment-btn" style="cursor:pointer; color:#888; font-size:12px;"></i>
                    `;
                    cEl.appendChild(actions);

                    actions.querySelector(".edit-comment-btn").addEventListener("click", () => {
                        const span = cText.querySelector(".comment-text");
                        const input = document.createElement("input");
                        input.type = "text";
                        input.value = c.content;
                        input.style.cssText = "font-size:13px; padding:4px 8px; border-radius:6px; border:1px solid #333; background:#1a1c26; color:#fff; width:100%;";
                        span.replaceWith(input);
                        input.focus();
                        input.addEventListener("keydown", async (e) => {
                            if (e.key === "Enter") {
                                const newVal = input.value.trim();
                                if (!newVal) return;
                                const { error: updErr } = await supabaseClient.from("comments").update({ content: newVal }).eq("id", c.id);
                                if (updErr) { alert("Gagal update: " + updErr.message); return; }
                                c.content = newVal;
                                loadComments();
                            }
                        });
                    });

                    actions.querySelector(".delete-comment-btn").addEventListener("click", async () => {
                        if (!confirm("Hapus komentar ini?")) return;
                        const { error: delErr } = await supabaseClient.from("comments").delete().eq("id", c.id);
                        if (delErr) { alert("Gagal hapus: " + delErr.message); return; }
                        loadComments();
                        const cc = commentToggleBtn.querySelector(".comment-count");
                        cc.textContent = Math.max(0, parseInt(cc.textContent) - 1);
                    });
                }
                commentList.appendChild(cEl);
            });
        }

        commentToggleBtn.addEventListener("click", async () => {
            const isHidden = commentSection.style.display === "none";
            commentSection.style.display = isHidden ? "block" : "none";
            if (isHidden && !commentsLoaded) { commentsLoaded = true; await loadComments(); }
        });

        const commentInput = commentInputWrap.querySelector(".comment-input");
        const commentSubmitBtn = commentInputWrap.querySelector(".comment-submit-btn");

        if (!currentUser) {
            commentInput.addEventListener("focus", () => {
                commentInput.blur();
                const ok = confirm("Anda harus login untuk berkomentar.\n\nLogin sekarang?");
                if (ok) window.location.href = "login.html";
            });
        }

        commentSubmitBtn.addEventListener("click", async () => {
            if (!currentUser) {
                const ok = confirm("Anda harus login untuk berkomentar.\n\nLogin sekarang?");
                if (ok) window.location.href = "login.html";
                return;
            }
            const content = commentInput.value.trim();
            if (!content) return;
            const { error } = await supabaseClient.from("comments").insert({ post_id: statusPost.id, user_id: currentUser.id, content });
            if (error) { alert("Gagal komentar: " + error.message); return; }
            commentInput.value = "";
            await loadComments();
            const countEl = commentToggleBtn.querySelector(".comment-count");
            countEl.textContent = parseInt(countEl.textContent) + 1;
        });

        footer.querySelector(".share-fb-btn").addEventListener("click", () => {
            const url = encodeURIComponent(window.location.href);
            const text = encodeURIComponent(statusPost.content);
            window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${text}`, "_blank");
        });
        footer.querySelector(".share-wa-btn").addEventListener("click", () => {
            const text = encodeURIComponent(statusPost.content + " - " + window.location.href);
            window.open(`https://wa.me/?text=${text}`, "_blank");
        });

        return card;
    }

    async function loadStatuses() {
        if (!feedSection) return;
        const { data: statuses, error } = await supabaseClient
            .from("post")
            .select("id, user_id, content, image_url, created_at")
            .eq("user_id", viewedUserId).eq("type", "status")
            .order("created_at", { ascending: false }).limit(10);
        if (error) { console.error("Gagal ambil status:", error.message); return; }

        feedSection.querySelectorAll(".profile-card").forEach((el) => el.remove());
        feedSection.querySelectorAll("p.empty-status-msg").forEach((el) => el.remove());

        if (!statuses || statuses.length === 0) {
            const empty = document.createElement("p");
            empty.className = "empty-status-msg";
            empty.style.cssText = "color:#888; text-align:center; padding:24px;";
            empty.textContent = isOwnProfile
                ? "Belum ada status. Tulis status pertamamu di atas!"
                : "Belum ada status.";
            feedSection.appendChild(empty);
            return;
        }

        const cards = await Promise.all(statuses.map((s) => renderStatusCard(s)));
        cards.forEach((card) => feedSection.appendChild(card));
    }

    if (isOwnProfile && shareBtn && statusBox) {
        shareBtn.addEventListener("click", async () => {
            const content = statusBox.value.trim();
            if (!content) { alert("Tulis sesuatu dulu."); return; }

            // type "status" + category "offtopic" supaya otomatis tampil
            // di Forum pada kategori Off Topic (dan ikut di filter "Semua").
            const { error } = await supabaseClient
                .from("post")
                .insert({
                    user_id: currentUser.id,
                    content,
                    type: "status",
                    category: "offtopic",
                    image_url: pendingImageUrl
                });

            if (error) { alert("Gagal membagikan status: " + error.message); return; }

            statusBox.value = "";
            pendingImageUrl = null;
            if (imagePreviewWrap) imagePreviewWrap.style.display = "none";
            if (statusImageInput) statusImageInput.value = "";
            loadStatuses();
        });
    }

    loadStatuses();

});