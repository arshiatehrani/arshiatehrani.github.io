/* ============================================================
   CINEMATIC SCROLL EFFECTS
   - Lenis smooth scroll (Apple-style buttery feel)
   - IntersectionObserver fade/slide-in
   - Hero parallax: text scales/fades as you scroll past it
   - Scroll progress bar + navbar glass blur
   - Stat counter animation
   - Section title parallax (subtle horizontal drift)
   ============================================================ */
(function () {
    'use strict';

    /* ---------- 1. STAGGERED CHILD REVEALS ---------- */
    document.querySelectorAll(
        '.tools-grid, .projects-grid, .publications-list, .contact-grid, .gallery-grid, .timeline'
    ).forEach((grid) => {
        Array.from(grid.children).forEach((child, i) => {
            child.style.setProperty('--stagger', i);
        });
    });

    /* ---------- 2. LENIS SMOOTH SCROLL ---------- */
    let lenis = null;
    if (typeof Lenis !== 'undefined') {
        lenis = new Lenis({
            duration: 1.15,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            smoothWheel: true,
            smoothTouch: false,             // touch devices already smooth
            wheelMultiplier: 1.0,
            touchMultiplier: 1.5,
        });
        function rafLenis(time) {
            lenis.raf(time);
            onScroll();                 /* sync hero fades every frame — fixes fast-scroll clipping */
            requestAnimationFrame(rafLenis);
        }
        requestAnimationFrame(rafLenis);

        // Make anchor links use Lenis so motion stays smooth.
        // POSITIVE offset = scroll PAST section top so heading lands close to navbar.
        // Math: section internal padding-top is 128px, navbar ~60-65px tall.
        // offset = 40 puts the heading at ~88px from the top — clears the navbar
        // with ~25px of breathing room, but doesn't waste vertical space.
        document.querySelectorAll('a[href^="#"]').forEach((link) => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');
                if (href.length <= 1) return;
                const target = document.querySelector(href);
                if (!target) return;
                e.preventDefault();
                lenis.scrollTo(target, { offset: 40 });
            });
        });

        // expose for other scripts
        window.__lenis = lenis;
    }

    /* ---------- 3. REVEAL OBSERVER ----------
       Apple-style: when an element enters the viewport it animates IN,
       when it leaves (scrolled past, above OR below) it animates OUT
       so scrolling back triggers the animation again. */
    const revealEls = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            // Toggle the `visible` class based on whether the element is currently in view.
            entry.target.classList.toggle('visible', entry.isIntersecting);
        });
    }, {
        threshold: 0.08,                            // fires sooner when item enters view
        rootMargin: '0px 0px -40px 0px',            // smaller bottom inset = earlier trigger
    });

    revealEls.forEach((el) => revealObserver.observe(el));

    /* ---------- 4. CINEMATIC SCROLL HANDLERS ---------- */
    const progressBar = document.querySelector('.scroll-progress');
    const navbar = document.querySelector('.navbar');
    const heroContent = document.querySelector('.hero-content');
    const heroButtons = document.querySelector('.hero-buttons');
    const heroSection = document.querySelector('.hero');

    function onScroll() {
        const scrollTop = window.scrollY;
        const vh = window.innerHeight;
        const docHeight = document.documentElement.scrollHeight - vh;
        const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;

        if (progressBar) progressBar.style.width = progress + '%';

        if (navbar) {
            if (scrollTop > 60) navbar.classList.add('scrolled');
            else navbar.classList.remove('scrolled');
        }

        // HERO CINEMATIC EXIT — drift down, scale up slightly, fade (text only)
        if (heroContent) {
            if (scrollTop < vh * 1.2) {
                const t = Math.min(scrollTop / vh, 1);
                const translateY = scrollTop * 0.35;
                const scale = 1 + t * 0.12;
                const opacity = Math.max(0, 1 - t * 1.2);
                heroContent.style.transform = `translateY(${translateY}px) scale(${scale})`;
                heroContent.style.opacity = String(opacity);
            } else {
                heroContent.style.opacity = '0';
                heroContent.style.transform = `translateY(${vh * 0.42}px) scale(1.12)`;
            }
        }

        // HERO BUTTONS — separate layer; fade out early and fully hide (no box artifact)
        if (heroButtons) {
            const tb = Math.min(scrollTop / (vh * 0.26), 1);
            const op = Math.max(0, 1 - tb * 2.4);
            const extraY = scrollTop * 0.12;
            const hidden = op <= 0.02;

            heroButtons.style.opacity = String(op);
            heroButtons.style.transform = hidden ? 'translateY(24px)' : `translateY(${extraY}px)`;
            heroButtons.style.visibility = hidden ? 'hidden' : 'visible';
            heroButtons.style.pointerEvents = hidden ? 'none' : 'auto';
        }

        // SECTION HEADERS — subtle horizontal drift as they pass through viewport
        document.querySelectorAll('.section-header').forEach((h) => {
            const rect = h.getBoundingClientRect();
            const center = rect.top + rect.height / 2;
            const fromCenter = (center - vh / 2) / vh;       // -1 .. 1 across viewport
            if (Math.abs(fromCenter) < 1) {
                const drift = fromCenter * -12;              // small parallax
                h.style.transform = `translateX(${drift}px)`;
            }
        });
    }

    let ticking = false;
    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(() => { onScroll(); ticking = false; });
            ticking = true;
        }
    }, { passive: true });
    onScroll();

    /* ---------- 5. STAT COUNTERS ---------- */
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
