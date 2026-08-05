/* =====================================================
   CYBER PROSPERITY
   SETTINGS PAGE
   Version 2.1 — FIXED
===================================================== */
 
/* ==========================================
   ELEMENT
========================================== */
 
const menuItems = document.querySelectorAll(".settings-menu-item");
const panel = document.getElementById("settings-panel");
 
/* ==========================================
   TEMPLATE
========================================== */
 
const templates = {
 
    /* ======================================
       EDIT PROFILE
    ====================================== */
 
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
 
    <form class="settings-form">
 
        <div class="settings-form-group">
 
            <label>
 
                Full Name
 
            </label>
 
            <input
                type="text"
                placeholder="Michael Tan">
 
        </div>
 
        <div class="settings-form-group">
 
            <label>
 
                Username
 
            </label>
 
            <input
                type="text"
                placeholder="@michael.tan">
 
        </div>
 
        <div class="settings-form-group">
 
            <label>
 
                Email
 
            </label>
 
            <input
                type="email"
                placeholder="michael@email.com">
 
        </div>
 
        <div class="settings-form-group">
 
            <label>
 
                Location
 
            </label>
 
            <input
                type="text"
                placeholder="Indonesia">
 
        </div>
 
        <div class="settings-form-group">
 
            <label>
 
                Bio
 
            </label>
 
            <textarea
                rows="5"
                placeholder="Ceritakan sedikit tentang Anda..."></textarea>
 
        </div>
 
        <div class="settings-action">
 
            <button
                class="settings-save-btn"
                type="submit">
 
                Save Changes
 
            </button>
 
        </div>
 
    </form>
 
    `,
 
    /* ======================================
       CHANGE PROFILE PHOTO
    ====================================== */
 
    photo: `
 
    <span class="settings-subtitle">
 
        SETTINGS / PROFILE PHOTO
 
    </span>
 
    <h2>
 
        Change Profile Photo
 
    </h2>
 
    <p>
        Upload foto profil baru yang akan ditampilkan kepada seluruh member Cyber Prosperity.
    </p>
 
    <div class="profile-photo-wrapper">
 
        <img
            src="assets/images/avatar/michael-tan.jpg"
            id="profilePreview"
            class="profile-photo-preview"
            alt="Profile Photo">
 
    </div>
 
    <div class="settings-form">
 
        <div class="photo-layout">
 
            <div class="photo-left">
 
                <div class="settings-action">
 
                    <button
                        class="settings-save-btn"
                        type="button">
 
                        <i class="fa-solid fa-upload"></i>
                        Upload Photo
 
                    </button>
 
                    <button
                        class="settings-cancel-btn"
                        type="button">
 
                        Remove Current Photo
 
                    </button>
 
                </div>
 
            </div>
 
            <div class="photo-right">
 
                <label
                    class="upload-box"
                    for="photoUpload">
 
                    <i class="fa-solid fa-upload"></i>
 
                    <span>
                        Klik untuk upload atau drag file ke sini
                    </span>
 
                </label>
 
                <input
                    id="photoUpload"
                    type="file"
                    accept="image/*"
                    hidden>
 
            </div>
 
        </div>
 
    </div>
 
    `,
    /* ======================================
       CHANGE COVER PHOTO
    ====================================== */
 
    cover: `
 
    <span class="settings-subtitle">
 
        SETTINGS / COVER PHOTO
 
    </span>
 
    <h2>
 
        Change Cover Photo
 
    </h2>
 
    <p>
 
        Upload cover photo baru untuk profil Cyber Prosperity Anda.
 
    </p>
 
    <div class="cover-photo-wrapper">
 
        <img
            src="assets/images/cover/default-cover.jpg"
            id="coverPreview"
            class="cover-photo-preview"
            alt="Cover Photo">
 
    </div>
 
    <div class="settings-form">
 
        <div class="settings-form-group">
 
            <label>
 
                Upload New Cover Photo
 
            </label>
 
            <input
                type="file"
                id="coverUpload"
                accept="image/*">
 
        </div>
 
        <div class="settings-action">
 
            <button
                class="settings-save-btn"
                type="button">
 
                Save Cover
 
            </button>
 
            <button
                class="settings-cancel-btn"
                type="button">
 
                Cancel
 
            </button>
 
        </div>
 
    </div>
 
    `,
 
    /* ======================================
       CHANGE PASSWORD
    ====================================== */
 
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
 
    <form class="settings-form">
 
        <div class="settings-form-group">
 
            <label>
 
                Current Password
 
            </label>
 
            <input
                type="password"
                placeholder="Current Password">
 
        </div>
 
        <div class="settings-form-group">
 
            <label>
 
                New Password
 
            </label>
 
            <input
                type="password"
                placeholder="New Password">
 
        </div>
 
        <div class="settings-form-group">
 
            <label>
 
                Confirm Password
 
            </label>
 
            <input
                type="password"
                placeholder="Confirm Password">
 
        </div>
 
        <div class="settings-action">
 
            <button
                class="settings-save-btn"
                type="submit">
 
                Update Password
 
            </button>
 
        </div>
 
    </form>
 
    `,
 
    /* ======================================
       PRIVACY
    ====================================== */
 
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
 
            <button
                class="settings-save-btn"
                type="button">
 
                Save Privacy
 
            </button>
 
        </div>
 
    </form>
 
    `,
        /* ======================================
       NOTIFICATIONS
    ====================================== */
 
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
 
            <button
                class="settings-save-btn"
                type="button">
 
                Save Notification
 
            </button>
 
        </div>
 
    </form>
 
    `,
 
    /* ======================================
       LANGUAGE
    ====================================== */
 
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
 
            <label>
 
                Language
 
            </label>
 
            <select>
 
                <option>Bahasa Indonesia</option>
 
                <option>English</option>
 
            </select>
 
        </div>
 
        <div class="settings-action">
 
            <button
                class="settings-save-btn"
                type="button">
 
                Save Language
 
            </button>
 
        </div>
 
    </form>
 
    `
 
};
 
/* ==========================================
   LOAD PANEL
========================================== */
 
function loadPanel(tab){
 
    if(!templates[tab]) return;
 
    panel.innerHTML = templates[tab];
 
    if(tab === "photo"){
 
        activatePhotoUpload();
 
    }
 
    if(tab === "cover"){
 
        activateCoverUpload();
 
    }
 
}
 
/* ==========================================
   MENU CLICK
========================================== */
 
menuItems.forEach(item=>{
 
    item.addEventListener("click",function(){
 
        menuItems.forEach(btn=>btn.classList.remove("active"));
 
        this.classList.add("active");
 
        loadPanel(this.dataset.tab);
 
    });
 
});
 
/* ==========================================
   PROFILE PHOTO PREVIEW
========================================== */
 
function activatePhotoUpload(){
 
    const upload=document.getElementById("photoUpload");
    const preview=document.getElementById("profilePreview");
 
    if(!upload || !preview) return;
 
    upload.addEventListener("change",function(){
 
        const file=this.files[0];
 
        if(!file) return;
 
        const reader=new FileReader();
 
        reader.onload=function(e){
 
            preview.src=e.target.result;
 
        }
 
        reader.readAsDataURL(file);
 
    });
 
}
 
/* ==========================================
   COVER PHOTO PREVIEW
========================================== */
 
function activateCoverUpload(){
 
    const upload=document.getElementById("coverUpload");
    const preview=document.getElementById("coverPreview");
 
    if(!upload || !preview) return;
 
    upload.addEventListener("change",function(){
 
        const file=this.files[0];
 
        if(!file) return;
 
        const reader=new FileReader();
 
        reader.onload=function(e){
 
            preview.src=e.target.result;
 
        }
 
        reader.readAsDataURL(file);
 
    });
 
}
 
/* ==========================================
   DEFAULT PANEL
========================================== */
 
loadPanel("profile");
 
