/* ==========================================
   CYBER PROSPERITY - HERO SLIDER
   Auto-rotate 5 detik + dot navigasi
========================================== */

document.addEventListener('DOMContentLoaded', function () {

    const slides = document.querySelectorAll('.home-slide');
    const dotsWrap = document.getElementById('heroDots');

    let current = 0;
    let autoTimer = null;

    if (!slides.length || !dotsWrap) {
        return;
    }

    slides.forEach((_, i) => {

        const d = document.createElement('button');

        d.type = 'button';

        d.className = 'home-dot' + (i === 0 ? ' active' : '');

        d.setAttribute('aria-label', 'Go to slide ' + (i + 1));

        d.addEventListener('click', function () {
            goTo(i);
            restartAuto();
        });

        dotsWrap.appendChild(d);

    });

    function goTo(i) {

        slides[current].classList.remove('active');

        if (dotsWrap.children[current]) {
            dotsWrap.children[current].classList.remove('active');
        }

        current = i;

        slides[current].classList.add('active');

        if (dotsWrap.children[current]) {
            dotsWrap.children[current].classList.add('active');
        }

    }

    function startAuto() {

        autoTimer = setInterval(function () {

            goTo((current + 1) % slides.length);

        }, 5000);

    }

    function restartAuto() {

        clearInterval(autoTimer);

        startAuto();

    }

    startAuto();

});