/* =====================================================
   CYBER PROSPERITY
   SETTINGS PAGE
===================================================== */

function compressImage(file, maxSizeBytes = 2 * 1024 * 1024, maxDimension = 1600) {
    return new Promise((resolve, reject) => {

        if (file.size <= maxSizeBytes) {
            resolve(file);
            return;
        }

        const img = new Image();
        const reader = new FileReader();

        reader.onload = (e) => {
            img.onload = () => {
                let { width, height } = img;

                if (width > maxDimension || height > maxDimension) {
                    if (width > height) {
                        height = Math.round((height * maxDimension) / width);
                        width = maxDimension;
                    } else {
                        width = Math.round((width * maxDimension) / height);
                        height = maxDimension;
                    }
                }

                const canvas = document.createElement("canvas");
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0, width, height);

                const qualitySteps = [0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3];
                let stepIndex = 0;

                function tryCompress() {
                    canvas.toBlob(
                        (blob) => {
                            if (!blob) {
                                reject(new Error("Gagal memproses gambar."));
                                return;
                            }

                            if (blob.size <= maxSizeBytes || stepIndex === qualitySteps.length - 1) {
                                const compressedFile = new File(
                                    [blob],
                                    file.name.replace(/\.[^.]+$/, "") + ".jpg",
                                    { type: "image/jpeg" }
                                );
                                resolve(compressedFile);
                                return;
                            }

                            stepIndex++;
                            tryCompress();
                        },
                        "image/jpeg",
                        qualitySteps[stepIndex]
                    );
                }

                tryCompress();
            };

            img.onerror = () => reject(new Error("Gagal membaca gambar."));
            img.src = e.target.result;
        };

        reader.onerror = () => reject(new Error("Gagal membaca file."));
        reader.readAsDataURL(file);
    });
}

/* ==========================================
   VALIDASI TIPE FILE + AUTO-COMPRESS
   Dipakai bersama oleh upload foto profil & cover
========================================== */

async function processImageUpload(file, inputEl, previewEl, maxSize = 2 * 1024 * 1024) {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
        alert("Format file harus JPG, PNG, atau WEBP.");
        inputEl.value = "";
        return null;
    }

    let finalFile = file;

    try {
        if (file.size > maxSize) {
            previewEl.style.opacity = "0.5";
            finalFile = await compressImage(file, maxSize);
            previewEl.style.opacity = "1";

            if (finalFile.size > maxSize) {
                alert(
                    "File masih terlalu besar setelah dikompres otomatis (" +
                    (finalFile.size / 1024 / 1024).toFixed(2) +
                    "MB). Coba pakai foto lain."
                );
                inputEl.value = "";
                return null;
            }
        }
    } catch (err) {
        previewEl.style.opacity = "1";
        alert("Gagal memproses gambar: " + err.message);
        inputEl.value = "";
        return null;
    }

    return finalFile;
}

/* ==========================================
   ELEMENT
========================================== */

const menuItems = document.querySelectorAll(".settings-menu-item");
const panel = document.getElementById("settings-panel");

let currentUser = null;
let currentProfile = null;

/* ==========================================
   TEMPLATE
========================================== */

const templates = {

    profile: `

    <span class="settings-subtitle">
        SETTINGS / PROFILE
    </span>

    <h2>
        Edit Profile
    </h2>

    <p>
        Informasi ini akan ditampilkan kepada seluruh member Cyber Prosperity.
    </p>

    <form class="settings-form" id="settingsProfileForm">

        <div class="settings-form-group">
            <label>Full Name</label>
            <input type="text" id="settingsFullName" placeholder="Michael Tan">
        </div>

        <div class="settings-form-group">
            <label>Username</label>
            <input type="text" id="settingsUsername" placeholder="@michael.tan">
        </div>

        <div class="settings-form-group">
            <label>Email</label>
            <input type="email" id="settingsEmail" placeholder="michael@email.com">
        </div>

        <div class="settings-form-group">
            <label>Location</label>
            <input type="text" id="settingsLocation" placeholder="Indonesia">
        </div>

        <div class="settings-form-group">
            <label>Bio</label>
            <textarea rows="5" id="settingsBio" placeholder="Ceritakan sedikit tentang Anda..."></textarea>
        </div>

        <div class="settings-action">
            <button class="settings-save-btn" type="submit">
                Save Changes
            </button>
        </div>

    </form>

    `,

    photo: `

    <span class="settings-subtitle">
        SETTINGS / PROFILE PHOTO
    </span>

    <h2>
        Change Profile Photo
    </h2>

    <p>
        Upload foto profil baru yang akan ditampilkan kepada seluruh member Cyber Prosperity.
        Foto besar akan otomatis dikompres agar muat (maks 2MB).
    </p>

    <div class="profile-photo-wrapper">
        <img src="assets/images/avatar/default-avatar.png" id="profilePreview" class="profile-photo-preview" alt="Profile Photo">
    </div>

    <div class="settings-form">

        <div class="photo-layout">

            <div class="photo-left">

                <div class="settings-action">

                    <button class="settings-save-btn" type="button" id="photoSaveBtn">
                        <i class="fa-solid fa-upload"></i>
                        Upload Photo
                    </button>

                    <button class="settings-cancel-btn" type="button" id="photoRemoveBtn">
                        Remove Current Photo
                    </button>

                </div>

            </div>

            <div class="photo-right">

                <label class="upload-box" for="photoUpload">
                    <i class="fa-solid fa-upload"></i>
                    <span>Klik untuk upload atau drag file ke sini</span>
                </label>

                <input id="photoUpload" type="file" accept="image/*" hidden>

            </div>

        </div>

    </div>

    `,

    cover: `

    <span class="settings-subtitle">
        SETTINGS / COVER PHOTO
    </span>

    <h2>
        Change Cover Photo
    </h2>

    <p>
        Upload cover photo baru untuk profil Cyber Prosperity Anda.
        Foto besar akan otomatis dikompres agar muat (maks 2MB).
    </p>

    <div class="cover-photo-wrapper">
        <img src="assets/images/cover/default-cover.jpg" id="coverPreview" class="cover-photo-preview" alt="Cover Photo">
    </div>

    <div class="settings-form">

        <div class="settings-form-group">
            <label>Upload New Cover Photo</label>
            <input type="file" id="coverUpload" accept="image/*">
        </div>

        <div class="settings-action">
            <button class="settings-save-btn" type="button" id="coverSaveBtn">
                Save Cover
            </button>

            <button class="settings-cancel-btn" type="button" id="coverCancelBtn">
                Cancel
            </button>
        </div>

    </div>

    `,

    password: `

    <span class="settings-subtitle">
        SETTINGS / PASSWORD
    </span>

    <h2>
        Change Password
    </h2>

    <p>
        Perbarui password akun Anda secara berkala untuk menjaga keamanan akun.
    </p>

    <form class="settings-form" id="settingsPasswordForm">

        <div class="settings-form-group">
            <label>Current Password</label>
            <input type="password" id="settingsCurrentPassword" placeholder="Current Password">
        </div>

        <div class="settings-form-group">
            <label>New Password</label>
            <input type="password" id="settingsNewPassword" placeholder="New Password">
        </div>

        <div class="settings-form-group">
            <label>Confirm Password</label>
            <input type="password" id="settingsConfirmPassword" placeholder="Confirm Password">
        </div>

        <div class="settings-action">
            <button class="settings-save-btn" type="submit">
                Update Password
            </button>
        </div>

    </form>

    `,

    privacy: `

    <span class="settings-subtitle">
        SETTINGS / PRIVACY
    </span>

    <h2>
        Privacy
    </h2>

    <p>
        Kelola pengaturan privasi akun Cyber Prosperity Anda.
    </p>

    <form class="settings-form">

        <div class="settings-form-group">
            <label>
                <input type="checkbox" checked>
                Show Profile Publicly
            </label>
        </div>

        <div class="settings-form-group">
            <label>
                <input type="checkbox" checked>
                Allow Other Members to Message Me
            </label>
        </div>

        <div class="settings-form-group">
            <label>
                <input type="checkbox">
                Hide My Online Status
            </label>
        </div>

        <div class="settings-action">
            <button class="settings-save-btn" type="button">
                Save Privacy
            </button>
        </div>

    </form>

    `,

    notification: `

    <span class="settings-subtitle">
        SETTINGS / NOTIFICATIONS
    </span>

    <h2>
        Notifications
    </h2>

    <p>
        Kelola notifikasi akun Cyber Prosperity Anda.
    </p>

    <form class="settings-form">

        <div class="settings-form-group">
            <label>
                <input type="checkbox" checked>
                Email Notifications
            </label>
        </div>

        <div class="settings-form-group">
            <label>
                <input type="checkbox" checked>
                Push Notifications
            </label>
        </div>

        <div class="settings-form-group">
            <label>
                <input type="checkbox">
                SMS Notifications
            </label>
        </div>

        <div class="settings-action">
            <button class="settings-save-btn" type="button">
                Save Notification
            </button>
        </div>

    </form>

    `,

    language: `

    <span class="settings-subtitle">
        SETTINGS / LANGUAGE
    </span>

    <h2>
        Language
    </h2>

    <p>
        Pilih bahasa yang ingin digunakan pada platform Cyber Prosperity.
    </p>

    <form class="settings-form">

        <div class="settings-form-group">
            <label>Language</label>
            <select>
                <option>Bahasa Indonesia</option>
                <option>English</option>
            </select>
        </div>

        <div class="settings-action">
            <button class="settings-save-btn" type="button">
                Save Language
            </button>
        </div>

    </form>

    `
};

/* ==========================================
   INIT — cek login & ambil data profil
========================================== */

async function initSettings() {

    const { data: { session } } = await supabaseClient.auth.getSession();

    if (!session) {
        window.location.href = "login.html";
        return;
    }

    currentUser = session.user;

    const { data: profileData, error } = await supabaseClient
        .from("profiles")
        .select("full_name, username, avatar_url, cover_url, bio, location, phone")
        .eq("id", currentUser.id)
        .single();

    if (!error) {
        currentProfile = profileData;
    } else {
        console.error("Gagal memuat profil:", error.message);
        currentProfile = {};
    }

    bindMenuEvents();
    loadPanel("profile");
}

/* ==========================================
   LOAD PANEL
========================================== */

function loadPanel(tab) {

    if (!templates[tab]) return;

    panel.innerHTML = templates[tab];

    if (tab === "profile") activateProfileForm();
    if (tab === "photo") activatePhotoUpload();
    if (tab === "cover") activateCoverUpload();
    if (tab === "password") activatePasswordForm();
}

/* ==========================================
   MENU CLICK
========================================== */

function bindMenuEvents() {
    menuItems.forEach((item) => {
        item.addEventListener("click", function () {
            menuItems.forEach((btn) => btn.classList.remove("active"));
            this.classList.add("active");
            loadPanel(this.dataset.tab);
        });
    });
}

/* ==========================================
   EDIT PROFILE — isi form & simpan
========================================== */

function activateProfileForm() {

    const form = document.getElementById("settingsProfileForm");
    if (!form) return;

    const fullNameInput = document.getElementById("settingsFullName");
    const usernameInput = document.getElementById("settingsUsername");
    const emailInput    = document.getElementById("settingsEmail");
    const locationInput = document.getElementById("settingsLocation");
    const bioInput      = document.getElementById("settingsBio");

    fullNameInput.value = currentProfile?.full_name || "";
    usernameInput.value = currentProfile?.username || "";
    locationInput.value = currentProfile?.location || "";
    bioInput.value       = currentProfile?.bio || "";
    emailInput.value     = currentUser?.email || "";

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const saveBtn = form.querySelector(".settings-save-btn");
        const originalText = saveBtn.textContent;
        saveBtn.disabled = true;
        saveBtn.textContent = "Menyimpan...";

        const payload = {
            full_name: fullNameInput.value.trim(),
            username: usernameInput.value.trim(),
            location: locationInput.value.trim(),
            bio: bioInput.value.trim()
        };

        const { error } = await supabaseClient
            .from("profiles")
            .update(payload)
            .eq("id", currentUser.id);

        saveBtn.disabled = false;
        saveBtn.textContent = originalText;

        if (error) {
            alert("Gagal menyimpan perubahan: " + error.message);
            return;
        }

        currentProfile = { ...currentProfile, ...payload };

        const newEmail = emailInput.value.trim();

        if (newEmail && newEmail !== currentUser.email) {
            const { error: emailError } = await supabaseClient.auth.updateUser({ email: newEmail });

            if (emailError) {
                alert("Profil tersimpan, tapi gagal mengubah email: " + emailError.message);
                return;
            }

            alert("Profil tersimpan. Cek email baru Anda untuk konfirmasi perubahan email.");
            return;
        }

        alert("Perubahan berhasil disimpan.");
    });
}

/* ==========================================
   PROFILE PHOTO — preview & upload ke Supabase
   (dengan auto-compress kalau file > 2MB)
========================================== */

function activatePhotoUpload() {

    const upload = document.getElementById("photoUpload");
    const preview = document.getElementById("profilePreview");
    const saveBtn = document.getElementById("photoSaveBtn");
    const removeBtn = document.getElementById("photoRemoveBtn");

    if (!upload || !preview) return;

    preview.src = currentProfile?.avatar_url || "assets/images/avatar/default-avatar.png";

    let selectedFile = null;

    upload.addEventListener("change", async function () {
        const file = this.files[0];
        if (!file) return;

        const processed = await processImageUpload(file, this, preview);
        if (!processed) return;

        selectedFile = processed;

        const reader = new FileReader();
        reader.onload = (e) => { preview.src = e.target.result; };
        reader.readAsDataURL(selectedFile);
    });

    if (saveBtn) {
        saveBtn.addEventListener("click", async () => {

            if (!selectedFile) {
                alert("Pilih foto terlebih dahulu.");
                return;
            }

            saveBtn.disabled = true;
            saveBtn.innerHTML = "Mengunggah...";

            const ext = selectedFile.name.split(".").pop();
            const path = `${currentUser.id}/avatar-${Date.now()}.${ext}`;

            const { error: uploadError } = await supabaseClient
                .storage.from("avatars")
                .upload(path, selectedFile, { upsert: true, contentType: selectedFile.type });

            if (uploadError) {
                alert("Gagal mengunggah foto: " + uploadError.message);
                saveBtn.disabled = false;
                saveBtn.innerHTML = '<i class="fa-solid fa-upload"></i> Upload Photo';
                return;
            }

            const { data: publicUrlData } = supabaseClient
                .storage.from("avatars")
                .getPublicUrl(path);

            const newAvatarUrl = publicUrlData.publicUrl;

            const { error: updateError } = await supabaseClient
                .from("profiles")
                .update({ avatar_url: newAvatarUrl })
                .eq("id", currentUser.id);

            saveBtn.disabled = false;
            saveBtn.innerHTML = '<i class="fa-solid fa-upload"></i> Upload Photo';

            if (updateError) {
                alert("Foto terupload, tapi gagal menyimpan ke profil: " + updateError.message);
                return;
            }

            currentProfile.avatar_url = newAvatarUrl;
            selectedFile = null;
            alert("Foto profil berhasil diperbarui.");
        });
    }

    if (removeBtn) {
        removeBtn.addEventListener("click", async () => {

            if (!confirm("Hapus foto profil saat ini?")) return;

            const { error } = await supabaseClient
                .from("profiles")
                .update({ avatar_url: null })
                .eq("id", currentUser.id);

            if (error) {
                alert("Gagal menghapus foto: " + error.message);
                return;
            }

            currentProfile.avatar_url = null;
            preview.src = "assets/images/avatar/default-avatar.png";
            alert("Foto profil dihapus.");
        });
    }
}

/* ==========================================
   COVER PHOTO — preview & upload ke Supabase
   (dengan auto-compress kalau file > 2MB)
========================================== */

function activateCoverUpload() {

    const upload = document.getElementById("coverUpload");
    const preview = document.getElementById("coverPreview");
    const saveBtn = document.getElementById("coverSaveBtn");
    const cancelBtn = document.getElementById("coverCancelBtn");

    if (!upload || !preview) return;

    preview.src = currentProfile?.cover_url || "assets/images/cover/default-cover.jpg";

    let selectedFile = null;

    upload.addEventListener("change", async function () {
        const file = this.files[0];
        if (!file) return;

        const processed = await processImageUpload(file, this, preview);
        if (!processed) return;

        selectedFile = processed;

        const reader = new FileReader();
        reader.onload = (e) => { preview.src = e.target.result; };
        reader.readAsDataURL(selectedFile);
    });

    if (saveBtn) {
        saveBtn.addEventListener("click", async () => {

            if (!selectedFile) {
                alert("Pilih foto cover terlebih dahulu.");
                return;
            }

            saveBtn.disabled = true;
            saveBtn.textContent = "Menyimpan...";

            const ext = selectedFile.name.split(".").pop();
            const path = `${currentUser.id}/cover-${Date.now()}.${ext}`;

            const { error: uploadError } = await supabaseClient
                .storage.from("avatars")
                .upload(path, selectedFile, { upsert: true, contentType: selectedFile.type });

            if (uploadError) {
                alert("Gagal mengunggah cover: " + uploadError.message);
                saveBtn.disabled = false;
                saveBtn.textContent = "Save Cover";
                return;
            }

            const { data: publicUrlData } = supabaseClient
                .storage.from("avatars")
                .getPublicUrl(path);

            const newCoverUrl = publicUrlData.publicUrl;

            const { error: updateError } = await supabaseClient
                .from("profiles")
                .update({ cover_url: newCoverUrl })
                .eq("id", currentUser.id);

            saveBtn.disabled = false;
            saveBtn.textContent = "Save Cover";

            if (updateError) {
                alert("Cover terupload, tapi gagal menyimpan ke profil: " + updateError.message);
                return;
            }

            currentProfile.cover_url = newCoverUrl;
            selectedFile = null;
            alert("Cover berhasil diperbarui.");
        });
    }

    if (cancelBtn) {
        cancelBtn.addEventListener("click", () => {
            loadPanel("cover");
        });
    }
}

/* ==========================================
   CHANGE PASSWORD (Model B — verifikasi password lama)
========================================== */

function activatePasswordForm() {

    const form = document.getElementById("settingsPasswordForm");
    if (!form) return;

    const currentPassInput = document.getElementById("settingsCurrentPassword");
    const newPassInput = document.getElementById("settingsNewPassword");
    const confirmPassInput = document.getElementById("settingsConfirmPassword");

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const currentPassword = currentPassInput.value;
        const newPassword = newPassInput.value;
        const confirmPassword = confirmPassInput.value;

        if (!currentPassword || !newPassword || !confirmPassword) {
            alert("Semua field wajib diisi.");
            return;
        }

        if (newPassword !== confirmPassword) {
            alert("Konfirmasi password baru tidak cocok.");
            return;
        }

        if (newPassword.length < 6) {
            alert("Password baru minimal 6 karakter.");
            return;
        }

        const saveBtn = form.querySelector(".settings-save-btn");
        const originalText = saveBtn.textContent;
        saveBtn.disabled = true;
        saveBtn.textContent = "Memverifikasi...";

        const { error: signInError } = await supabaseClient.auth.signInWithPassword({
            email: currentUser.email,
            password: currentPassword
        });

        if (signInError) {
            saveBtn.disabled = false;
            saveBtn.textContent = originalText;
            alert("Password lama salah.");
            return;
        }

        saveBtn.textContent = "Menyimpan...";

        const { error: updateError } = await supabaseClient.auth.updateUser({
            password: newPassword
        });

        saveBtn.disabled = false;
        saveBtn.textContent = originalText;

        if (updateError) {
            alert("Gagal mengubah password: " + updateError.message);
            return;
        }

        alert("Password berhasil diubah.");
        form.reset();
    });
}

/* ==========================================
   START
========================================== */

initSettings();