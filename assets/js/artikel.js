(() => {
    "use strict";

    // Kategori tab tetap statis (harus sama dengan pilihan
    // kategori di form admin). Daftar artikelnya sendiri
    // sekarang diambil dari Supabase, bukan ditulis manual.
    const categories = ["Semua", "Market Insight", "Edukasi", "Komunitas", "Broker", "Pengumuman"];

    let articles = [];
    let activeCategory = "Semua";
    let toastTimer;

    function byId(id) {
        return document.getElementById(id);
    }

    function showToast(message) {
        const toast = byId("toast");
        if (!toast) return;
        toast.textContent = message;
        toast.className = "cp-toast";
        window.clearTimeout(toastTimer);
        toastTimer = window.setTimeout(() => {
            toast.textContent = "";
            toast.className = "";
        }, 2600);
    }

    function formatDate(iso) {
        return new Date(iso).toLocaleDateString("id-ID", {
            day: "2-digit", month: "short", year: "numeric"
        });
    }

    function estimateReadTime(content) {
        const words = (content || "").trim().split(/\s+/).filter(Boolean).length;
        const minutes = Math.max(1, Math.round(words / 200));
        return `${minutes} menit`;
    }

    // ============================================
    // AMBIL ARTIKEL DARI SUPABASE (hanya yang published)
    // ============================================

    async function fetchArticles() {
        const grid = byId("articleGrid");
        if (grid) grid.innerHTML = `<div class="cp-empty"><h3>Memuat artikel...</h3></div>`;

        const { data, error } = await supabaseClient
            .from("articles")
            .select("id, title, slug, excerpt, content, category, cover_image, created_at")
            .eq("status", "published")
            .order("created_at", { ascending: false });

        if (error) {
            if (grid) {
                grid.innerHTML = `<div class="cp-empty"><h3>Gagal memuat artikel</h3><p>${error.message}</p></div>`;
            }
            return;
        }

        articles = (data || []).map((a) => ({
            ...a,
            readTime: estimateReadTime(a.content),
            dateLabel: formatDate(a.created_at)
        }));

        renderCategories();
        renderArticles();
    }

    function renderCategories() {
        const tabs = byId("categoryTabs");
        if (!tabs) return;

        tabs.innerHTML = categories.map((category) => {
            const active = category === activeCategory ? "active" : "";
            return `<button type="button" class="${active}" data-category="${category}">${category}</button>`;
        }).join("");

        tabs.querySelectorAll("[data-category]").forEach((button) => {
            button.addEventListener("click", () => {
                activeCategory = button.dataset.category;
                renderCategories();
                renderArticles();
            });
        });
    }

    function renderArticles() {
        const grid = byId("articleGrid");
        const search = byId("searchInput");
        if (!grid || !search) return;

        const query = search.value.trim().toLowerCase();
        const filtered = articles.filter((article) => {
            const categoryMatch = activeCategory === "Semua" || article.category === activeCategory;
            const text = `${article.title} ${article.excerpt || ""} ${article.category}`.toLowerCase();
            return categoryMatch && (!query || text.includes(query));
        });

        if (filtered.length === 0) {
            const message = articles.length === 0
                ? `<h3>Belum ada artikel</h3><p>Artikel yang kamu publish dari halaman admin akan muncul di sini.</p>`
                : `<h3>Artikel tidak ditemukan</h3><p>Coba gunakan kata kunci lain atau pilih kategori berbeda.</p><button class="cp-btn cp-btn-outline" id="resetFilter" type="button">Reset filter</button>`;
            grid.innerHTML = `<div class="cp-empty">${message}</div>`;
            const resetBtn = byId("resetFilter");
            if (resetBtn) {
                resetBtn.addEventListener("click", () => {
                    activeCategory = "Semua";
                    search.value = "";
                    renderCategories();
                    renderArticles();
                });
            }
            return;
        }

        grid.innerHTML = filtered.map((article) => {
            const img = article.cover_image
                ? `<img src="${article.cover_image}" alt="${article.title}" loading="lazy" onerror="this.remove()">`
                : "";
            return `
                <article class="news-card">
                    <button class="news-card-hit" type="button" data-slug="${article.slug}" data-title="${article.title}" aria-label="Baca ${article.title}"></button>
                    <div class="card-visual">${img}</div>
                    <div class="news-card-body">
                        <div class="card-topline"><span>${article.category}</span><small>${article.readTime}</small></div>
                        <h3>${article.title}</h3>
                        <p>${article.excerpt || ""}</p>
                        <div class="card-footer"><span>${article.dateLabel}</span><b>↗</b></div>
                    </div>
                </article>
            `;
        }).join("");

        grid.querySelectorAll("[data-slug]").forEach((button) => {
            button.addEventListener("click", () => {
                showToast(`Halaman detail untuk "${button.dataset.title}" belum dibuat — artikel penuhnya sudah tersimpan di database, tinggal halaman /artikel/[slug].html yang menyusul.`);
            });
        });
    }

    function setupNewsletter() {
        const form = byId("newsletterForm");
        const email = byId("email");
        if (!form || !email) return;

        form.addEventListener("submit", (event) => {
            event.preventDefault();
            if (!email.value.trim() || !email.value.includes("@")) {
                showToast("Masukkan alamat email yang valid.");
                email.focus();
                return;
            }
            showToast("Terima kasih. Anda berhasil mendaftar newsletter preview.");
            email.value = "";
        });
    }

    function setupPlaceholderActions() {
        document.querySelectorAll("[data-action]").forEach((element) => {
            element.addEventListener("click", () => showToast(`${element.dataset.action} akan terhubung setelah konten production siap.`));
        });
    }

    function init() {
        setupNewsletter();
        setupPlaceholderActions();
        const search = byId("searchInput");
        if (search) search.addEventListener("input", renderArticles);
        fetchArticles();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();