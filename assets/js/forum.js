// ============================================
// FORUM PAGE LOGIC (versi Thread)
// Alur: Cek login -> Ambil semua thread + data penulisnya ->
//       Tampilkan sebagai thread-card -> Filter kategori ->
//       Buat thread baru lewat modal -> Hapus thread milik sendiri ->
//       Komentar/balasan per thread
// ============================================

document.addEventListener("DOMContentLoaded", async () => {

    // ---- CEK LOGIN ----
    const { data: { session } } = await supabaseClient.auth.getSession();

    if (!session) {
        window.location.href = "login.html";
        return;
    }

    const user = session.user;

    // ---- ELEMEN PENTING ----
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

    let allThreads = []; // simpan semua thread supaya bisa difilter tanpa fetch ulang

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

    // ---- HAPUS THREAD ----
    async function deleteThread(threadId, cardElement) {
        const confirmDelete = confirm("Yakin mau hapus postingan ini? Tindakan ini tidak bisa dibatalkan.");
        if (!confirmDelete) return;

        const { error } = await supabaseClient
            .from("post")
            .delete()
            .eq("id", threadId);

        if (error) {
            alert("Gagal menghapus postingan: " + error.message);
            return;
        }

        cardElement.remove();
        allThreads = allThreads.filter((t) => t.id !== threadId);
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
                    ${isOwner ? '<button type="button" class="comment-delete-btn" title="Hapus komentar"><i class="fa-regular fa-trash-can"></i></button>' : ''}
                </div>
                <p class="comment-text"></p>
            </div>
        `;

        item.querySelector(".comment-author").textContent = authorName;
        item.querySelector(".comment-text").textContent = comment.content;

        const delBtn = item.querySelector(".comment-delete-btn");
        if (delBtn) {
            delBtn.addEventListener("click", async () => {
                const confirmDelete = confirm("Hapus komentar ini?");
                if (!confirmDelete) return;

                const { error } = await supabaseClient
                    .from("comments")
                    .delete()
                    .eq("id", comment.id);

                if (error) {
                    alert("Gagal menghapus komentar: " + error.message);
                    return;
                }

                item.remove();
            });
        }

        return item;
    }

    // ---- KOMENTAR: MUAT SEMUA KOMENTAR UNTUK 1 THREAD ----
    async function loadComments(threadId, listEl) {
        listEl.innerHTML = '<p style="color:#64748B; font-size:13px;">Memuat komentar...</p>';

        const { data: comments, error } = await supabaseClient
            .from("comments")
            .select("id, user_id, content, created_at, profiles(full_name, username, avatar_url)")
            .eq("post_id", threadId)
            .order("created_at", { ascending: true });

        if (error) {
            listEl.innerHTML = '<p style="color:#EF4444; font-size:13px;">Gagal memuat komentar.</p>';
            return;
        }

        listEl.innerHTML = "";

        if (comments.length === 0) {
            listEl.innerHTML = '<p style="color:#64748B; font-size:13px;">Belum ada balasan. Jadilah yang pertama!</p>';
            return;
        }

        comments.forEach((comment) => {
            listEl.appendChild(renderComment(comment));
        });
    }

    // ---- KOMENTAR: KIRIM KOMENTAR BARU ----
    async function submitComment(threadId, input, listEl, countEl) {
        const text = input.value.trim();
        if (!text) return;

        const { error } = await supabaseClient
            .from("comments")
            .insert({
                post_id: threadId,
                user_id: user.id,
                content: text
            });

        if (error) {
            alert("Gagal mengirim balasan: " + error.message);
            return;
        }

        input.value = "";
        await loadComments(threadId, listEl);

        // update angka "Balasan" di footer
        const currentCount = parseInt(countEl.textContent, 10) || 0;
        countEl.textContent = currentCount + 1;
    }

    function renderThread(thread) {
        const authorName = thread.profiles?.full_name || thread.profiles?.username || "Pengguna";
        const authorAvatar = thread.profiles?.avatar_url || "assets/images/avatar/default-avatar.png";
        const isOwner = thread.user_id === user.id;
        const commentCount = thread.comments?.[0]?.count || 0;

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
                    ${isOwner ? '<button type="button" class="thread-delete-btn" title="Hapus postingan"><i class="fa-regular fa-trash-can"></i> Hapus</button>' : ''}
                </div>
                <span class="thread-tag"></span>
                <h3 class="thread-title"></h3>
                <p class="thread-preview"></p>
                <div class="thread-footer">
                    <span class="thread-comment-toggle">💬 <span class="comment-count">${commentCount}</span> Balasan</span>
                    <span>👍 0 Like</span>
                    <span>👁 0 Views</span>
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

        article.querySelector(".thread-author").textContent = authorName;
        article.querySelector(".thread-tag").textContent = (thread.category || "gold").toUpperCase();
        article.querySelector(".thread-title").textContent = thread.title || "(Tanpa judul)";
        article.querySelector(".thread-preview").textContent = thread.content;

        // Tombol hapus thread
        const deleteBtn = article.querySelector(".thread-delete-btn");
        if (deleteBtn) {
            deleteBtn.addEventListener("click", () => {
                deleteThread(thread.id, article);
            });
        }

        // Toggle buka/tutup kolom komentar
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
            if (e.key === "Enter") {
                submitComment(thread.id, commentInput, commentList, countEl);
            }
        });

        return article;
    }

    function displayThreads(threads) {
        if (!feedContainer) return;
        feedContainer.innerHTML = "";

        if (threads.length === 0) {
            feedContainer.innerHTML = '<p style="color:#888; text-align:center; padding:40px;">Belum ada thread di kategori ini.</p>';
            return;
        }

        threads.forEach((thread) => {
            feedContainer.appendChild(renderThread(thread));
        });
    }

    // ---- AMBIL SEMUA THREAD DARI DATABASE ----
    async function loadThreads() {
        const { data: threads, error } = await supabaseClient
            .from("post")
            .select("id, user_id, title, content, category, created_at, profiles(full_name, username, avatar_url), comments(count)")
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Gagal ambil data thread:", error.message);
            return;
        }

        allThreads = threads;
        displayThreads(allThreads);
    }

    // ---- FILTER KATEGORI ----
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

    // ---- SEARCH THREAD ----
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

    // ---- MODAL BUAT THREAD BARU ----
    if (createBtn && modal) {
        createBtn.addEventListener("click", () => {
            modal.style.display = "flex";
        });
    }

    if (cancelBtn && modal) {
        cancelBtn.addEventListener("click", () => {
            modal.style.display = "none";
        });
    }

    if (submitBtn) {
        submitBtn.addEventListener("click", async () => {
            const title = titleInput.value.trim();
            const category = categoryInput.value;
            const content = contentInput.value.trim();

            if (!title || !content) {
                alert("Judul dan isi thread wajib diisi.");
                return;
            }

            const { error } = await supabaseClient
                .from("post")
                .insert({
                    user_id: user.id,
                    title: title,
                    category: category,
                    content: content
                });

            if (error) {
                alert("Gagal membuat thread: " + error.message);
                return;
            }

            titleInput.value = "";
            contentInput.value = "";
            modal.style.display = "none";

            loadThreads();
        });
    }

    loadThreads();

});