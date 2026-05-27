/* ============================================================
   MAIN INTERACTIONS
   - Typewriter effect in the hero
   - Mobile nav toggle
   - Ambient cursor glow (does NOT hide the system cursor)
   - Timeline expand/collapse
   - Footer year
   ============================================================ */
(function () {
    'use strict';

    /* ---------- 1. TYPEWRITER ---------- */
    // EDIT: change these roles to describe you.
    const ROLES = [
        'AI Researcher.',
        'ML Engineer.',
        'Robotics Enthusiast.',
        'Control Systems Geek.',
        'Lifelong Learner.',
    ];

    const typedEl = document.getElementById('typed-text');
    if (typedEl) {
        let roleIndex = 0;
        let charIndex = 0;
        let deleting = false;

        function type() {
            const current = ROLES[roleIndex];
            if (deleting) {
                typedEl.textContent = current.substring(0, charIndex - 1);
                charIndex--;
            } else {
                typedEl.textContent = current.substring(0, charIndex + 1);
                charIndex++;
            }

            let speed = deleting ? 50 : 100;
            if (!deleting && charIndex === current.length) {
                speed = 1800;
                deleting = true;
            } else if (deleting && charIndex === 0) {
                deleting = false;
                roleIndex = (roleIndex + 1) % ROLES.length;
                speed = 400;
            }
            setTimeout(type, speed);
        }
        setTimeout(type, 800);
    }

    /* ---------- 2. MOBILE NAV ----------
       Three things must stay in sync:
         - .nav-links  → slides in from the right
         - .nav-toggle → hamburger ↔ X (also gets z-index above the drawer)
         - .nav-backdrop → translucent overlay; tap it to dismiss
       The drawer can be closed by:
         (a) pressing the (now X) toggle again,
         (b) tapping any nav link,
         (c) tapping the backdrop,
         (d) pressing Escape.
    */
    const navToggle = document.querySelector('.nav-toggle');
    const navLinks = document.querySelector('.nav-links');
    const navBackdrop = document.querySelector('.nav-backdrop');

    function openNav() {
        navLinks?.classList.add('active');
        navToggle?.classList.add('active');
        navBackdrop?.classList.add('active');
        navToggle?.setAttribute('aria-expanded', 'true');
        document.body.style.overflow = 'hidden';        // prevent scroll behind drawer
        if (navLinks) navLinks.scrollTop = 0;           // always show About first
    }
    function closeNav() {
        navLinks?.classList.remove('active');
        navToggle?.classList.remove('active');
        navBackdrop?.classList.remove('active');
        navToggle?.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
    }
    function toggleNav() {
        if (navLinks?.classList.contains('active')) closeNav();
        else openNav();
    }

    if (navToggle && navLinks) {
        navToggle.addEventListener('click', toggleNav);
        navLinks.querySelectorAll('a').forEach((link) => {
            link.addEventListener('click', closeNav);
        });
        navBackdrop?.addEventListener('click', closeNav);
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && navLinks.classList.contains('active')) closeNav();
        });
    }

    /* ---------- 3. TIMELINE EXPAND ---------- */
    document.querySelectorAll('.timeline-card').forEach((card) => {
        card.addEventListener('click', () => {
            const expanded = card.getAttribute('aria-expanded') === 'true';
            card.setAttribute('aria-expanded', expanded ? 'false' : 'true');
        });
    });

    /* ---------- 4. GALLERY THUMBS → open full gallery page ---------- */
    document.querySelectorAll('.gallery-section .gallery-item').forEach((item) => {
        item.addEventListener('click', () => {
            window.location.href = 'gallery.html';
        });
    });

    /* ---------- 5. FOOTER YEAR (auto-updates forever) ---------- */
    // Shows "2026" if the site started this year, or "2026 – 2031" later.
    const copyrightEl = document.getElementById('copyright');
    if (copyrightEl) {
        const start = parseInt(copyrightEl.dataset.startYear, 10) || new Date().getFullYear();
        const now = new Date().getFullYear();
        copyrightEl.textContent = (now > start) ? `${start} – ${now}` : `${now}`;
    }

    // Backward-compat: also fill the older single-year span if it still exists
    const yearEl = document.getElementById('current-year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    /* ---------- 5. HERO NAME — one line, max size that fits ---------- */
    const heroName = document.querySelector('.hero-name');

    function fitHeroNameOneLine() {
        if (!heroName) return;
        const mobile = window.innerWidth <= 768;
        if (mobile) {
            heroName.style.fontSize = '';
            heroName.style.whiteSpace = 'normal';
            return;
        }
        const box = heroName.closest('.hero-content') || heroName.parentElement;
        if (!box) return;

        const maxWidth = box.clientWidth;
        const minPx = 16;
        const maxPx = Math.min(120, Math.max(48, window.innerWidth * 0.11));

        heroName.style.whiteSpace = 'nowrap';
        let lo = minPx;
        let hi = maxPx;
        let best = minPx;

        while (lo <= hi) {
            const mid = Math.floor((lo + hi) / 2);
            heroName.style.fontSize = mid + 'px';
            if (heroName.scrollWidth <= maxWidth) {
                best = mid;
                lo = mid + 1;
            } else {
                hi = mid - 1;
            }
        }
        heroName.style.fontSize = best + 'px';
    }

    if (heroName) {
        let fitTimer;
        const scheduleFit = () => {
            clearTimeout(fitTimer);
            fitTimer = setTimeout(fitHeroNameOneLine, 50);
        };

        fitHeroNameOneLine();
        window.addEventListener('resize', scheduleFit);
        if (document.fonts?.ready) document.fonts.ready.then(fitHeroNameOneLine);

        const heroBox = heroName.closest('.hero-content');
        if (heroBox && typeof ResizeObserver !== 'undefined') {
            new ResizeObserver(scheduleFit).observe(heroBox);
        }
    }
})();
