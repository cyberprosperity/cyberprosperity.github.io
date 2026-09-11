(() => {
    "use strict";

    // Setiap artikel punya field "image" — inilah yang bisa Anda ganti
    // kapan saja. Cukup taruh file foto Anda di assets/images/news/
    // dengan nama yang sama (atau ubah path-nya di sini).
    const articles = [
        {
            category: "Edukasi",
            date: "08 Sep 2026",
            readTime: "5 menit",
            title: "5 Kesalahan yang Sering Terjadi Saat Menentukan Ukuran Lot",
            excerpt: "Bangun proses risk management yang lebih konsisten sebelum menekan tombol entry.",
            visual: "gold",
            image: "assets/images/news/card-1.webp"
        },
        {
            category: "Komunitas",
            date: "06 Sep 2026",
            readTime: "4 menit",
            title: "Mengapa Insight Trading Tumbuh Lebih Baik di Dalam Komunitas",
            excerpt: "Perspektif yang beragam membantu trader melihat konteks, bukan sekadar sinyal.",
            visual: "blue",
            image: "assets/images/news/card-2.webp"
        },
        {
            category: "Market Insight",
            date: "04 Sep 2026",
            readTime: "7 menit",
            title: "Membaca Momentum Pasar Tanpa Terjebak FOMO",
            excerpt: "Gunakan struktur pasar dan rencana yang jelas untuk menjaga keputusan tetap rasional.",
            visual: "blue",
            image: "assets/images/news/card-3.webp"
        },
        {
            category: "Edukasi",
            date: "01 Sep 2026",
            readTime: "6 menit",
            title: "Trading Journal: Catatan Kecil untuk Performa yang Lebih Besar",
            excerpt: "Temukan pola dari keputusan Anda sendiri dengan rutinitas review yang sederhana.",
            visual: "journal",
            image: "assets/images/news/card-4.webp"
        },
        {
            category: "Broker",
            date: "29 Agu 2026",
            readTime: "3 menit",
            title: "Spread, Komisi, dan Swap: Apa Bedanya untuk Trader?",
            excerpt: "Kenali biaya trading agar Anda dapat membandingkan kondisi broker secara lebih objektif.",
            visual: "gold",
            image: "assets/images/news/card-5.webp"
        },
        {
            category: "Pengumuman",
            date: "27 Agu 2026",
            readTime: "2 menit",
            title: "Cyber Prosperity Membuka Kelas Trading untuk Member Baru",
            excerpt: "Mulai perjalanan belajar Anda bersama mentor dan trader lain dalam sesi komunitas.",
            visual: "blue",
            image: "assets/images/news/card-6.webp"
        }
    ];

    const categories = ["Semua", "Market Insight", "Edukasi", "Komunitas", "Broker", "Pengumuman"];
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
            const text = `${article.title} ${article.excerpt} ${article.category}`.toLowerCase();
            return categoryMatch && (!query || text.includes(query));
        });

        if (filtered.length === 0) {
            grid.innerHTML = `<div class="cp-empty"><h3>Artikel tidak ditemukan</h3><p>Coba gunakan kata kunci lain atau pilih kategori berbeda.</p><button class="cp-btn cp-btn-outline" id="resetFilter" type="button">Reset filter</button></div>`;
            byId("resetFilter").addEventListener("click", () => {
                activeCategory = "Semua";
                search.value = "";
                renderCategories();
                renderArticles();
            });
            return;
        }

        grid.innerHTML = filtered.map((article) => `
            <article class="news-card">
                <button class="news-card-hit" type="button" data-article="${article.title}" aria-label="Baca ${article.title}"></button>
                <div class="card-visual ${article.visual}">
                    <img src="${article.image}" alt="${article.title}" loading="lazy" onerror="this.remove()">
                </div>
                <div class="news-card-body">
                    <div class="card-topline"><span>${article.category}</span><small>${article.readTime}</small></div>
                    <h3>${article.title}</h3>
                    <p>${article.excerpt}</p>
                    <div class="card-footer"><span>${article.date}</span><b>↗</b></div>
                </div>
            </article>
        `).join("");

        grid.querySelectorAll("[data-article]").forEach((button) => {
            button.addEventListener("click", () => showToast(`${button.dataset.article} akan terhubung setelah konten production siap.`));
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
        renderCategories();
        renderArticles();
        setupNewsletter();
        setupPlaceholderActions();
        const search = byId("searchInput");
        if (search) search.addEventListener("input", renderArticles);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();