// ============================================
// ADMIN — KELOLA ARTIKEL
// Semua operasi (baca/tulis/hapus/upload) lewat
// supabaseClient. Keamanan sesungguhnya ada di RLS
// policy Supabase, bukan di script ini — script ini
// cuma mengurus tampilan & UX.
// ============================================

const BUCKET = "article-images";
let currentUser = null;
let editingId = null;
let pendingCoverFile = null;
let toastTimer;

function byId(id) {
    return document.getElementById(id);
}

function showToast(message, type = "success") {
    const toast = byId("toast");
    if (!toast) return;
    toast.textContent = message;
    toast.className = `admin-toast show ${type}`;
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
        toast.className = "admin-toast";
    }, 3200);
}

function slugify(text) {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_]+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
}

// ============================================
// 1. GATE — cek login + role admin sebelum apa pun tampil
// ============================================

function showGateError(message) {
    const box = document.querySelector(".admin-gate-box");
    if (!box) return;
    box.innerHTML = `
        <div style="font-size:28px;color:#f87171;">⚠</div>
        <p style="color:#fca5a5; max-width:360px; text-align:center;">${message}</p>
        <a href="../login.html" style="color:#e7c15b; font-size:13px;">Kembali ke halaman login</a>
    `;
}

function setGateStatus(text) {
    const p = document.querySelector(".admin-gate-box p");
    if (p) p.textContent = text;
}

function withTimeout(promise, ms, label) {
    return Promise.race([
        promise,
        new Promise((_, reject) => {
            window.setTimeout(() => {
                reject(new Error(`"${label}" tidak merespon lebih dari ${ms / 1000} detik. Ini kemungkinan besar koneksi ke Supabase yang bermasalah (internet, atau URL/API key di supabase-client.js salah).`));
            }, ms);
        })
    ]);
}

async function checkAdminAccess() {
    if (typeof supabaseClient === "undefined") {
        showGateError("supabaseClient tidak terbaca. Cek apakah file assets/js/supabase-client.js ada dan path-nya benar (harus ../assets/js/supabase-client.js dari dalam folder admin/).");
        return;
    }

    try {
        setGateStatus("Langkah 1: mengecek sesi login...");
        const { data: sessionData, error: sessionError } = await withTimeout(
            supabaseClient.auth.getSession(), 8000, "Cek sesi login (getSession)"
        );
        if (sessionError) throw sessionError;

        const session = sessionData.session;
        if (!session) {
            setGateStatus("Belum login, mengalihkan ke halaman login...");
            window.location.href = "../login.html";
            return;
        }

        setGateStatus("Langkah 2: sesi ditemukan, mengecek role admin...");
        const { data: profile, error: profileError } = await withTimeout(
            supabaseClient
                .from("profiles")
                .select("role, full_name, username")
                .eq("id", session.user.id)
                .maybeSingle(),
            8000, "Cek role di tabel profiles"
        );

        if (profileError) throw profileError;

        if (!profile || profile.role !== "admin") {
            showGateError(`Akun ini belum punya akses admin (role saat ini: "${profile ? profile.role : "tidak ditemukan"}"). Set role jadi "admin" di tabel profiles lewat Supabase, lalu login ulang.`);
            return;
        }

        setGateStatus("Langkah 3: akses admin dikonfirmasi, memuat halaman...");
        currentUser = session.user;

        const greeting = byId("adminGreeting");
        if (greeting) {
            const name = profile.full_name || profile.username || currentUser.email;
            greeting.textContent = `Masuk sebagai ${name}. Tambah, edit, atau hapus artikel di sini.`;
        }

        byId("gate").hidden = true;
        byId("appLayout").hidden = false;

        loadArticles();

    } catch (err) {
        console.error("Admin access check failed:", err);
        showGateError(err.message || JSON.stringify(err));
    }
}

// ============================================
// 2. DAFTAR ARTIKEL
// ============================================

async function loadArticles() {
    const listState = byId("articleListState");
    const list = byId("articleList");

    listState.hidden = false;
    listState.textContent = "Memuat artikel...";
    list.innerHTML = "";

    const { data, error } = await supabaseClient
        .from("articles")
        .select("id, title, category, status, cover_image, created_at")
        .order("created_at", { ascending: false });

    if (error) {
        listState.textContent = "Gagal memuat artikel: " + error.message;
        return;
    }

    byId("articleCount").textContent = `${data.length} artikel`;

    if (data.length === 0) {
        listState.textContent = "Belum ada artikel. Klik \"Tulis Artikel Baru\" untuk mulai.";
        return;
    }

    listState.hidden = true;

    list.innerHTML = data.map((article) => {
        const date = new Date(article.created_at).toLocaleDateString("id-ID", {
            day: "2-digit", month: "short", year: "numeric"
        });
        const badgeClass = article.status === "published" ? "admin-badge-published" : "admin-badge-draft";
        const badgeText = article.status === "published" ? "Published" : "Draft";
        const thumb = article.cover_image
            ? `<img src="${article.cover_image}" alt="">`
            : "";

        return `
            <div class="admin-article-row" data-id="${article.id}">
                <div class="admin-article-thumb">${thumb}</div>
                <div class="admin-article-info">
                    <h3>${article.title}</h3>
                    <div class="admin-article-meta">
                        <span class="admin-badge ${badgeClass}">${badgeText}</span>
                        <span>${article.category}</span>
                        <span>${date}</span>
                    </div>
                </div>
                <div class="admin-article-actions">
                    <button type="button" class="admin-btn admin-btn-outline" data-action="edit" data-id="${article.id}">Edit</button>
                    <button type="button" class="admin-btn admin-btn-danger" data-action="delete" data-id="${article.id}">Hapus</button>
                </div>
            </div>
        `;
    }).join("");

    list.querySelectorAll("[data-action='edit']").forEach((btn) => {
        btn.addEventListener("click", () => openEditForm(btn.dataset.id));
    });

    list.querySelectorAll("[data-action='delete']").forEach((btn) => {
        btn.addEventListener("click", () => deleteArticle(btn.dataset.id));
    });
}

// ============================================
// 3. FORM — buka/tutup, isi ulang, submit
// ============================================

function resetForm() {
    editingId = null;
    pendingCoverFile = null;
    byId("articleForm").reset();
    byId("articleId").value = "";
    byId("fCoverUrl").value = "";
    byId("formTitle").textContent = "Artikel Baru";
    renderCoverPreview(null);
}

function openNewForm() {
    resetForm();
    byId("formPanel").hidden = false;
    byId("formPanel").scrollIntoView({ behavior: "smooth", block: "start" });
}

async function openEditForm(id) {
    const { data: article, error } = await supabaseClient
        .from("articles")
        .select("*")
        .eq("id", id)
        .maybeSingle();

    if (error || !article) {
        showToast("Gagal memuat artikel ini: " + (error ? error.message : "tidak ditemukan"), "error");
        return;
    }

    editingId = article.id;
    pendingCoverFile = null;

    byId("formTitle").textContent = "Edit Artikel";
    byId("articleId").value = article.id;
    byId("fTitle").value = article.title || "";
    byId("fSlug").value = article.slug || "";
    byId("fCategory").value = article.category || "Edukasi";
    byId("fStatus").value = article.status || "draft";
    byId("fExcerpt").value = article.excerpt || "";
    byId("fContent").value = article.content || "";
    byId("fCoverUrl").value = article.cover_image || "";
    renderCoverPreview(article.cover_image);

    byId("formPanel").hidden = false;
    byId("formPanel").scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderCoverPreview(url) {
    const preview = byId("coverPreview");
    const removeBtn = byId("removeCoverBtn");
    if (url) {
        preview.innerHTML = `<img src="${url}" alt="">`;
        removeBtn.hidden = false;
    } else {
        preview.innerHTML = `<span>Belum ada gambar</span>`;
        removeBtn.hidden = true;
    }
}

// ============================================
// 4. UPLOAD GAMBAR
// ============================================

async function uploadCoverIfNeeded() {
    if (!pendingCoverFile) {
        return byId("fCoverUrl").value || null;
    }

    const status = byId("uploadStatus");
    status.textContent = "Mengunggah gambar...";

    const ext = pendingCoverFile.name.split(".").pop();
    const path = `covers/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { error: uploadError } = await supabaseClient
        .storage
        .from(BUCKET)
        .upload(path, pendingCoverFile, { cacheControl: "3600", upsert: false });

    if (uploadError) {
        status.textContent = "";
        throw new Error("Upload gambar gagal: " + uploadError.message);
    }

    const { data: urlData } = supabaseClient.storage.from(BUCKET).getPublicUrl(path);
    status.textContent = "Gambar berhasil diunggah.";
    return urlData.publicUrl;
}

// ============================================
// 5. SIMPAN (insert / update)
// ============================================

async function handleSubmit(event) {
    event.preventDefault();

    const saveBtn = byId("saveBtn");
    saveBtn.disabled = true;
    saveBtn.textContent = "Menyimpan...";

    try {
        const coverUrl = await uploadCoverIfNeeded();

        const payload = {
            title: byId("fTitle").value.trim(),
            slug: slugify(byId("fSlug").value.trim() || byId("fTitle").value),
            category: byId("fCategory").value,
            status: byId("fStatus").value,
            excerpt: byId("fExcerpt").value.trim(),
            content: byId("fContent").value.trim(),
            cover_image: coverUrl
        };

        if (editingId) {
            const { error } = await supabaseClient
                .from("articles")
                .update(payload)
                .eq("id", editingId);
            if (error) throw error;
            showToast("Artikel berhasil diperbarui.");
        } else {
            payload.author_id = currentUser.id;
            const { error } = await supabaseClient
                .from("articles")
                .insert(payload);
            if (error) throw error;
            showToast("Artikel baru berhasil disimpan.");
        }

        byId("formPanel").hidden = true;
        resetForm();
        loadArticles();

    } catch (err) {
        const message = err.message && err.message.includes("duplicate")
            ? "Slug ini sudah dipakai artikel lain. Ganti slug-nya."
            : (err.message || "Terjadi kesalahan.");
        showToast(message, "error");
    } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Simpan Artikel';
    }
}

// ============================================
// 6. HAPUS
// ============================================

async function deleteArticle(id) {
    if (!window.confirm("Hapus artikel ini? Tindakan ini tidak bisa dibatalkan.")) return;

    const { error } = await supabaseClient.from("articles").delete().eq("id", id);
    if (error) {
        showToast("Gagal menghapus: " + error.message, "error");
        return;
    }
    showToast("Artikel dihapus.");
    loadArticles();
}

// ============================================
// 7. EVENT SETUP
// ============================================

function setupEvents() {
    const on = (id, event, handler) => {
        const el = byId(id);
        if (el) {
            el.addEventListener(event, handler);
        } else {
            console.warn(`Elemen #${id} tidak ditemukan di HTML, tombol ini tidak akan berfungsi.`);
        }
    };

    on("newArticleBtn", "click", openNewForm);
    on("cancelFormBtn", "click", () => {
        byId("formPanel").hidden = true;
        resetForm();
    });

    on("articleForm", "submit", handleSubmit);

    // auto-slug dari judul, hanya selama slug belum diubah manual
    let slugTouched = false;
    on("fSlug", "input", () => { slugTouched = true; });
    on("fTitle", "input", (e) => {
        if (!slugTouched) byId("fSlug").value = slugify(e.target.value);
    });

    on("chooseCoverBtn", "click", () => byId("fCoverFile").click());
    on("fCoverFile", "change", (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            showToast("Ukuran gambar maksimal 5MB.", "error");
            e.target.value = "";
            return;
        }
        pendingCoverFile = file;
        renderCoverPreview(URL.createObjectURL(file));
    });

    on("removeCoverBtn", "click", () => {
        pendingCoverFile = null;
        byId("fCoverUrl").value = "";
        byId("fCoverFile").value = "";
        renderCoverPreview(null);
    });

    on("logoutBtn", "click", async (e) => {
        e.preventDefault();
        await supabaseClient.auth.signOut();
        window.location.href = "../index.html";
    });
}

document.addEventListener("DOMContentLoaded", () => {
    try {
        setupEvents();
    } catch (err) {
        console.error("setupEvents gagal:", err);
    }

    checkAdminAccess().catch((err) => {
        console.error("checkAdminAccess gagal total:", err);
        showGateError("Error tak terduga: " + (err.message || JSON.stringify(err)));
    });
});