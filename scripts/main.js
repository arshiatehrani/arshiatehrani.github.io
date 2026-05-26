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

    /* ---------- 3. AMBIENT CURSOR GLOW ----------
       NOTE: We do NOT hide the system cursor anymore.
       The glow is a soft halo following the mouse, behind everything. */
    const cursorGlow = document.querySelector('.cursor-glow');
    if (cursorGlow) {
        let targetX = window.innerWidth / 2;
        let targetY = window.innerHeight / 2;
        let currentX = targetX;
        let currentY = targetY;

        window.addEventListener('mousemove', (e) => {
            targetX = e.clientX;
            targetY = e.clientY;
        });

        function animate() {
            currentX += (targetX - currentX) * 0.10;
            currentY += (targetY - currentY) * 0.10;
            cursorGlow.style.transform = `translate(${currentX}px, ${currentY}px) translate(-50%, -50%)`;
            requestAnimationFrame(animate);
        }
        animate();
    }

    /* ---------- 4. TIMELINE EXPAND ---------- */
    document.querySelectorAll('.timeline-card').forEach((card) => {
        card.addEventListener('click', () => {
            const expanded = card.getAttribute('aria-expanded') === 'true';
            card.setAttribute('aria-expanded', expanded ? 'false' : 'true');
        });
    });

    /* ---------- 5. FOOTER YEAR ---------- */
    const yearEl = document.getElementById('current-year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
