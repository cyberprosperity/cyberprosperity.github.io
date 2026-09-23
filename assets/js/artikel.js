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
            .select("id, title, slug, excerpt, content, category, cover_image, created_at, is_featured, view_count")
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

                renderFeatured();
                renderCategories();
                renderArticles();
                renderMostRead();
                renderArticleListPanel();
    }

    // ============================================
    // LIST ARTIKEL (sidebar, prev/next)
    // Diurutkan berdasarkan tanggal rilis.
    // ============================================

    let articleListPage = 0;
    const ARTICLE_LIST_PAGE_SIZE = 5;

    function renderArticleListPanel() {
        const wrap = byId("articleListItems");
        const prevBtn = byId("articleListPrev");
        const nextBtn = byId("articleListNext");
        const pageInfo = byId("articleListPageInfo");
        if (!wrap || !prevBtn || !nextBtn || !pageInfo) return;

        const sorted = [...articles].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        const totalPages = Math.max(1, Math.ceil(sorted.length / ARTICLE_LIST_PAGE_SIZE));

        if (articleListPage >= totalPages) articleListPage = totalPages - 1;
        if (articleListPage < 0) articleListPage = 0;

        const start = articleListPage * ARTICLE_LIST_PAGE_SIZE;
        const pageItems = sorted.slice(start, start + ARTICLE_LIST_PAGE_SIZE);

        if (pageItems.length === 0) {
            wrap.innerHTML = `<p style="color:#94A3B8; font-size:13px; margin:0;">Belum ada artikel.</p>`;
        } else {
            wrap.innerHTML = pageItems.map((article) => `
                <button type="button" data-slug="${article.slug}">
                    ${article.title}
                    <small>${article.dateLabel}</small>
                </button>
            `).join("");

            wrap.querySelectorAll("[data-slug]").forEach((button) => {
                button.addEventListener("click", () => {
                    window.location.href = "artikel-detail.html?slug=" + encodeURIComponent(button.dataset.slug);
                });
            });
        }

        pageInfo.textContent = `${articleListPage + 1} / ${totalPages}`;
        prevBtn.disabled = articleListPage === 0;
        nextBtn.disabled = articleListPage >= totalPages - 1;
    }

    function setupArticleListPagination() {
        const prevBtn = byId("articleListPrev");
        const nextBtn = byId("articleListNext");
        if (!prevBtn || !nextBtn) return;

        prevBtn.addEventListener("click", () => {
            articleListPage -= 1;
            renderArticleListPanel();
        });

        nextBtn.addEventListener("click", () => {
            articleListPage += 1;
            renderArticleListPanel();
        });
    }

    // ============================================
    // MOST READ
    // ============================================

    function renderMostRead() {
        const wrap = byId("mostReadList");
        if (!wrap) return;

        const top = [...articles]
            .sort((a, b) => (b.view_count || 0) - (a.view_count || 0) || new Date(b.created_at) - new Date(a.created_at))
            .slice(0, 3);

        if (top.length === 0) {
            wrap.innerHTML = `<p style="color:#94A3B8; font-size:13px;">Belum ada artikel.</p>`;
            return;
        }

        wrap.innerHTML = top.map((article, index) => `
            <button type="button" data-slug="${article.slug}">
                <b>0${index + 1}</b>
                <span>${article.title}<small>${article.readTime} baca</small></span>
            </button>
        `).join("");

        wrap.querySelectorAll("[data-slug]").forEach((button) => {
            button.addEventListener("click", () => {
                window.location.href = "artikel-detail.html?slug=" + encodeURIComponent(button.dataset.slug);
            });
        });
    }

    // ============================================
    // FEATURED STORY (Editor's Pick)
    // ============================================

    function renderFeatured() {
        const section = byId("featured");
        if (!section) return;

        if (articles.length === 0) {
            section.hidden = true;
            return;
        }

        const featured = articles.find((a) => a.is_featured) || articles[0];
        section.hidden = false;

        const img = featured.cover_image
            ? `<img src="${featured.cover_image}" alt="${featured.title}" class="featured-img" onerror="this.style.display='none'">`
            : "";

        const visual = byId("featuredVisual");
        const badge = byId("featuredBadge");
        const meta = byId("featuredMeta");
        const title = byId("featuredTitle");
        const excerpt = byId("featuredExcerpt");
        const link = byId("featuredLink");

        if (visual) visual.innerHTML = `<span class="featured-badge" id="featuredBadge">Editor's pick</span>${img}`;
        if (meta) meta.innerHTML = `<span class="meta-dot"></span>${featured.category} <i></i> ${featured.dateLabel} <i></i> ${featured.readTime}`;
        if (title) title.textContent = featured.title;
        if (excerpt) excerpt.textContent = featured.excerpt || "";
        if (link) {
            link.onclick = () => {
                window.location.href = "artikel-detail.html?slug=" + encodeURIComponent(featured.slug);
            };
        }
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

        const visibleArticles = filtered.slice(0, 6);

        grid.innerHTML = visibleArticles.map((article) => {
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
                window.location.href = "artikel-detail.html?slug=" + encodeURIComponent(button.dataset.slug);
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
        setupArticleListPagination();
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