(() => {
    "use strict";

    function byId(id) {
        return document.getElementById(id);
    }

    function formatDate(iso) {
        return new Date(iso).toLocaleDateString("id-ID", {
            day: "2-digit", month: "long", year: "numeric"
        });
    }

    function estimateReadTime(content) {
        const words = (content || "").trim().split(/\s+/).filter(Boolean).length;
        const minutes = Math.max(1, Math.round(words / 200));
        return `${minutes} menit baca`;
    }

    // Escape HTML dulu (jaga-jaga), baru pecah jadi paragraf
    // berdasarkan baris kosong, dan baris tunggal jadi <br>.
    function renderContent(raw) {
        const escaped = (raw || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");

        const paragraphs = escaped.split(/\n\s*\n/).map((block) => block.trim()).filter(Boolean);

        if (paragraphs.length === 0) {
            return "<p>Artikel ini belum punya isi.</p>";
        }

        return paragraphs.map((block) => `<p>${block.replace(/\n/g, "<br>")}</p>`).join("");
    }

    async function loadArticle() {
        const params = new URLSearchParams(window.location.search);
        const slug = params.get("slug");

        const loadingState = byId("loadingState");
        const notFoundState = byId("notFoundState");
        const content = byId("articleContent");

        if (!slug) {
            loadingState.hidden = true;
            notFoundState.hidden = false;
            return;
        }

        const { data: article, error } = await supabaseClient
            .from("articles")
            .select("title, slug, excerpt, content, category, cover_image, created_at, status")
            .eq("slug", slug)
            .eq("status", "published")
            .maybeSingle();

        if (error || !article) {
            loadingState.hidden = true;
            notFoundState.hidden = false;
            return;
        }

        document.title = `${article.title} | Cyber Prosperity`;
        byId("pageTitle").textContent = `${article.title} | Cyber Prosperity`;

        byId("breadcrumbTitle").textContent = article.title;
        byId("articleCategory").textContent = article.category;
        byId("articleDate").textContent = formatDate(article.created_at);
        byId("articleReadTime").textContent = estimateReadTime(article.content);
        byId("articleTitle").textContent = article.title;
        byId("articleBody").innerHTML = renderContent(article.content);

        const coverWrap = byId("articleCoverWrap");
        const cover = byId("articleCover");
        if (article.cover_image) {
            cover.src = article.cover_image;
            cover.alt = article.title;
            cover.onerror = () => { coverWrap.hidden = true; };
        } else {
            coverWrap.hidden = true;
        }

        loadingState.hidden = true;
        content.hidden = false;
    }

    document.addEventListener("DOMContentLoaded", () => {
        loadArticle().catch((err) => {
            console.error("Gagal memuat artikel:", err);
            byId("loadingState").hidden = true;
            byId("notFoundState").hidden = false;
        });
    });
})();