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

    <button 
    class="btn-primary"
    type="button">

        Save Changes

    </button>

</form>

`,
photo: `

<h2>Change Profile Photo</h2>

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

<button
class="btn-primary"
type="button">
Update Password
</button>

</form>

`,

privacy: `

<h2>Privacy</h2>

<p>
Atur keamanan dan privasi akun Anda.
</p>

<button class="btn-primary">
Save Privacy Settings
</button>

`,

notification: `

<h2>Notifications</h2>

<p>
Kelola notifikasi Cyber Prosperity Anda.
</p>



<label>

<input type="checkbox" checked>
 Email Notification
</label>

`,

language: `

<h2>Language</h2>

<p>
Pilih bahasa platform Cyber Prosperity.
</p>

<select>

<option>
Bahasa Indonesia
</option>

<option>
English
</option>

</select>

`

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