document.addEventListener("DOMContentLoaded", async () => {

    const { data: { session } } = await supabaseClient.auth.getSession();

    const signInButton = document.querySelector('.cp-signin');
    const joinButton = document.querySelector('.cp-join');

    if (session) {
        const user = session.user;
        const displayName =
            user.user_metadata?.full_name ||
            user.user_metadata?.username ||
            user.email;

        if (signInButton) {
            signInButton.textContent = displayName;
            signInButton.href = "profile.html";
        }

        if (joinButton) {
            joinButton.textContent = "Logout";
            joinButton.href = "#";
            joinButton.addEventListener("click", async (e) => {
                e.preventDefault();
                await supabaseClient.auth.signOut();
                window.location.href = "index.html";
            });
        }
    }

});