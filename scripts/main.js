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

    /* ---------- 2. MOBILE NAV ---------- */
    const navToggle = document.querySelector('.nav-toggle');
    const navLinks = document.querySelector('.nav-links');

    if (navToggle && navLinks) {
        navToggle.addEventListener('click', () => navLinks.classList.toggle('active'));
        navLinks.querySelectorAll('a').forEach((link) => {
            link.addEventListener('click', () => navLinks.classList.remove('active'));
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
})();
