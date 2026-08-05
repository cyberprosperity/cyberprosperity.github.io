const menuItems = document.querySelectorAll(".settings-menu-item");
const panel = document.getElementById("settings-panel");

const templates = {

profile: `
<h2>Edit Profile</h2>

<p>
Informasi ini akan ditampilkan kepada seluruh member Cyber Prosperity.
</p>

<form class="settings-form">

    <div class="settings-form-group">

        <label>Full Name</label>

        <input 
        type="text" 
        placeholder="John Trader">

    </div>

    <div class="settings-form-group">

        <label>Username</label>

        <input 
        type="text" 
        placeholder="@johntrader">

    </div>

    <div class="settings-form-group">

        <label>Email</label>

        <input 
        type="email" 
        placeholder="john@email.com">

    </div>

    <div class="settings-form-group">

        <label>Location</label>

        <input 
        type="text" 
        placeholder="Indonesia">

    </div>

    <div class="settings-form-group">

        <label>Bio</label>
        <textarea rows="5"
        placeholder="Ceritakan tentang Anda..."></textarea>

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

<div class="settings-form-group">

    <label>
        Upload New Profile Photo
    </label>

    <input
    type="file"
    id="photoUpload"
    accept="image/*">

</div>

<div class="settings-action">

<button
class="settings-save-btn"
type="button">
    Save Photo
</button>

<button
class="settings-cancel-btn"
type="button">
    Cancel
</button>

</div>

`,

password: `

<h2>Change Password</h2>

<p>
Perbarui password akun Anda secara berkala untuk menjaga keamanan akun.
</p>

<form class="settings-form">

<div class="settings-form-group">

<label>
Current Password
</label>

<input 
type="password">

</div>


<div class="settings-form-group">

<label>
New Password
</label>

<input 
type="password">

</div>

<div class="settings-form-group">

<label>
Confirm Password
</label>

<input 
type="password">
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

privacy: `

<span class="settings-subtitle">

SETTINGS / PRIVACY

</span>

<h2>

Privacy

</h2>
<p>
Atur keamanan dan privasi akun Anda.
</p>
<div class="settings-action">
<button
class="settings-save-btn"
type="button">
Save Privacy Settings
</button>
</div>

`,

notification: `

<h2>Notifications</h2>

<p>
Kelola notifikasi Cyber Prosperity Anda.
</p>



<span class="settings-subtitle">

SETTINGS / NOTIFICATIONS

</span>

<h2>

Notifications

</h2>

<p>

Kelola notifikasi Cyber Prosperity Anda.

</p>

<div class="settings-form-group">

<label>

<input type="checkbox" checked>

Email Notifications

</label>
</div>
<div class="settings-action">
<button
class="settings-save-btn"
type="button">
Save
</button>

</div>

`,

language: `

<span class="settings-subtitle">

SETTINGS / LANGUAGE
</span>
<h2>
Language
</h2>
<p>

Pilih bahasa platform Cyber Prosperity.

</p>
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

};

menuItems.forEach(item => {

    item.addEventListener("click", function(){

        menuItems.forEach(btn => {

            btn.classList.remove("active");

        });

        this.classList.add("active");

        const tab = this.dataset.tab;

        if(templates[tab]){

            panel.innerHTML = templates[tab];

            if(tab === "photo"){
                activatePhotoUpload();

            }

        }

    });

});

function activatePhotoUpload(){


    const photoUpload = document.getElementById("photoUpload");
    const profilePreview = document.getElementById("profilePreview");
    if(!photoUpload || !profilePreview){

        return;

    }

    photoUpload.addEventListener("change", function(){

        const file = this.files[0];

        if(file){

            const reader = new FileReader();

            reader.onload = function(e){
                profilePreview.src = e.target.result;
            };

            reader.readAsDataURL(file);

        }

    });



}