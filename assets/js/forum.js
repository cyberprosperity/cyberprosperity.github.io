// ============================================
// FORUM PAGE LOGIC (versi lengkap: thread + komentar + like/views/share)
// ============================================

document.addEventListener("DOMContentLoaded", async () => {

    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) { window.location.href = "login.html"; return; }
    const user = session.user;

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

    // ---- HAPUS THREAD ----
    async function deleteThread(threadId, cardElement) {
        const confirmDelete = confirm("Yakin mau hapus postingan ini? Tindakan ini tidak bisa dibatalkan.");
        if (!confirmDelete) return;

        const { error } = await supabaseClient.from("post").delete().eq("id", threadId);
        if (error) { alert("Gagal menghapus postingan: " + error.message); return; }

        cardElement.remove();
        allThreads = allThreads.filter((t) => t.id !== threadId);
    }

    // ---- EDIT THREAD ----
    async function saveThreadEdit(threadId, newTitle, newContent, titleEl, previewEl, threadObj) {
        newTitle = newTitle.trim();
        newContent = newContent.trim();
        if (!newTitle || !newContent) { alert("Judul dan isi tidak boleh kosong."); return false; }

        const { error } = await supabaseClient.from("post")
            .update({ title: newTitle, content: newContent }).eq("id", threadId);

        if (error) { alert("Gagal menyimpan perubahan: " + error.message); return false; }

        titleEl.textContent = newTitle;
        previewEl.innerHTML = linkify(newContent);
        threadObj.title = newTitle;
        threadObj.content = newContent;
        return true;
    }

    // ---- KOMENTAR: RENDER SATU KOMENTAR ----
    function renderComment(comment) {
        const authorName = comment.profiles?.full_name || comment.profiles?.username || "Pengguna";
        const authorAvatar = comment.profiles?.avatar_url || "assets/images/avatar/default-avatar.png";
        const isOwner = comment.user_id === user.id;

        const item = document.createElement("div");
        item.className = "comment-item";

        item.innerHTML = `
            <img src="${authorAvatar}" alt="${authorName}" class="comment-avatar">
            <div class="comment-body">
                <div class="comment-meta">
                    <span class="comment-author"></span>
                    <span class="comment-time">${timeAgo(comment.created_at)}</span>
                    ${isOwner ? `
                        <button type="button" class="comment-edit-btn" title="Edit komentar"><i class="fa-regular fa-pen-to-square"></i></button>
                        <button type="button" class="comment-delete-btn" title="Hapus komentar"><i class="fa-regular fa-trash-can"></i></button>
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

                const { error } = await supabaseClient.from("comments")
                    .update({ content: newText }).eq("id", comment.id);

                if (error) { alert("Gagal menyimpan perubahan: " + error.message); return; }

                comment.content = newText;
                textEl.innerHTML = linkify(newText);
                editForm.style.display = "none";
                textEl.style.display = "block";
            });
        }

        return item;
    }

    // ---- KOMENTAR: MUAT SEMUA (comments & profiles diambil terpisah, digabung manual) ----
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

    // ---- KOMENTAR: KIRIM BARU ----
    async function submitComment(threadId, input, listEl, countEl) {
        const text = input.value.trim();
        if (!text) return;

        const { error } = await supabaseClient.from("comments")
            .insert({ post_id: threadId, user_id: user.id, content: text });

        if (error) { alert("Gagal mengirim balasan: " + error.message); return; }

        input.value = "";
        await loadComments(threadId, listEl);
        const currentCount = parseInt(countEl.textContent, 10) || 0;
        countEl.textContent = currentCount + 1;
    }

    // ---- RENDER SATU THREAD (async karena perlu fetch like/comment count dulu) ----
    async function renderThread(thread) {
        const authorName = thread.profiles?.full_name || thread.profiles?.username || "Pengguna";
        const authorAvatar = thread.profiles?.avatar_url || "assets/images/avatar/default-avatar.png";
        const isOwner = thread.user_id === user.id;

        const [likeCountRes, myLikeRes, commentCountRes] = await Promise.all([
            supabaseClient.from("likes").select("id", { count: "exact", head: true }).eq("post_id", thread.id),
            supabaseClient.from("likes").select("id").eq("post_id", thread.id).eq("user_id", user.id).maybeSingle(),
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
                <img src="${authorAvatar}" alt="${authorName}">
            </div>
            <div class="thread-content">
                <div class="thread-meta">
                    <span class="thread-author"></span>
                    <span class="thread-time">${timeAgo(thread.created_at)}</span>
                    ${isOwner ? `
                        <button type="button" class="thread-edit-btn" title="Edit postingan"><i class="fa-regular fa-pen-to-square"></i> Edit</button>
                        <button type="button" class="thread-delete-btn" title="Hapus postingan"><i class="fa-regular fa-trash-can"></i> Hapus</button>
                    ` : ''}
                </div>
                <span class="thread-tag"></span>
                <h3 class="thread-title"></h3>
                <p class="thread-preview"></p>

                <div class="thread-edit-form" style="display:none;">
                    <input type="text" class="thread-edit-title" placeholder="Judul thread">
                    <textarea class="thread-edit-content" rows="3" placeholder="Isi thread"></textarea>
                    <div class="thread-edit-actions">
                        <button type="button" class="thread-edit-save">Simpan</button>
                        <button type="button" class="thread-edit-cancel">Batal</button>
                    </div>
                </div>

                <div class="thread-footer">
                    <span class="thread-like-btn">
                        <i class="fa-${isLiked ? "solid" : "regular"} fa-thumbs-up" style="${isLiked ? "color:#FFD700;" : ""}"></i>
                        <span class="thread-like-count">${likeCount}</span> Like
                    </span>
                    <span class="thread-comment-toggle">💬 <span class="comment-count">${commentCount}</span> Balasan</span>
                    <span>👁 <span class="thread-view-count">${thread.views ?? 0}</span> Views</span>
                    <span class="thread-share-fb" title="Share ke Facebook"><i class="fa-brands fa-facebook" style="color:#1877f2;"></i></span>
                    <span class="thread-share-wa" title="Share ke WhatsApp"><i class="fa-brands fa-whatsapp" style="color:#25d366;"></i></span>
                </div>
                <div class="thread-comments" style="display:none;">
                    <div class="comment-list"></div>
                    <div class="comment-form">
                        <input type="text" class="comment-input" placeholder="Tulis balasan...">
                        <button type="button" class="comment-submit-btn">Kirim</button>
                    </div>
                </div>
            </div>
        `;

        const titleEl = article.querySelector(".thread-title");
        const previewEl = article.querySelector(".thread-preview");

        article.querySelector(".thread-author").textContent = authorName;
        article.querySelector(".thread-tag").textContent = (thread.category || "gold").toUpperCase();
        titleEl.textContent = thread.title || "(Tanpa judul)";
        previewEl.innerHTML = linkify(thread.content);

        // Hapus & Edit thread
        const deleteBtn = article.querySelector(".thread-delete-btn");
        if (deleteBtn) deleteBtn.addEventListener("click", () => deleteThread(thread.id, article));

        const editBtn = article.querySelector(".thread-edit-btn");
        const editForm = article.querySelector(".thread-edit-form");
        const editTitleInput = article.querySelector(".thread-edit-title");
        const editContentInput = article.querySelector(".thread-edit-content");
        const editSaveBtn = article.querySelector(".thread-edit-save");
        const editCancelBtn = article.querySelector(".thread-edit-cancel");

        if (editBtn) {
            editBtn.addEventListener("click", () => {
                editTitleInput.value = thread.title || "";
                editContentInput.value = thread.content || "";
                titleEl.style.display = "none";
                previewEl.style.display = "none";
                editForm.style.display = "block";
            });

            editCancelBtn.addEventListener("click", () => {
                editForm.style.display = "none";
                titleEl.style.display = "block";
                previewEl.style.display = "block";
            });

            editSaveBtn.addEventListener("click", async () => {
                const success = await saveThreadEdit(thread.id, editTitleInput.value, editContentInput.value, titleEl, previewEl, thread);
                if (success) {
                    editForm.style.display = "none";
                    titleEl.style.display = "block";
                    previewEl.style.display = "block";
                }
            });
        }

        // Like
        const likeBtn = article.querySelector(".thread-like-btn");
        likeBtn.addEventListener("click", async () => {
            const icon = likeBtn.querySelector("i");
            const countEl = likeBtn.querySelector(".thread-like-count");

            if (isLiked) {
                const { error } = await supabaseClient.from("likes").delete()
                    .eq("post_id", thread.id).eq("user_id", user.id);
                if (error) return;
                isLiked = false;
                likeCount -= 1;
            } else {
                const { error } = await supabaseClient.from("likes").insert({ post_id: thread.id, user_id: user.id });
                if (error) return;
                isLiked = true;
                likeCount += 1;
            }
            icon.className = `fa-${isLiked ? "solid" : "regular"} fa-thumbs-up`;
            icon.style.color = isLiked ? "#FFD700" : "";
            countEl.textContent = likeCount;
        });

        // Share
        article.querySelector(".thread-share-fb").addEventListener("click", () => {
            const url = encodeURIComponent(window.location.href);
            const text = encodeURIComponent(thread.title + " - " + thread.content);
            window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${text}`, "_blank");
        });

        article.querySelector(".thread-share-wa").addEventListener("click", () => {
            const text = encodeURIComponent(thread.title + "\n" + thread.content + "\n" + window.location.href);
            window.open(`https://wa.me/?text=${text}`, "_blank");
        });

        // Toggle komentar
        const toggle = article.querySelector(".thread-comment-toggle");
        const commentsPanel = article.querySelector(".thread-comments");
        const commentList = article.querySelector(".comment-list");
        const commentInput = article.querySelector(".comment-input");
        const commentSubmitBtn = article.querySelector(".comment-submit-btn");
        const countEl2 = article.querySelector(".comment-count");
        let commentsLoaded = false;
        let viewCounted = false;

        toggle.addEventListener("click", () => {
            const isHidden = commentsPanel.style.display === "none";
            commentsPanel.style.display = isHidden ? "block" : "none";
            if (isHidden && !commentsLoaded) {
                loadComments(thread.id, commentList);
                commentsLoaded = true;
            }
        });

        commentSubmitBtn.addEventListener("click", () => submitComment(thread.id, commentInput, commentList, countEl2));
        commentInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") submitComment(thread.id, commentInput, commentList, countEl2);
        });

        // Hitung views: sekali per thread waktu pertama kali kartu ini dibuat/tampil
        if (!viewCounted) {
            viewCounted = true;
            supabaseClient.rpc("increment_post_views", { post_id_arg: thread.id }).then(({ error }) => {
                if (!error) {
                    const viewEl = article.querySelector(".thread-view-count");
                    viewEl.textContent = parseInt(viewEl.textContent, 10) + 1;
                }
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
        const { data: threads, error } = await supabaseClient
            .from("post")
            .select("id, user_id, title, content, category, created_at, views, profiles(full_name, username, avatar_url)")
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
            displayThreads(filter === "all" ? allThreads : allThreads.filter((t) => t.category === filter));
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

    if (createBtn && modal) createBtn.addEventListener("click", () => { modal.style.display = "flex"; });
    if (cancelBtn && modal) cancelBtn.addEventListener("click", () => { modal.style.display = "none"; });

    if (submitBtn) {
        submitBtn.addEventListener("click", async () => {
            const title = titleInput.value.trim();
            const category = categoryInput.value;
            const content = contentInput.value.trim();

            if (!title || !content) { alert("Judul dan isi thread wajib diisi."); return; }

            const { error } = await supabaseClient.from("post")
                .insert({ user_id: user.id, title, category, content });

            if (error) { alert("Gagal membuat thread: " + error.message); return; }

            titleInput.value = "";
            contentInput.value = "";
            modal.style.display = "none";
            loadThreads();
        });
    }

    loadThreads();

});