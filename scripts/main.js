/* ============================================================
   MAIN INTERACTIONS
   - Typewriter effect in the hero
   - Mobile nav toggle
   - Custom cursor glow that follows the mouse
   - Smooth scroll for nav links
   - Sets the year in the footer
   ============================================================ */
(function () {
    'use strict';

    /* ---------- 1. TYPEWRITER EFFECT ---------- */
    // EDIT: change these roles to whatever describes you.
    const ROLES = [
        'Researcher.',
        'Engineer.',
        'Builder.',
        'Problem Solver.',
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
                speed = 1800;            // pause at the end of a word
                deleting = true;
            } else if (deleting && charIndex === 0) {
                deleting = false;
                roleIndex = (roleIndex + 1) % ROLES.length;
                speed = 400;             // pause before next word
            }

            setTimeout(type, speed);
        }

        setTimeout(type, 800);
    }

    /* ---------- 2. MOBILE NAV TOGGLE ---------- */
    const navToggle = document.querySelector('.nav-toggle');
    const navLinks = document.querySelector('.nav-links');

    if (navToggle && navLinks) {
        navToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });

        // close menu when a link is clicked
        navLinks.querySelectorAll('a').forEach((link) => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
            });
        });
    }

    /* ---------- 3. CURSOR GLOW ---------- */
    const cursorGlow = document.querySelector('.cursor-glow');
    if (cursorGlow) {
        let targetX = 0, targetY = 0;
        let currentX = 0, currentY = 0;

        window.addEventListener('mousemove', (e) => {
            targetX = e.clientX;
            targetY = e.clientY;
        });

        function animate() {
            // smooth lerp toward the actual mouse position
            currentX += (targetX - currentX) * 0.12;
            currentY += (targetY - currentY) * 0.12;
            cursorGlow.style.transform = `translate(${currentX}px, ${currentY}px) translate(-50%, -50%)`;
            requestAnimationFrame(animate);
        }
        animate();
    }

    /* ---------- 4. SMOOTH SCROLL (extra safety in addition to CSS) ---------- */
    document.querySelectorAll('a[href^="#"]').forEach((link) => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (href.length <= 1) return;
            const target = document.querySelector(href);
            if (!target) return;
            e.preventDefault();
            const top = target.getBoundingClientRect().top + window.scrollY - 70;
            window.scrollTo({ top, behavior: 'smooth' });
        });
    });

    /* ---------- 5. CURRENT YEAR IN FOOTER ---------- */
    const yearEl = document.getElementById('current-year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
