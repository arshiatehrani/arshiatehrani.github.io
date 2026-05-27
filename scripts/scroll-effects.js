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

    /* Hero zoom while scrolling — edit these values */
    const HERO_EXIT = {
        scaleDesktop: 3,           /* max scale on wide screens (3 = 3× size) */
        scaleMobile: 2,            /* max scale on phones (2 = 2× size) */
        mobileBreakpointPx: 768,   /* match main.css @media (max-width: 768px) */
    };

    function isMobileView() {
        return window.innerWidth <= HERO_EXIT.mobileBreakpointPx;
    }

    function heroScaleEnd() {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return 1;
        return isMobileView() ? HERO_EXIT.scaleMobile : HERO_EXIT.scaleDesktop;
    }

    /* ---------- 1. STAGGERED CHILD REVEALS ---------- */
    document.querySelectorAll(
        '.tools-grid, .projects-grid, .publications-list, .contact-grid, .gallery-grid, .timeline'
    ).forEach((grid) => {
        /* grid children are .card-reveal wrappers (or .contact-card / .timeline-item) */
        Array.from(grid.children).forEach((child, i) => {
            child.style.setProperty('--stagger', i);
        });
    });

    /* ---------- 2. LENIS SMOOTH SCROLL (desktop only — native scroll on mobile) ---------- */
    let lenis = null;
    const useLenis = typeof Lenis !== 'undefined'
        && !isMobileView()
        && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (useLenis) {
        lenis = new Lenis({
            duration: 1.15,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            smoothWheel: true,
            smoothTouch: false,
            wheelMultiplier: 1.0,
        });
        function rafLenis(time) {
            lenis.raf(time);
            onScroll();
            requestAnimationFrame(rafLenis);
        }
        requestAnimationFrame(rafLenis);
        window.__lenis = lenis;
    } else {
        window.__lenis = null;
    }

    document.querySelectorAll('a[href^="#"]').forEach((link) => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (href.length <= 1) return;
            const target = document.querySelector(href);
            if (!target) return;
            e.preventDefault();
            if (window.__lenis) {
                window.__lenis.scrollTo(target, { offset: 40 });
            } else {
                const y = target.getBoundingClientRect().top + window.scrollY - 40;
                window.scrollTo({ top: y, behavior: 'smooth' });
            }
        });
    });

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
    const heroMotion = document.querySelector('.hero-motion');
    const heroContent = document.querySelector('.hero-content');
    const heroButtons = document.querySelector('.hero-buttons');

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

        // HERO CINEMATIC EXIT — scale/drift on .hero-motion (text + buttons stay aligned)
        if (heroMotion) {
            const mobile = isMobileView();
            const scaleEnd = heroScaleEnd();
            const scaleDelta = scaleEnd - 1;
            const drift = mobile ? 0.14 : 0.35;
            const fadeRate = mobile ? 1.35 : 1.2;
            if (scrollTop < vh * 1.2) {
                const t = Math.min(scrollTop / vh, 1);
                const translateY = scrollTop * drift;
                const scale = 1 + t * scaleDelta;
                heroMotion.style.transform = `translate3d(0, ${translateY}px, 0) scale(${scale})`;
                if (heroContent) {
                    heroContent.style.opacity = String(Math.max(0, 1 - t * fadeRate));
                }
            } else {
                heroMotion.style.transform = `translate3d(0, ${vh * (mobile ? 0.28 : 0.42)}px, 0) scale(${scaleEnd})`;
                if (heroContent) heroContent.style.opacity = '0';
            }
        }

        if (heroButtons) {
            const mobile = isMobileView();
            const tb = Math.min(scrollTop / (vh * (mobile ? 0.22 : 0.26)), 1);
            const op = Math.max(0, 1 - tb * 2.4);
            const hidden = op <= 0.02;
            heroButtons.style.opacity = String(op);
            heroButtons.style.visibility = hidden ? 'hidden' : 'visible';
            heroButtons.style.pointerEvents = hidden ? 'none' : 'auto';
        }

        // SECTION HEADERS — subtle horizontal drift (desktop only; avoids mobile overflow)
        if (!isMobileView()) {
            document.querySelectorAll('.section-header').forEach((h) => {
                const rect = h.getBoundingClientRect();
                const center = rect.top + rect.height / 2;
                const fromCenter = (center - vh / 2) / vh;
                if (Math.abs(fromCenter) < 1) {
                    const drift = fromCenter * -12;
                    h.style.transform = `translateX(${drift}px)`;
                }
            });
        }
    }

    let ticking = false;
    function scheduleScrollUpdate() {
        if (!ticking) {
            requestAnimationFrame(() => { onScroll(); ticking = false; });
            ticking = true;
        }
    }
    window.addEventListener('scroll', scheduleScrollUpdate, { passive: true });
    window.addEventListener('resize', scheduleScrollUpdate, { passive: true });
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
