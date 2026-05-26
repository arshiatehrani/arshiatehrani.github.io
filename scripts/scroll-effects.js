/* ============================================================
   SCROLL EFFECTS — Apple-style reveal animations and parallax
   - IntersectionObserver: fade/slide elements as they enter view
   - Scroll progress bar at top of page
   - Navbar glass blur once scrolled
   - Hero parallax: content drifts slightly with scroll
   - Counters: animate stats when they appear
   ============================================================ */
(function () {
    'use strict';

    /* ---------- 1. STAGGERED REVEAL CHILDREN ---------- */
    // Set a CSS variable so grid children animate in sequence.
    document.querySelectorAll('.tools-grid, .projects-grid, .publications-list, .contact-grid').forEach((grid) => {
        Array.from(grid.children).forEach((child, i) => {
            child.style.setProperty('--stagger', i);
        });
    });

    /* ---------- 2. INTERSECTION OBSERVER REVEAL ---------- */
    const revealEls = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                revealObserver.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.12,
        rootMargin: '0px 0px -80px 0px',
    });

    revealEls.forEach((el) => revealObserver.observe(el));

    /* ---------- 3. SCROLL PROGRESS BAR ---------- */
    const progressBar = document.querySelector('.scroll-progress');
    const navbar = document.querySelector('.navbar');

    function onScroll() {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = (scrollTop / docHeight) * 100;

        if (progressBar) progressBar.style.width = progress + '%';

        // toggle nav blur after a bit of scrolling
        if (navbar) {
            if (scrollTop > 60) navbar.classList.add('scrolled');
            else navbar.classList.remove('scrolled');
        }

        // Hero parallax — translate hero content based on scroll
        const heroContent = document.querySelector('.hero-content');
        if (heroContent && scrollTop < window.innerHeight) {
            const offset = scrollTop * 0.4;
            heroContent.style.transform = `translateY(${offset}px)`;
            heroContent.style.opacity = String(Math.max(0, 1 - scrollTop / (window.innerHeight * 0.8)));
        }
    }

    // requestAnimationFrame throttle for smooth scroll handling
    let ticking = false;
    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                onScroll();
                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true });
    onScroll();

    /* ---------- 4. ANIMATED STAT COUNTERS ---------- */
    const counters = document.querySelectorAll('.stat-number');
    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const el = entry.target;
            const target = parseInt(el.dataset.count, 10) || 0;
            const duration = 1500;
            const start = performance.now();

            function step(now) {
                const t = Math.min((now - start) / duration, 1);
                // ease-out cubic
                const eased = 1 - Math.pow(1 - t, 3);
                el.textContent = Math.floor(eased * target).toString();
                if (t < 1) requestAnimationFrame(step);
                else el.textContent = target.toString();
            }
            requestAnimationFrame(step);
            counterObserver.unobserve(el);
        });
    }, { threshold: 0.5 });

    counters.forEach((c) => counterObserver.observe(c));
})();
