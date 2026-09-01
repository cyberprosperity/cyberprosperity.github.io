// ============================================
// FORUM PAGE LOGIC (gaya ikon disamakan dengan Profile)
// - Semua orang bisa MEMBACA thread & komentar tanpa login
// - Like, komentar, buat thread, edit, hapus WAJIB login
// - Status dari Profile ikut tampil di sini (kategori Off Topic)
// - Nama/avatar penulis bisa diklik menuju profile.html?id=<user_id>
// ============================================

document.addEventListener("DOMContentLoaded", async () => {

    const { data: { session } } = await supabaseClient.auth.getSession();
    const user = session ? session.user : null;

    const feedContainer = document.querySelector(".forum-feed");
    const createBtn = document.querySelector(".forum-create-btn");
    const modal = document.querySelector("#threadModal");
    const cancelBtn = document.querySelector("#threadCancelBtn");
    const submitBtn = document.querySelector("#threadSubmitBtn");
    const titleInput = document.querySelector("#threadTitleInput");
    const categoryInput = document.querySelector("#threadCategoryInput");
    const contentInput = document.querySelector("#threadContentInput");
    const categoryButtons = document.querySelectorAll(".forum-categories button");
    const searchInput = document.querySelector(".forum-search input");

    let allThreads = [];

    // ==========================================
    // GUARD LOGIN - dipanggil sebelum aksi yang butuh akun
    // ==========================================
    function requireLogin(message) {
        if (!user) {
            const ok = confirm(
                (message || "Anda harus login untuk melakukan ini.") +
                "\n\nLogin sekarang?"
            );
            if (ok) window.location.href = "login.html";
            return false;
        }
        return true;
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

    function escapeHtml(str) {
        return str
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function linkify(text) {
        const escaped = escapeHtml(text || "");
        const urlRegex = /((https?:\/\/|www\.)[^\s<]+)/gi;
        return escaped.replace(urlRegex, (match) => {
            let href = match;
            if (!/^https?:\/\//i.test(href)) href = "https://" + href;
            return `<a href="${href}" target="_blank" rel="noopener noreferrer">${match}</a>`;
        });
    }

    async function deleteThread(threadId, cardElement) {
        if (!requireLogin("Anda harus login untuk menghapus postingan.")) return;
        if (!confirm("Yakin mau hapus postingan ini? Tindakan ini tidak bisa dibatalkan.")) return;
        const { error } = await supabaseClient.from("post").delete().eq("id", threadId);
        if (error) { alert("Gagal menghapus postingan: " + error.message); return; }
        cardElement.remove();
        allThreads = allThreads.filter((t) => t.id !== threadId);
    }

    async function saveThreadEdit(threadId, newTitle, newContent, titleEl, previewEl, threadObj) {
        newTitle = newTitle.trim();
        newContent = newContent.trim();
        if (!newContent) { alert("Isi tidak boleh kosong."); return false; }

        const { error } = await supabaseClient
            .from("post").update({ title: newTitle || null, content: newContent }).eq("id", threadId);
        if (error) { alert("Gagal menyimpan perubahan: " + error.message); return false; }

        if (newTitle) {
            titleEl.textContent = newTitle;
            titleEl.style.display = "";
        } else {
            titleEl.style.display = "none";
        }
        previewEl.innerHTML = linkify(newContent);
        threadObj.title = newTitle;
        threadObj.content = newContent;
        return true;
    }

    function renderComment(comment) {
        const authorName = comment.profiles?.full_name || comment.profiles?.username || "Pengguna";
        const authorAvatar = comment.profiles?.avatar_url || "assets/images/avatar/default-avatar.png";
        const isOwner = user && comment.user_id === user.id;
        const profileHref = `profile.html?id=${comment.user_id}`;

        const item = document.createElement("div");
        item.className = "comment-item";
        item.innerHTML = `
            <a href="${profileHref}"><img src="${authorAvatar}" alt="${authorName}" class="comment-avatar"></a>
            <div class="comment-body">
                <div class="comment-meta" style="display:flex; align-items:center; gap:10px;">
                    <a href="${profileHref}" style="color:inherit; text-decoration:none;">
                        <span class="comment-author"></span>
                    </a>
                    <span class="comment-time">${timeAgo(comment.created_at)}</span>
                    ${isOwner ? `
                        <span style="margin-left:auto; display:flex; gap:10px;">
                            <i class="fa-regular fa-pen-to-square comment-edit-btn" style="cursor:pointer; color:#aaa; font-size:13px;"></i>
                            <i class="fa-solid fa-trash comment-delete-btn" style="cursor:pointer; color:#aaa; font-size:13px;"></i>
                        </span>
                    ` : ''}
                </div>
                <p class="comment-text"></p>
                <div class="comment-edit-form" style="display:none;">
                    <input type="text" class="comment-edit-input">
                    <div class="comment-edit-actions">
                        <button type="button" class="comment-edit-save">Simpan</button>
                        <button type="button" class="comment-edit-cancel">Batal</button>
                    </div>
                </div>
            </div>
        `;

        const textEl = item.querySelector(".comment-text");
        item.querySelector(".comment-author").textContent = authorName;
        textEl.innerHTML = linkify(comment.content);

        const delBtn = item.querySelector(".comment-delete-btn");
        if (delBtn) {
            delBtn.addEventListener("click", async () => {
                if (!requireLogin("Anda harus login untuk menghapus komentar.")) return;
                if (!confirm("Hapus komentar ini?")) return;
                const { error } = await supabaseClient.from("comments").delete().eq("id", comment.id);
                if (error) { alert("Gagal menghapus komentar: " + error.message); return; }
                item.remove();
            });
        }

        const editBtn = item.querySelector(".comment-edit-btn");
        const editForm = item.querySelector(".comment-edit-form");
        const editInput = item.querySelector(".comment-edit-input");
        const editSaveBtn = item.querySelector(".comment-edit-save");
        const editCancelBtn = item.querySelector(".comment-edit-cancel");

        if (editBtn) {
            editBtn.addEventListener("click", () => {
                if (!requireLogin("Anda harus login untuk mengedit komentar.")) return;
                editInput.value = comment.content;
                textEl.style.display = "none";
                editForm.style.display = "block";
                editInput.focus();
            });

            editCancelBtn.addEventListener("click", () => {
                editForm.style.display = "none";
                textEl.style.display = "block";
            });

            editSaveBtn.addEventListener("click", async () => {
                const newText = editInput.value.trim();
                if (!newText) { alert("Komentar tidak boleh kosong."); return; }
                const { error } = await supabaseClient.from("comments").update({ content: newText }).eq("id", comment.id);
                if (error) { alert("Gagal menyimpan perubahan: " + error.message); return; }
                comment.content = newText;
                textEl.innerHTML = linkify(newText);
                editForm.style.display = "none";
                textEl.style.display = "block";
            });
        }

        return item;
    }

    async function loadComments(threadId, listEl) {
        listEl.innerHTML = '<p style="color:#64748B; font-size:13px;">Memuat komentar...</p>';

        const { data: comments, error } = await supabaseClient
            .from("comments")
            .select("id, user_id, content, created_at")
            .eq("post_id", threadId)
            .order("created_at", { ascending: true });

        if (error) {
            listEl.innerHTML = '<p style="color:#EF4444; font-size:13px;">Gagal memuat komentar: ' + error.message + '</p>';
            return;
        }

        if (comments.length === 0) {
            listEl.innerHTML = '<p style="color:#64748B; font-size:13px;">Belum ada balasan. Jadilah yang pertama!</p>';
            return;
        }

        const userIds = [...new Set(comments.map((c) => c.user_id))];
        const { data: profilesData } = await supabaseClient
            .from("profiles").select("id, full_name, username, avatar_url").in("id", userIds);

        const profilesMap = {};
        (profilesData || []).forEach((p) => { profilesMap[p.id] = p; });

        listEl.innerHTML = "";
        comments.forEach((comment) => {
            comment.profiles = profilesMap[comment.user_id] || null;
            listEl.appendChild(renderComment(comment));
        });
    }

    async function submitComment(threadId, input, listEl, countEl) {
        if (!requireLogin("Anda harus login untuk berkomentar.")) return;

        const text = input.value.trim();
        if (!text) return;
        const { error } = await supabaseClient.from("comments").insert({
            post_id: threadId, user_id: user.id, content: text
        });
        if (error) { alert("Gagal mengirim balasan: " + error.message); return; }
        input.value = "";
        await loadComments(threadId, listEl);
        const currentCount = parseInt(countEl.textContent, 10) || 0;
        countEl.textContent = currentCount + 1;
    }

    async function renderThread(thread) {
        const authorName = thread.profiles?.full_name || thread.profiles?.username || "Pengguna";
        const authorAvatar = thread.profiles?.avatar_url || "assets/images/avatar/default-avatar.png";
        const isOwner = user && thread.user_id === user.id;
        const profileHref = `profile.html?id=${thread.user_id}`;

        const [likeCountRes, myLikeRes, commentCountRes] = await Promise.all([
            supabaseClient.from("likes").select("id", { count: "exact", head: true }).eq("post_id", thread.id),
            user
                ? supabaseClient.from("likes").select("id").eq("post_id", thread.id).eq("user_id", user.id).maybeSingle()
                : Promise.resolve({ data: null }),
            supabaseClient.from("comments").select("id", { count: "exact", head: true }).eq("post_id", thread.id)
        ]);

        let likeCount = likeCountRes.count ?? 0;
        let isLiked = !!myLikeRes.data;
        const commentCount = commentCountRes.count ?? 0;

        const article = document.createElement("article");
        article.className = "thread-card";
        article.dataset.category = thread.category || "gold";

        article.innerHTML = `
            <div class="thread-avatar">
                <a href="${profileHref}"><img src="${authorAvatar}" alt="${authorName}"></a>
            </div>
            <div class="thread-content">
                <div class="thread-meta" style="display:flex; align-items:center; gap:10px;">
                    <a href="${profileHref}" style="color:inherit; text-decoration:none;">
                        <span class="thread-author"></span>
                    </a>
                    <span class="thread-time">${timeAgo(thread.created_at)}</span>
                    ${isOwner ? `
                        <span style="margin-left:auto; display:flex; gap:12px; align-items:center;">
                            <i class="fa-regular fa-pen-to-square thread-edit-btn" style="cursor:pointer; color:#aaa;"></i>
                            <i class="fa-solid fa-trash thread-delete-btn" style="cursor:pointer; color:#aaa;"></i>
                        </span>
                    ` : ''}
                </div>
                <span class="thread-tag"></span>
                <h3 class="thread-title"></h3>
                <p class="thread-preview"></p>

                <div class="thread-edit-form" style="display:none;">
                    <input type="text" class="thread-edit-title" placeholder="Judul thread (opsional)">
                    <textarea class="thread-edit-content" rows="3" placeholder="Isi thread"></textarea>
                    <div class="thread-edit-actions">
                        <button type="button" class="thread-edit-save">Simpan</button>
                        <button type="button" class="thread-edit-cancel">Batal</button>
                    </div>
                </div>

                <div class="thread-footer" style="display:flex; align-items:center; gap:16px; flex-wrap:wrap;">
                    <span class="thread-like-btn" style="cursor:pointer;">
                        <i class="fa-${isLiked ? "solid" : "regular"} fa-heart" style="${isLiked ? "color:#e11d48;" : ""}"></i>
                        <span class="thread-like-count">${likeCount}</span>
                    </span>
                    <span class="thread-comment-toggle" style="cursor:pointer;">
                        <i class="fa-regular fa-comment"></i>
                        <span class="comment-count">${commentCount}</span>
                    </span>
                    <span>
                        <i class="fa-regular fa-eye"></i>
                        <span class="thread-view-count">${thread.views ?? 0}</span>
                    </span>
                    <span class="thread-share-fb" style="cursor:pointer;" title="Share ke Facebook">
                        <i class="fa-brands fa-facebook" style="color:#1877f2;"></i>
                    </span>
                    <span class="thread-share-wa" style="cursor:pointer;" title="Share ke WhatsApp">
                        <i class="fa-brands fa-whatsapp" style="color:#25d366;"></i>
                    </span>
                </div>
                <div class="thread-comments" style="display:none;">
                    <div class="comment-list"></div>
                    <div class="comment-form">
                        <input type="text" class="comment-input" placeholder="${user ? 'Tulis balasan...' : 'Login untuk membalas...'}">
                        <button type="button" class="comment-submit-btn">Kirim</button>
                    </div>
                </div>
            </div>
        `;

        const titleEl = article.querySelector(".thread-title");
        const previewEl = article.querySelector(".thread-preview");

        article.querySelector(".thread-author").textContent = authorName;
        article.querySelector(".thread-tag").textContent = (thread.category || "gold").toUpperCase();

        if (thread.title) {
            titleEl.textContent = thread.title;
            titleEl.style.display = "";
        } else {
            // post tipe "status" (dari Profile) biasanya tidak punya judul
            titleEl.style.display = "none";
        }

        previewEl.innerHTML = linkify(thread.content);

        const deleteBtn = article.querySelector(".thread-delete-btn");
        if (deleteBtn) {
            deleteBtn.addEventListener("click", () => deleteThread(thread.id, article));
        }

        const editBtn = article.querySelector(".thread-edit-btn");
        const editForm = article.querySelector(".thread-edit-form");
        const editTitleInput = article.querySelector(".thread-edit-title");
        const editContentInput = article.querySelector(".thread-edit-content");
        const editSaveBtn = article.querySelector(".thread-edit-save");
        const editCancelBtn = article.querySelector(".thread-edit-cancel");

        if (editBtn) {
            editBtn.addEventListener("click", () => {
                if (!requireLogin("Anda harus login untuk mengedit postingan.")) return;
                editTitleInput.value = thread.title || "";
                editContentInput.value = thread.content || "";
                titleEl.style.display = "none";
                previewEl.style.display = "none";
                editForm.style.display = "block";
            });

            editCancelBtn.addEventListener("click", () => {
                editForm.style.display = "none";
                if (thread.title) titleEl.style.display = "block";
                previewEl.style.display = "block";
            });

            editSaveBtn.addEventListener("click", async () => {
                const success = await saveThreadEdit(
                    thread.id, editTitleInput.value, editContentInput.value, titleEl, previewEl, thread
                );
                if (success) {
                    editForm.style.display = "none";
                    previewEl.style.display = "block";
                }
            });
        }

        const likeBtn = article.querySelector(".thread-like-btn");
        likeBtn.addEventListener("click", async () => {
            if (!requireLogin("Anda harus login untuk menyukai postingan.")) return;

            const icon = likeBtn.querySelector("i");
            const countEl = likeBtn.querySelector(".thread-like-count");

            if (isLiked) {
                const { error } = await supabaseClient.from("likes").delete()
                    .eq("post_id", thread.id).eq("user_id", user.id);
                if (error) return;
                isLiked = false; likeCount -= 1;
            } else {
                const { error } = await supabaseClient.from("likes").insert({ post_id: thread.id, user_id: user.id });
                if (error) return;
                isLiked = true; likeCount += 1;
            }
            icon.className = `fa-${isLiked ? "solid" : "regular"} fa-heart`;
            icon.style.color = isLiked ? "#e11d48" : "";
            countEl.textContent = likeCount;
        });

        let viewCounted = false;
        article.addEventListener("click", async (e) => {
            if (e.target.closest("i, button, a, .thread-like-btn, .thread-share-fb, .thread-share-wa, .thread-comment-toggle")) return;
            if (viewCounted) return;
            viewCounted = true;
            const { error } = await supabaseClient.rpc("increment_post_views", { post_id_arg: thread.id });
            if (!error) {
                const viewEl = article.querySelector(".thread-view-count");
                viewEl.textContent = parseInt(viewEl.textContent) + 1;
            }
        });

        article.querySelector(".thread-share-fb").addEventListener("click", () => {
            const url = encodeURIComponent(window.location.href);
            const text = encodeURIComponent((thread.title || "") + " " + thread.content);
            window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${text}`, "_blank");
        });

        article.querySelector(".thread-share-wa").addEventListener("click", () => {
            const text = encodeURIComponent((thread.title ? thread.title + "\n" : "") + thread.content + "\n" + window.location.href);
            window.open(`https://wa.me/?text=${text}`, "_blank");
        });

        const toggle = article.querySelector(".thread-comment-toggle");
        const commentsPanel = article.querySelector(".thread-comments");
        const commentList = article.querySelector(".comment-list");
        const commentInput = article.querySelector(".comment-input");
        const commentSubmitBtn = article.querySelector(".comment-submit-btn");
        const countEl = article.querySelector(".comment-count");
        let commentsLoaded = false;

        toggle.addEventListener("click", () => {
            const isHidden = commentsPanel.style.display === "none";
            commentsPanel.style.display = isHidden ? "block" : "none";
            if (isHidden && !commentsLoaded) {
                loadComments(thread.id, commentList);
                commentsLoaded = true;
            }
        });

        commentSubmitBtn.addEventListener("click", () => {
            submitComment(thread.id, commentInput, commentList, countEl);
        });

        commentInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") submitComment(thread.id, commentInput, commentList, countEl);
        });

        // tamu: klik input komentar langsung diarahkan ke login, biar tidak ngetik sia-sia
        if (!user) {
            commentInput.addEventListener("focus", () => {
                commentInput.blur();
                requireLogin("Anda harus login untuk berkomentar.");
            });
        }

        return article;
    }

    async function displayThreads(threads) {
        if (!feedContainer) return;
        feedContainer.innerHTML = "";

        if (threads.length === 0) {
            feedContainer.innerHTML = '<p style="color:#888; text-align:center; padding:40px;">Belum ada thread di kategori ini.</p>';
            return;
        }

        const cards = await Promise.all(threads.map((t) => renderThread(t)));
        cards.forEach((card) => feedContainer.appendChild(card));
    }

    async function loadThreads() {
        // Ambil thread ("thread") DAN status dari Profile ("status") - keduanya tampil
        // di Forum, status otomatis dianggap kategori "offtopic" (lihat profile.js).
        const { data: threads, error } = await supabaseClient
            .from("post")
            .select("id, user_id, title, content, category, created_at, views, type, profiles(full_name, username, avatar_url)")
            .in("type", ["thread", "status"])
            .order("created_at", { ascending: false });

        if (error) { console.error("Gagal ambil data thread:", error.message); return; }

        allThreads = threads;
        displayThreads(allThreads);
    }

    categoryButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
            categoryButtons.forEach((b) => b.classList.remove("active"));
            btn.classList.add("active");
            const filter = btn.dataset.filter;
            if (filter === "all") {
                displayThreads(allThreads);
            } else {
                displayThreads(allThreads.filter((t) => t.category === filter));
            }
        });
    });

    if (searchInput) {
        searchInput.addEventListener("input", () => {
            const keyword = searchInput.value.trim().toLowerCase();
            const filtered = allThreads.filter((t) =>
                (t.title || "").toLowerCase().includes(keyword) ||
                (t.content || "").toLowerCase().includes(keyword)
            );
            displayThreads(filtered);
        });
    }

    if (createBtn && modal) {
        createBtn.addEventListener("click", () => {
            if (!requireLogin("Anda harus login untuk membuat thread baru.")) return;
            modal.style.display = "flex";
        });
    }

    if (cancelBtn && modal) {
        cancelBtn.addEventListener("click", () => { modal.style.display = "none"; });
    }

    if (submitBtn) {
        submitBtn.addEventListener("click", async () => {
            if (!requireLogin("Anda harus login untuk membuat thread baru.")) return;

            const title = titleInput.value.trim();
            const category = categoryInput.value;
            const content = contentInput.value.trim();

            if (!title || !content) { alert("Judul dan isi thread wajib diisi."); return; }

            const { error } = await supabaseClient
                .from("post")
                .insert({ user_id: user.id, title, category, content, type: "thread" });

            if (error) { alert("Gagal membuat thread: " + error.message); return; }

            titleInput.value = "";
            contentInput.value = "";
            modal.style.display = "none";
            loadThreads();
        });
    }

    loadThreads();

});