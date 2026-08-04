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

        <input type="text" placeholder="John Trader">

    </div>

    <div class="settings-form-group">

        <label>Username</label>

        <input type="text" placeholder="@johntrader">

    </div>

    <div class="settings-form-group">

        <label>Email</label>

        <input type="email" placeholder="john@email.com">

    </div>

    <div class="settings-form-group">

        <label>Bio</label>

        <textarea rows="5"></textarea>

    </div>

    <button class="btn-primary">

        Save Changes

    </button>

</form>

`,

password: `

<h2>Change Password</h2>

<p>
Perbarui password akun Anda secara berkala untuk menjaga keamanan akun.
</p>

<form class="settings-form">

    <div class="settings-form-group">

        <label>Current Password</label>

        <input type="password">

    </div>

    <div class="settings-form-group">

        <label>New Password</label>

        <input type="password">

    </div>

    <div class="settings-form-group">

        <label>Confirm Password</label>

        <input type="password">

    </div>

    <button class="btn-primary">

        Update Password

    </button>

</form>

`

};

menuItems.forEach(item => {

    item.addEventListener("click", () => {

        menuItems.forEach(btn => btn.classList.remove("active"));

        item.classList.add("active");

        const tab = item.dataset.tab;

        if (templates[tab]) {

            panel.innerHTML = templates[tab];

        }

    });

});