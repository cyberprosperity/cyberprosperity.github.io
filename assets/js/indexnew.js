/* ==========================================
   CYBER PROSPERITY — HERO SLIDER
   Auto-rotate 5 detik + dot navigasi
========================================== */

document.addEventListener('DOMContentLoaded', function () {

    const slides = document.querySelectorAll('.home-slide');
    const dotsWrap = document.getElementById('heroDots');
    let current = 0;
    let autoTimer = null;

    if (!slides.length || !dotsWrap) return;

    slides.forEach((_, i) => {
        const d = document.createElement('div');
        d.className = 'home-dot' + (i === 0 ? ' active' : '');
        d.addEventListener('click', () => {
            goTo(i);
            restartAuto();
        });
        dotsWrap.appendChild(d);
    });

    function goTo(i) {
        slides[current].classList.remove('active');
        dotsWrap.children[current].classList.remove('active');
        current = i;
        slides[current].classList.add('active');
        dotsWrap.children[current].classList.add('active');
    }

    function startAuto() {
        autoTimer = setInterval(() => goTo((current + 1) % slides.length), 5000);
    }

    function restartAuto() {
        clearInterval(autoTimer);
        startAuto();
    }

    startAuto();

});