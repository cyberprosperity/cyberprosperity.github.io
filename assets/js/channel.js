// ============================================================
// ANALISA HARIAN (channel style) - assets/js/channel.js
// Hanya admin yang bisa posting. Pengunjung hanya bisa like.
// ============================================================

document.addEventListener("DOMContentLoaded", async () => {

    const { data: { session } } = await supabaseClient.auth.getSession();
    const user = session ? session.user : null;

    let isAdmin = false;
    let adminProfile = null;

    if (user) {
        const { data: me } = await supabaseClient
            .from("profiles").select("role, full_name, username, avatar_url").eq("id", user.id).maybeSingle();
        if (me) {
            isAdmin = me.role === "admin";
            adminProfile = me;
        }
    }

    const feedEl = document.getElementById("cnlFeed");
    const adminBar = document.getElementById("cnlAdminBar");
    const postBtn = document.getElementById("cnlPostBtn");
    const modal = document.getElementById("cnlModal");
    const cancelBtn = document.getElementById("cnlCancelBtn");
    const submitBtn = document.getElementById("cnlSubmitBtn");
    const captionInput = document.getElementById("cnlCaptionInput");
    const uploadBox = document.getElementById("cnlUploadBox");
    const fileInput = document.getElementById("cnlFileInput");
    const previewGrid = document.getElementById("cnlPreviewGrid");
    const lightboxEl = document.getElementById("cnlLightbox");

    let selectedFiles = [];

    if (isAdmin) adminBar.style.display = "flex";

    // ==========================================
    // HELPERS
    // ==========================================
    function escapeHtml(str) {
        return String(str ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

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

    function openLightbox(src) {
        lightboxEl.querySelector("img").src = src;
        lightboxEl.classList.add("active");
    }
    lightboxEl.addEventListener("click", () => lightboxEl.classList.remove("active"));

    function requireLogin(message) {
        if (!user) {
            const ok = confirm((message || "Anda harus login untuk melakukan ini.") + "\n\nLogin sekarang?");
            if (ok) window.location.href = "login.html";
            return false;
        }
        return true;
    }

    // ==========================================
    // MODAL POST BARU (admin)
    // ==========================================
    function resetModal() {
        captionInput.value = "";
        selectedFiles = [];
        previewGrid.innerHTML = "";
        fileInput.value = "";
    }

    function renderPreviews() {
        previewGrid.innerHTML = "";
        selectedFiles.forEach((file, idx) => {
            const url = URL.createObjectURL(file);
            const item = document.createElement("div");
            item.className = "cnl-preview-item";
            item.innerHTML = `<img src="${url}" alt="preview"><span class="cnl-preview-remove">&times;</span>`;
            item.querySelector(".cnl-preview-remove").addEventListener("click", () => {
                selectedFiles.splice(idx, 1);
                renderPreviews();
            });
            previewGrid.appendChild(item);
        });
    }

    if (uploadBox) {
        uploadBox.addEventListener("click", () => fileInput.click());
        fileInput.addEventListener("change", () => {
            selectedFiles = selectedFiles.concat(Array.from(fileInput.files || []));
            renderPreviews();
        });
    }

    if (postBtn) {
        postBtn.addEventListener("click", () => {
            if (!requireLogin("Anda harus login sebagai admin untuk memposting update.")) return;
            resetModal();
            modal.style.display = "flex";
        });
    }

    if (cancelBtn) {
        cancelBtn.addEventListener("click", () => { modal.style.display = "none"; });
    }

    if (submitBtn) {
        submitBtn.addEventListener("click", async () => {
            const caption = captionInput.value.trim();

            if (!caption && selectedFiles.length === 0) {
                alert("Isi caption atau lampirkan minimal satu foto.");
                return;
            }

            submitBtn.disabled = true;
            submitBtn.textContent = "Memposting...";

            try {
                const postId = crypto.randomUUID();

                const { error: postError } = await supabaseClient
                    .from("channel_posts")
                    .insert({ id: postId, admin_id: user.id, caption: caption || null });

                if (postError) throw postError;

                for (let i = 0; i < selectedFiles.length; i++) {
                    const file = selectedFiles[i];
                    const ext = file.name.split(".").pop();
                    const path = `${postId}/img-${i}-${Date.now()}.${ext}`;

                    const { error: uploadError } = await supabaseClient
                        .storage.from("channel-images").upload(path, file);

                    if (uploadError) throw uploadError;

                    const { data: publicUrlData } = supabaseClient
                        .storage.from("channel-images").getPublicUrl(path);

                    const { error: imgError } = await supabaseClient
                        .from("channel_post_images")
                        .insert({ post_id: postId, image_url: publicUrlData.publicUrl, sort_order: i });

                    if (imgError) throw imgError;
                }

                modal.style.display = "none";
                resetModal();
                await loadPosts();

            } catch (err) {
                alert("Gagal memposting: " + err.message);
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = "Posting";
            }
        });
    }

    // ==========================================
    // HAPUS POST (admin)
    // ==========================================
    async function deletePost(postId, postEl) {
        if (!confirm("Yakin mau hapus update ini? Tindakan ini tidak bisa dibatalkan.")) return;
        const { error } = await supabaseClient.from("channel_posts").delete().eq("id", postId);
        if (error) { alert("Gagal menghapus: " + error.message); return; }
        postEl.remove();
    }

    // ==========================================
    // RENDER SATU POST
    // ==========================================
    function renderPost(post) {
        const authorName = adminProfile?.full_name || adminProfile?.username || "CFX Pros Admin";
        const authorAvatar = post.author_avatar || "assets/images/avatar/default-avatar.png";
        const isOwner = user && post.admin_id === user.id;

        const el = document.createElement("article");
        el.className = "cnl-post";

        el.innerHTML = `
            <div class="cnl-post-head">
                <div class="cnl-post-avatar">
                    ${post.author_avatar ? `<img src="${escapeHtml(post.author_avatar)}" alt="admin">` : '<i class="fa-solid fa-chart-line"></i>'}
                </div>
                <div>
                    <div class="cnl-post-author">
                        ${escapeHtml(post.author_name || authorName)}
                        <i class="fa-solid fa-circle-check cnl-verified" title="Admin resmi"></i>
                    </div>
                    <div class="cnl-post-time">${timeAgo(post.created_at)}</div>
                </div>
                ${isAdmin ? `
                    <div class="cnl-post-admin-actions">
                        <i class="fa-solid fa-trash cnl-delete-btn" title="Hapus"></i>
                    </div>
                ` : ''}
            </div>

            ${post.caption ? `<p class="cnl-post-caption"></p>` : ''}

            ${post.images.length > 0 ? `
                <div class="cnl-carousel">
                    <div class="cnl-carousel-track"></div>
                    ${post.images.length > 1 ? `<div class="cnl-carousel-dots"></div>` : ''}
                </div>
            ` : ''}

            <div class="cnl-post-footer">
                <span class="cnl-like-btn">
                    <i class="fa-${post.isLiked ? 'solid' : 'regular'} fa-heart" style="${post.isLiked ? 'color:#e11d48;' : ''}"></i>
                    <span class="cnl-like-count">${post.likeCount}</span>
                </span>
            </div>
        `;

        if (post.caption) {
            el.querySelector(".cnl-post-caption").textContent = post.caption;
        }

        // Carousel
        if (post.images.length > 0) {
            const track = el.querySelector(".cnl-carousel-track");
            post.images.forEach((img) => {
                const imgEl = document.createElement("img");
                imgEl.src = img.image_url;
                imgEl.alt = "Chart analisa";
                imgEl.addEventListener("click", () => openLightbox(img.image_url));
                track.appendChild(imgEl);
            });

            if (post.images.length > 1) {
                const dotsWrap = el.querySelector(".cnl-carousel-dots");
                post.images.forEach((_, idx) => {
                    const dot = document.createElement("span");
                    if (idx === 0) dot.classList.add("active");
                    dotsWrap.appendChild(dot);
                });

                track.addEventListener("scroll", () => {
                    const idx = Math.round(track.scrollLeft / track.clientWidth);
                    dotsWrap.querySelectorAll("span").forEach((d, i) => {
                        d.classList.toggle("active", i === idx);
                    });
                });
            }
        }

        // Delete
        const delBtn = el.querySelector(".cnl-delete-btn");
        if (delBtn) {
            delBtn.addEventListener("click", () => deletePost(post.id, el));
        }

        // Like
        const likeBtn = el.querySelector(".cnl-like-btn");
        likeBtn.addEventListener("click", async () => {
            if (!requireLogin("Anda harus login untuk menyukai update ini.")) return;

            const icon = likeBtn.querySelector("i");
            const countEl = likeBtn.querySelector(".cnl-like-count");

            if (post.isLiked) {
                const { error } = await supabaseClient.from("channel_likes").delete()
                    .eq("post_id", post.id).eq("user_id", user.id);
                if (error) return;
                post.isLiked = false;
                post.likeCount -= 1;
            } else {
                const { error } = await supabaseClient.from("channel_likes").insert({ post_id: post.id, user_id: user.id });
                if (error) return;
                post.isLiked = true;
                post.likeCount += 1;
            }
            icon.className = `fa-${post.isLiked ? "solid" : "regular"} fa-heart`;
            icon.style.color = post.isLiked ? "#e11d48" : "";
            countEl.textContent = post.likeCount;
        });

        return el;
    }

    // ==========================================
    // LOAD SEMUA POST
    // ==========================================
    async function loadPosts() {
        feedEl.innerHTML = '<p style="color:#888; text-align:center; padding:40px;">Memuat update...</p>';

        const { data: posts, error } = await supabaseClient
            .from("channel_posts")
            .select("id, admin_id, caption, created_at")
            .order("created_at", { ascending: false });

        if (error) {
            feedEl.innerHTML = '<p style="color:#EF4444; text-align:center; padding:40px;">Gagal memuat data: ' + escapeHtml(error.message) + '</p>';
            return;
        }

        if (!posts || posts.length === 0) {
            feedEl.innerHTML = '<p style="color:#888; text-align:center; padding:40px;">Belum ada update analisa.</p>';
            return;
        }

        const postIds = posts.map((p) => p.id);
        const adminIds = [...new Set(posts.map((p) => p.admin_id))];

        const [imagesRes, profilesRes, likesRes, myLikesRes] = await Promise.all([
            supabaseClient.from("channel_post_images").select("id, post_id, image_url, sort_order").in("post_id", postIds).order("sort_order", { ascending: true }),
            supabaseClient.from("profiles").select("id, full_name, username, avatar_url").in("id", adminIds),
            supabaseClient.from("channel_likes").select("post_id").in("post_id", postIds),
            user ? supabaseClient.from("channel_likes").select("post_id").eq("user_id", user.id).in("post_id", postIds) : Promise.resolve({ data: [] })
        ]);

        const imagesMap = {};
        (imagesRes.data || []).forEach((img) => {
            if (!imagesMap[img.post_id]) imagesMap[img.post_id] = [];
            imagesMap[img.post_id].push(img);
        });

        const profilesMap = {};
        (profilesRes.data || []).forEach((p) => { profilesMap[p.id] = p; });

        const likeCounts = {};
        (likesRes.data || []).forEach((l) => {
            likeCounts[l.post_id] = (likeCounts[l.post_id] || 0) + 1;
        });

        const myLikedSet = new Set((myLikesRes.data || []).map((l) => l.post_id));

        feedEl.innerHTML = "";
        posts.forEach((post) => {
            const profile = profilesMap[post.admin_id];
            const enriched = {
                ...post,
                images: imagesMap[post.id] || [],
                author_name: profile?.full_name || profile?.username || null,
                author_avatar: profile?.avatar_url || null,
                likeCount: likeCounts[post.id] || 0,
                isLiked: myLikedSet.has(post.id)
            };
            feedEl.appendChild(renderPost(enriched));
        });
    }

    loadPosts();

});