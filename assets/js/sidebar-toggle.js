/* ==========================================
   CYBER PROSPERITY
   Off-canvas Sidebar (Mobile)
   - swipe kanan dari tepi kiri = buka
   - swipe kiri saat terbuka = tutup
   - tap overlay = tutup
   - tap edge-tab = buka (fallback)
========================================== */

(function () {

    var MOBILE_QUERY = "(max-width: 768px)";

    var sidebar = document.querySelector(".sidebar");

    if (!sidebar) return;

    /* ---------- buat overlay & edge-tab secara dinamis ---------- */

    var overlay = document.createElement("div");
    overlay.className = "sidebar-overlay";
    document.body.appendChild(overlay);

    var edgeHint = document.createElement("div");
    edgeHint.className = "sidebar-edge-hint";
    edgeHint.innerHTML = "<i class=\"fa-solid fa-angle-right\"></i>";
    document.body.appendChild(edgeHint);

    /* ---------- open / close ---------- */

    function openSidebar() {
        sidebar.classList.add("sidebar-open");
        overlay.classList.add("active");
        document.body.style.overflow = "hidden";
    }

    function closeSidebar() {
        sidebar.classList.remove("sidebar-open");
        overlay.classList.remove("active");
        document.body.style.overflow = "";
    }

    function isOpen() {
        return sidebar.classList.contains("sidebar-open");
    }

    edgeHint.addEventListener("click", function () {
        openSidebar();
    });

    overlay.addEventListener("click", function () {
        closeSidebar();
    });

    // tutup otomatis kalau user tap salah satu menu (biar tidak nyangkut kebuka)
    sidebar.addEventListener("click", function (e) {
        if (e.target.closest("a")) {
            closeSidebar();
        }
    });

    /* ---------- swipe gesture ---------- */

    var touchStartX = 0;
    var touchStartY = 0;
    var touchDeltaX = 0;
    var tracking = false;

    var EDGE_ZONE = 30;      // px dari tepi kiri layar untuk mulai swipe-open
    var SWIPE_THRESHOLD = 60; // px minimal geser untuk trigger open/close

    document.addEventListener("touchstart", function (e) {

        if (!window.matchMedia(MOBILE_QUERY).matches) return;

        var touch = e.touches[0];
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
        touchDeltaX = 0;

        // hanya mulai tracking swipe-open kalau mulai dari tepi kiri,
        // atau sidebar sedang terbuka (untuk swipe-close dari mana saja di dalam sidebar)
        if (touchStartX <= EDGE_ZONE || isOpen()) {
            tracking = true;
        } else {
            tracking = false;
        }

    }, { passive: true });

    document.addEventListener("touchmove", function (e) {

        if (!tracking) return;

        var touch = e.touches[0];
        touchDeltaX = touch.clientX - touchStartX;

        var deltaY = Math.abs(touch.clientY - touchStartY);

        // kalau geraknya lebih vertikal daripada horizontal, batalkan (biar scroll halaman tetap jalan)
        if (deltaY > Math.abs(touchDeltaX)) {
            tracking = false;
        }

    }, { passive: true });

    document.addEventListener("touchend", function () {

        if (!tracking) return;

        if (!isOpen() && touchDeltaX > SWIPE_THRESHOLD) {
            openSidebar();
        }

        if (isOpen() && touchDeltaX < -SWIPE_THRESHOLD) {
            closeSidebar();
        }

        tracking = false;
        touchDeltaX = 0;

    });

    /* ---------- tutup sidebar kalau resize ke desktop ---------- */

    window.addEventListener("resize", function () {
        if (!window.matchMedia(MOBILE_QUERY).matches) {
            closeSidebar();
        }
    });

})();