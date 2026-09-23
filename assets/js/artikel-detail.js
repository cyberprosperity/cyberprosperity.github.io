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

    // Artikel baru (dari editor rich text) disimpan sebagai HTML
// langsung -> tampilkan apa adanya. Artikel lama (sebelum fitur
// ini ada) masih teks polos -> tetap di-parse otomatis jadi
// paragraf seperti sebelumnya, supaya artikel lama tidak perlu
// ditulis ulang.
        function renderContent(raw) {
    const text = raw || "";

    if (!text.trim()) {
        return "<p>Artikel ini belum punya isi.</p>";
    }

    const looksLikeHtml = /<\/?(p|div|h[1-6]|ul|ol|li|blockquote|figure|br|strong|em|b|i)[\s>]/i.test(text);
    if (looksLikeHtml) {
        return text;
    }

    const escaped = text
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

        // Catat kunjungan artikel ini (untuk panel "Most Read".
        supabaseClient
            .rpc("increment_article_views", { article_slug: slug })
            .then(({ error: viewError }) => {
                if (viewError) {
                    console.error("Gagal mencatat view artikel:", viewError.message);
                }
            });
    }

    document.addEventListener("DOMContentLoaded", () => {
        loadArticle().catch((err) => {
            console.error("Gagal memuat artikel:", err);
            byId("loadingState").hidden = true;
            byId("notFoundState").hidden = false;
        });
    });
})();