// ============================================================
// ANALISA HARIAN (channel style) - assets/js/analisa.js
// Hanya admin yang bisa posting dan mengedit. Pengunjung hanya bisa like.
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
    const modalTitleEl = modal.querySelector("h3");
    const cancelBtn = document.getElementById("cnlCancelBtn");
    const submitBtn = document.getElementById("cnlSubmitBtn");
    const captionInput = document.getElementById("cnlCaptionInput");
    const uploadBox = document.getElementById("cnlUploadBox");
    const fileInput = document.getElementById("cnlFileInput");
    const previewGrid = document.getElementById("cnlPreviewGrid");
    const lightboxEl = document.getElementById("cnlLightbox");

    let selectedFiles = [];   // foto baru yang dipilih di modal
    let editingPost = null;   // null = mode posting baru, terisi = mode edit
    let keptImages = [];      // mode edit: foto lama yang dipertahankan
    let removedImages = [];   // mode edit: foto lama yang akan dihapus saat simpan

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

    // Baca arah (bearish/bullish) dan level harga ($4235, dst) dari caption
    function analyzePost(caption) {
        const text = (caption || "").toLowerCase();
        let bias = "netral";
        const iBear = text.indexOf("bearish");
        const iBull = text.indexOf("bullish");
        if (iBear !== -1 && (iBull === -1 || iBear < iBull)) bias = "bearish";
        else if (iBull !== -1) bias = "bullish";
        const levels = [...new Set(((caption || "").match(/\$\s?\d[\d.,]*/g) || []).map(l => l.replace(/[.,]+$/, "")))].slice(0, 4);
        return { bias, levels };
    }

    // Ambil path file di storage dari URL publik (untuk menghapus foto lama)
    function storagePathFromUrl(url) {
        const marker = "/channel-images/";
        const str = String(url || "");
        const i = str.indexOf(marker);
        if (i === -1) return null;
        return decodeURIComponent(str.slice(i + marker.length).split("?")[0]);
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
    // FILTER (Semua / Bearish / Bullish)
    // ==========================================
    const filtersEl = document.getElementById("cnlFilters");
    if (filtersEl) {
        filtersEl.addEventListener("click", (e) => {
            const btn = e.target.closest(".cnl-filter");
            if (!btn) return;
            document.querySelectorAll(".cnl-filter").forEach((b) => b.classList.toggle("active", b === btn));
            const f = btn.dataset.filter;
            document.querySelectorAll(".cnl-post").forEach((p) => {
                p.hidden = !(f === "all" || p.dataset.bias === f);
            });
        });
    }

    // ==========================================
    // MODAL POST BARU / EDIT POST (admin)
    // ==========================================
    function resetModal() {
        captionInput.value = "";
        selectedFiles = [];
        editingPost = null;
        keptImages = [];
        removedImages = [];
        previewGrid.innerHTML = "";
        fileInput.value = "";
    }

    // post = null -> posting baru, post = objek -> edit post tersebut
    function openModal(post) {
        resetModal();

        if (post) {
            editingPost = post;
            captionInput.value = post.caption || "";
            keptImages = post.images.slice();
            modalTitleEl.textContent = "Edit Update Analisa";
            submitBtn.textContent = "Simpan";
        } else {
            modalTitleEl.textContent = "Update Analisa Baru";
            submitBtn.textContent = "Posting";
        }

        renderPreviews();
        modal.style.display = "flex";
    }

    function renderPreviews() {
        previewGrid.innerHTML = "";

        // Foto lama (mode edit)
        keptImages.forEach((img) => {
            const item = document.createElement("div");
            item.className = "cnl-preview-item";
            item.innerHTML = `<img src="${escapeHtml(img.image_url)}" alt="foto lama"><span class="cnl-preview-remove">&times;</span>`;
            item.querySelector(".cnl-preview-remove").addEventListener("click", () => {
                removedImages.push(img);
                keptImages = keptImages.filter((i) => i !== img);
                renderPreviews();
            });
            previewGrid.appendChild(item);
        });

        // Foto baru
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
            openModal(null);
        });
    }

    if (cancelBtn) {
        cancelBtn.addEventListener("click", () => { modal.style.display = "none"; });
    }

    if (submitBtn) {
        submitBtn.addEventListener("click", async () => {
            const caption = captionInput.value.trim();
            const isEdit = !!editingPost;
            const idleLabel = isEdit ? "Simpan" : "Posting";

            if (!caption && selectedFiles.length === 0 && keptImages.length === 0) {
                alert("Isi caption atau lampirkan minimal satu foto.");
                return;
            }

            submitBtn.disabled = true;
            submitBtn.textContent = isEdit ? "Menyimpan..." : "Memposting...";

            try {
                let postId;
                let startOrder = 0;

                if (isEdit) {
                    postId = editingPost.id;

                    const { data: updated, error: updateError } = await supabaseClient
                        .from("channel_posts")
                        .update({ caption: caption || null })
                        .eq("id", postId)
                        .select("id");

                    if (updateError) throw updateError;
                    if (!updated || updated.length === 0) {
                        throw new Error("Tidak ada izin untuk mengedit post ini.");
                    }

                    startOrder = keptImages.reduce((max, i) => Math.max(max, i.sort_order ?? 0), -1) + 1;
                } else {
                    postId = crypto.randomUUID();

                    const { error: postError } = await supabaseClient
                        .from("channel_posts")
                        .insert({ id: postId, admin_id: user.id, caption: caption || null });

                    if (postError) throw postError;
                }

                // Upload foto baru
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
                        .insert({ post_id: postId, image_url: publicUrlData.publicUrl, sort_order: startOrder + i });

                    if (imgError) throw imgError;
                }

                // Hapus foto lama yang dibuang (mode edit)
                for (const img of removedImages) {
                    const { data: deleted, error: delError } = await supabaseClient
                        .from("channel_post_images")
                        .delete()
                        .eq("id", img.id)
                        .select("id");

                    if (delError) throw delError;
                    if (!deleted || deleted.length === 0) {
                        throw new Error("Tidak ada izin untuk menghapus foto lama.");
                    }

                    const oldPath = storagePathFromUrl(img.image_url);
                    if (oldPath) {
                        await supabaseClient.storage.from("channel-images").remove([oldPath]);
                    }
                }

                modal.style.display = "none";
                resetModal();
                await loadPosts();

            } catch (err) {
                alert((isEdit ? "Gagal menyimpan: " : "Gagal memposting: ") + err.message);
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = idleLabel;
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
        const info = analyzePost(post.caption);

        const el = document.createElement("article");
        el.className = "cnl-post" + (post.images.length ? "" : " no-media") + (post.isLatest ? " is-latest" : "");
        el.dataset.bias = info.bias;

        el.innerHTML = `
            ${post.images.length > 0 ? `
                <div class="cnl-media">
                    <div class="cnl-carousel">
                        <div class="cnl-carousel-track"></div>
                        ${post.images.length > 1 ? `<div class="cnl-carousel-dots"></div>` : ''}
                    </div>
                    <small class="cnl-zoom-hint"><i class="fa-solid fa-magnifying-glass-plus"></i> Klik chart untuk memperbesar</small>
                </div>
            ` : ''}

            <div class="cnl-body">
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
                            <i class="fa-solid fa-pen-to-square cnl-edit-btn" title="Edit"></i>
                            <i class="fa-solid fa-trash cnl-delete-btn" title="Hapus"></i>
                        </div>
                    ` : ''}
                </div>

                ${(post.isLatest || info.bias !== "netral") ? `
                    <div class="cnl-tags">
                        ${post.isLatest ? `<span class="cnl-tag cnl-tag--latest">Terbaru</span>` : ''}
                        ${info.bias !== "netral" ? `<span class="cnl-tag cnl-tag--${info.bias}">${info.bias === "bearish" ? "Bearish" : "Bullish"}</span>` : ''}
                    </div>
                ` : ''}

                ${post.caption ? `<p class="cnl-post-caption"></p>` : ''}

                ${info.levels.length ? `<div class="cnl-levels">${info.levels.map((l) => `<span>${escapeHtml(l)}</span>`).join("")}</div>` : ''}

                <div class="cnl-post-footer">
                    <span class="cnl-like-btn">
                        <i class="fa-${post.isLiked ? 'solid' : 'regular'} fa-heart" style="${post.isLiked ? 'color:#e11d48;' : ''}"></i>
                        <span class="cnl-like-count">${post.likeCount}</span>
                    </span>
                </div>
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

        // Edit
        const editBtn = el.querySelector(".cnl-edit-btn");
        if (editBtn) {
            editBtn.addEventListener("click", () => openModal(post));
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
        posts.forEach((post, index) => {
            const profile = profilesMap[post.admin_id];
            const enriched = {
                ...post,
                isLatest: index === 0,
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


// ============================================================
// BANNER IKLAN SIDEBAR KANAN (gambar + video)
// Hanya bagian PENGATURAN di bawah ini yang perlu Anda ubah.
// ============================================================

// ---------- PENGATURAN ----------

// Tulisan kecil di pojok kiri atas banner. Isi "" jika tidak ingin ada tulisan.
const CFX_AD_LABEL = "Iklan";

// Daftar iklan. Tampil bergantian sesuai urutan di bawah ini.
//   type     : "image" atau "video"
//   src      : lokasi file gambar atau video (mp4)
//   link     : alamat tujuan saat banner / tombol diklik (harus diawali https://)
//   cta      : tulisan tombol emas di bawah banner ("" = tanpa tombol)
//   label    : (opsional) tulisan pojok kiri atas khusus iklan ini, menimpa CFX_AD_LABEL
//   alt      : deskripsi singkat iklan (untuk aksesibilitas)
//   poster   : (opsional, video) gambar sampul sebelum video diputar
//   duration : (opsional, gambar) lama tampil dalam milidetik, 6000 = 6 detik
//   newTab   : (opsional) false = buka link di tab yang sama, default membuka tab baru
//   start    : (opsional) iklan baru tampil mulai waktu ini, contoh "2026-10-02T00:00:00+07:00"
//   end      : (opsional) iklan otomatis berhenti tampil setelah waktu ini, contoh "2026-10-03T00:00:00+07:00"
const CFX_ADS = [
    {
        type: "image",
        src: "assets/images/ads/NFP-9x16-1080x1920.png",
        link: "https://cfxpros.com/analisa.html",
        cta: "Analisa Harian",
        label: "Iklan",
        alt: "Banner NFP",
        duration: 6000
    },
    {
        type: "video",
        src: "assets/videos/promo.oktober.mp4",
        link: "https://cfxpros.com/landingpage.html",
        cta: "Ambil Promo",
        label: "Iklan",
        alt: "Promo Oktober"
    }
];

// ---------- PROGRAM (tidak perlu diubah) ----------
(function () {
    "use strict";

    var DEFAULT_IMAGE_MS = 6000;     // lama tampil gambar jika duration tidak diisi
    var VIDEO_START_MS = 10000;      // video dilewati jika belum mulai diputar dalam waktu ini

    function init() {
        var root = document.getElementById("cnlAd");
        if (!root) return;

        // Hanya terima URL http/https atau path relatif (cegah javascript: dll)
        function safeUrl(u) {
            try {
                var url = new URL(String(u || ""), window.location.href);
                return (url.protocol === "http:" || url.protocol === "https:") ? url.href : "";
            } catch (e) { return ""; }
        }

        // Cek jadwal tayang (start / end), jika diisi
        function inSchedule(a) {
            var now = Date.now(), t;
            if (a.start) { t = Date.parse(a.start); if (!isNaN(t) && now < t) return false; }
            if (a.end)   { t = Date.parse(a.end);   if (!isNaN(t) && now > t) return false; }
            return true;
        }

        var ads = (Array.isArray(CFX_ADS) ? CFX_ADS : []).filter(function (a) {
            return a && (a.type === "image" || a.type === "video") && safeUrl(a.src) && inSchedule(a);
        });
        if (!ads.length) return;        // tidak ada iklan aktif: kolom banner tetap tersembunyi

        var n = ads.length;
        var idx = 0;
        var timer = null;
        var failCount = 0;              // gagal berturut-turut; jika semua gagal banner disembunyikan
        var muted = true;               // pilihan suara dipertahankan antar video
        var currentEl = null;           // elemen gambar / video yang sedang tampil
        var currentVideo = null;
        var currentIsImage = false;
        var hovering = false;

        // ---------- Susun elemen ----------
        root.textContent = "";
        var card = document.createElement("div");
        card.className = "cnl-ad-card";

        var stage = document.createElement("div");
        stage.className = "cnl-ad-stage";

        var badge = document.createElement("span");
        badge.className = "cnl-ad-badge";

        var link = document.createElement("a");
        link.className = "cnl-ad-link";
        link.rel = "noopener sponsored";

        var muteBtn = document.createElement("button");
        muteBtn.type = "button";
        muteBtn.className = "cnl-ad-mute";
        muteBtn.hidden = true;

        var dots = document.createElement("div");
        dots.className = "cnl-ad-dots";

        stage.append(badge, link, muteBtn, dots);

        var cta = document.createElement("a");
        cta.className = "cnl-ad-cta";
        cta.rel = "noopener sponsored";

        card.append(stage, cta);
        root.appendChild(card);

        if (n > 1) {
            ads.forEach(function (_, i) {
                var d = document.createElement("button");
                d.type = "button";
                d.setAttribute("aria-label", "Iklan " + (i + 1));
                d.addEventListener("click", function () { show(i); });
                dots.appendChild(d);
            });
        }

        function renderMuteIcon() {
            muteBtn.innerHTML = muted
                ? '<i class="fa-solid fa-volume-xmark"></i>'
                : '<i class="fa-solid fa-volume-high"></i>';
            muteBtn.setAttribute("aria-label", muted ? "Nyalakan suara" : "Matikan suara");
        }
        muteBtn.addEventListener("click", function () {
            muted = !muted;
            if (currentVideo) currentVideo.muted = muted;
            renderMuteIcon();
        });
        renderMuteIcon();

        // ---------- Tampilkan satu iklan ----------
        function clearMedia() {
            clearTimeout(timer);
            timer = null;
            stage.querySelectorAll("img, video").forEach(function (el) {
                if (el.tagName === "VIDEO") { el.pause(); el.removeAttribute("src"); el.load(); }
                el.remove();
            });
            currentEl = null;
            currentVideo = null;
        }

        function next() { show((idx + 1) % n); }

        function startImageTimer(ms) {
            clearTimeout(timer);
            timer = null;
            if (n > 1 && !hovering) timer = setTimeout(next, ms || DEFAULT_IMAGE_MS);
        }

        function onFail() {
            failCount++;
            if (failCount >= n) { root.hidden = true; clearMedia(); return; }   // semua gagal: sembunyikan
            if (n > 1) next();
        }

        function show(i) {
            idx = i;
            var ad = ads[idx];
            clearMedia();

            // Tulisan kecil di pojok kiri atas
            var labelText = (typeof ad.label === "string") ? ad.label : CFX_AD_LABEL;
            badge.textContent = labelText;
            badge.hidden = !labelText;

            // Link + tombol
            var href = safeUrl(ad.link);
            var target = (ad.newTab === false) ? "_self" : "_blank";
            if (href) {
                link.href = href; link.target = target;
                link.style.display = "";
                link.setAttribute("aria-label", ad.alt || "Iklan");
            } else {
                link.removeAttribute("href");
                link.style.display = "none";
            }
            if (ad.cta && href) { cta.hidden = false; cta.href = href; cta.target = target; cta.textContent = ad.cta; }
            else { cta.hidden = true; }

            Array.prototype.forEach.call(dots.children, function (d, k) {
                d.classList.toggle("active", k === idx);
            });

            if (ad.type === "image") {
                currentIsImage = true;
                muteBtn.hidden = true;

                var img = document.createElement("img");
                img.alt = ad.alt || "Iklan";
                img.decoding = "async";
                img.addEventListener("load", function () { if (currentEl === img) failCount = 0; });
                img.addEventListener("error", function () { if (currentEl === img) onFail(); });
                img.src = safeUrl(ad.src);
                stage.insertBefore(img, badge);
                currentEl = img;

                startImageTimer(ad.duration);
            } else {
                currentIsImage = false;
                muteBtn.hidden = false;

                var v = document.createElement("video");
                v.muted = muted;
                v.defaultMuted = true;           // wajib agar autoplay diizinkan browser
                v.autoplay = true;
                v.playsInline = true;
                v.setAttribute("playsinline", "");
                v.loop = (n === 1);              // satu iklan saja: ulang terus
                v.preload = "auto";
                if (ad.poster && safeUrl(ad.poster)) v.poster = safeUrl(ad.poster);
                v.setAttribute("aria-label", ad.alt || "Iklan video");

                v.addEventListener("playing", function () {
                    if (currentEl !== v) return;
                    failCount = 0;
                    clearTimeout(timer);         // video sudah jalan, batalkan batas waktu mulai
                    timer = null;
                });
                v.addEventListener("ended", function () { if (currentEl === v && n > 1) next(); });
                v.addEventListener("error", function () { if (currentEl === v) onFail(); });

                v.src = safeUrl(ad.src);
                stage.insertBefore(v, badge);
                currentEl = v;
                currentVideo = v;

                // Jika video tidak kunjung mulai (koneksi lambat), lanjut ke iklan berikutnya
                if (n > 1) timer = setTimeout(next, VIDEO_START_MS);

                var p = v.play();
                if (p && p.catch) {
                    p.catch(function () {
                        // Autoplay ditolak browser: tampilkan poster lalu lanjut seperti gambar
                        if (currentEl === v && n > 1) startImageTimer(ad.duration);
                    });
                }
            }
        }

        // Gambar: jeda pergantian saat kursor mouse di atas banner (tidak berlaku untuk layar sentuh)
        card.addEventListener("pointerenter", function (e) {
            if (e.pointerType !== "mouse") return;
            hovering = true;
            if (currentIsImage) { clearTimeout(timer); timer = null; }
        });
        card.addEventListener("pointerleave", function (e) {
            if (e.pointerType !== "mouse") return;
            hovering = false;
            if (currentIsImage && !timer) startImageTimer(ads[idx].duration);
        });

        // Hemat data & baterai: jeda saat tab tidak aktif
        document.addEventListener("visibilitychange", function () {
            if (document.hidden) {
                clearTimeout(timer); timer = null;
                if (currentVideo) currentVideo.pause();
            } else if (currentVideo) {
                var p = currentVideo.play();
                if (p && p.catch) p.catch(function () {});
            } else if (currentIsImage && !timer) {
                startImageTimer(ads[idx].duration);
            }
        });

        root.hidden = false;
        show(0);
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
    else init();
})();