// ============================================
// FORUM PAGE LOGIC (versi Thread)
// Alur: Cek login -> Ambil semua thread + data penulisnya ->
//       Tampilkan sebagai thread-card -> Filter kategori ->
//       Buat thread baru lewat modal
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

    function renderThread(thread) {
        const authorName = thread.profiles?.full_name || thread.profiles?.username || "Pengguna";
        const authorAvatar = thread.profiles?.avatar_url || "assets/images/avatar/default-avatar.png";

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
                </div>
                <span class="thread-tag"></span>
                <h3 class="thread-title"></h3>
                <p class="thread-preview"></p>
                <div class="thread-footer">
                    <span>💬 0 Balasan</span>
                    <span>👍 0 Like</span>
                    <span>👁 0 Views</span>
                </div>
            </div>
        `;

        // Pakai textContent (aman dari XSS) untuk data yang diketik user
        article.querySelector(".thread-author").textContent = authorName;
        article.querySelector(".thread-tag").textContent = (thread.category || "gold").toUpperCase();
        article.querySelector(".thread-title").textContent = thread.title || "(Tanpa judul)";
        article.querySelector(".thread-preview").textContent = thread.content;

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
            .select("id, user_id, title, content, category, created_at, profiles(full_name, username, avatar_url)")
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

            // Reset form & tutup modal
            titleInput.value = "";
            contentInput.value = "";
            modal.style.display = "none";

            loadThreads();
        });
    }

    // Muat thread pertama kali halaman dibuka
    loadThreads();

});