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
        scaleDesktop: 1.5,         /* max scale on wide screens (1.5 = 150% size) */
        scaleMobile: 1.5,          /* max scale on phones (1.5 = 150% size) */
        mobileBreakpointPx: 768,   /* match main.css @media (max-width: 768px) */
    };

    /* Other sections: grow 0.95 → 1 while entering, reverse on scroll-up */
    const SECTION_EXIT = {
        scaleMin: 0.95,
        scaleMax: 1,
    };

    function isMobileView() {
        return window.innerWidth <= HERO_EXIT.mobileBreakpointPx;
    }

    function heroScaleEnd() {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return 1;
        return isMobileView() ? HERO_EXIT.scaleMobile : HERO_EXIT.scaleDesktop;
    }

    function prefersReducedMotion() {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    /* 0 at edges, 1 when settled — reverses on scroll-up */
    function sectionFocusT(rect, vh) {
        const top = rect.top;
        const bottom = rect.bottom;
        const enterEnd = vh * 0.5; // Reach full size (1.0) at the middle of the screen
        const enterStart = vh;
        let tIn = 1;
        if (top > enterEnd) {
            tIn = top >= enterStart ? 0 : 1 - (top - enterEnd) / (enterStart - enterEnd);
        }
        const exitStart = vh * 0.5;
        const exitEnd = vh * 0.0;
        let tOut = 1;
        if (bottom < exitStart) {
            tOut = bottom <= exitEnd ? 0 : (bottom - exitEnd) / (exitStart - exitEnd);
        }
        return Math.max(0, Math.min(1, Math.min(tIn, tOut)));
    }

    /* Inner wrapper so section fade/scale layers on top of per-item reveals */
    function initSectionMotionWrappers() {
        const motions = [];
        document.querySelectorAll('section.section > .container').forEach((container) => {
            if (container.querySelector(':scope > .section-motion')) {
                motions.push(container.querySelector(':scope > .section-motion'));
                return;
            }
            const wrap = document.createElement('div');
            wrap.className = 'section-motion';
            while (container.firstChild) {
                wrap.appendChild(container.firstChild);
            }
            container.appendChild(wrap);
            motions.push(wrap);
        });
        return motions;
    }

    function applySectionMotions() {
        if (prefersReducedMotion()) {
            sectionMotions.forEach((el) => {
                el.style.transform = '';
                el.style.opacity = '';
            });
            return;
        }
        const vh = window.innerHeight;
        const { scaleMin, scaleMax } = SECTION_EXIT;
        sectionMotions.forEach((el) => {
            const rect = el.getBoundingClientRect();
            const raw = sectionFocusT(rect, vh);
            const t = raw * raw * (3 - 2 * raw);
            const scale = scaleMin + t * (scaleMax - scaleMin);
            el.style.transform = `scale(${scale})`;
            el.style.opacity = '1';
        });
    }

    /* ---------- 1. STAGGERED CHILD REVEALS ---------- */
    document.querySelectorAll(
        '.tools-grid, .projects-grid, .publications-list, .contact-grid, .timeline'
    ).forEach((grid) => {
        /* grid children are .card-reveal wrappers (or .contact-card / .timeline-item) */
        Array.from(grid.children).forEach((child, i) => {
            child.style.setProperty('--stagger', i);
        });
    });

    /* Wrap section content after stagger so grid --stagger vars stay intact */
    const sectionMotions = initSectionMotionWrappers();

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

    function anchorScrollOffset() {
        const navbar = document.querySelector('.navbar');
        const progress = document.querySelector('.scroll-progress');
        
        let navH = 72;
        if (navbar) {
            // Measure navbar height using the "scrolled" state consistently
            // This prevents discrepancy when the navbar shrinks upon scrolling down
            const wasScrolled = navbar.classList.contains('scrolled');
            if (!wasScrolled) {
                const oldTransition = navbar.style.transition;
                navbar.style.transition = 'none'; // Disable transition temporarily to read final shrunken height immediately
                navbar.classList.add('scrolled');
                void navbar.offsetHeight; // Force layout reflow
                
                navH = navbar.getBoundingClientRect().height;
                
                navbar.classList.remove('scrolled');
                void navbar.offsetHeight; // Force layout reflow
                navbar.style.transition = oldTransition; // Restore transition
            } else {
                navH = navbar.getBoundingClientRect().height;
            }
        }
        
        const progressH = progress ? progress.offsetHeight : 3;
        return navH + progressH + 24; /* fixed nav + progress bar + gap below */
    }

    function getElementLayoutTop(el) {
        let top = 0;
        while (el) {
            top += el.offsetTop;
            el = el.offsetParent;
        }
        return top;
    }

    function scrollToAnchor(target) {
        const lenis = window.__lenis;

        if (lenis) {
            lenis.scrollTo(lenis.actualScroll, { immediate: true });
        }

        const gap = anchorScrollOffset();

        let y = 0;
        if (target.id !== 'hero') {
            const targetTop = getElementLayoutTop(target);
            if (target.tagName.toLowerCase() === 'section') {
                // If it is a section, align to the section's content (below the top padding)
                // This is extremely robust because <section> elements are completely static and unaffected by any scale/fade transforms inside them!
                const style = window.getComputedStyle(target);
                const paddingTop = parseFloat(style.paddingTop) || 0;
                y = Math.max(0, Math.round(targetTop + paddingTop - gap));
            } else {
                // Fallback for any other custom elements
                y = Math.max(0, Math.round(targetTop - gap));
            }
        }

        if (lenis) {
            lenis.scrollTo(y);
        } else {
            window.scrollTo({ top: y, behavior: 'smooth' });
        }
    }

    document.querySelectorAll('a[href^="#"]').forEach((link) => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (href.length <= 1) return;
            const target = document.querySelector(href);
            if (!target) return;
            e.preventDefault();
            scrollToAnchor(target);
        });
    });

    /* ---------- 3. REVEAL OBSERVER ----------
       All .reveal / .reveal-left / .reveal-right (including inside .section-motion).
       Same replay on scroll-up as desktop. Mobile: scroll sync + delayed hide. */
    const revealEls = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');
    const REVEAL_HIDE_DELAY_MS = 240;
    const pendingRevealHide = new WeakMap();

    function revealObserverOptions() {
        if (isMobileView()) {
            return { threshold: 0.05, rootMargin: '72px 0px 72px 0px' };
        }
        return { threshold: 0.08, rootMargin: '0px 0px -40px 0px' };
    }

    function cancelRevealHide(el) {
        const id = pendingRevealHide.get(el);
        if (id != null) {
            clearTimeout(id);
            pendingRevealHide.delete(el);
        }
    }

    function revealIn(el) {
        cancelRevealHide(el);
        el.classList.add('visible');
    }

    function revealOut(el) {
        if (!isMobileView()) {
            cancelRevealHide(el);
            el.classList.remove('visible');
            return;
        }
        cancelRevealHide(el);
        pendingRevealHide.set(el, window.setTimeout(() => {
            el.classList.remove('visible');
            pendingRevealHide.delete(el);
        }, REVEAL_HIDE_DELAY_MS));
    }

    function updateReveal(el, shouldShow) {
        if (shouldShow) revealIn(el);
        else revealOut(el);
    }

    function elementInRevealZone(el, margin) {
        const vh = window.innerHeight;
        const rect = el.getBoundingClientRect();
        return rect.top < vh + margin && rect.bottom > -margin;
    }

    function syncRevealsInViewport() {
        if (!isMobileView()) return;
        revealEls.forEach((el) => {
            updateReveal(el, elementInRevealZone(el, 72));
        });
    }

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            updateReveal(entry.target, entry.isIntersecting);
        });
    }, revealObserverOptions());

    revealEls.forEach((el) => revealObserver.observe(el));
    syncRevealsInViewport();

    /* ---------- 4. CINEMATIC SCROLL HANDLERS ---------- */
    const progressBar = document.querySelector('.scroll-progress');
    const navbar = document.querySelector('.navbar');
    const heroMotion = document.querySelector('.hero-motion');
    const heroContent = document.querySelector('.hero-content');
    const heroButtons = document.querySelector('.hero-buttons');
    const scrollIndicator = document.querySelector('.scroll-indicator');

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

        if (scrollIndicator) {
            const mobile = isMobileView();
            const ts = Math.min(scrollTop / (vh * (mobile ? 0.15 : 0.2)), 1);
            const op = Math.max(0, 1 - ts * 2.0);
            const hidden = op <= 0.02;
            const scale = 1 + ts * 0.3; // scale up to 130%
            const drift = mobile ? 0.14 : 0.35;
            const translateY = scrollTop * drift;
            scrollIndicator.style.opacity = String(op);
            scrollIndicator.style.transform = `translate3d(0, ${translateY}px, 0) scale(${scale})`;
            scrollIndicator.style.visibility = hidden ? 'hidden' : 'visible';
            scrollIndicator.style.pointerEvents = hidden ? 'none' : 'auto';
        }

        applySectionMotions();

        // SECTION HEADERS — horizontal drift via CSS var (does not override .reveal transforms)
        if (!isMobileView()) {
            document.querySelectorAll('.section-header.reveal').forEach((h) => {
                const rect = h.getBoundingClientRect();
                const center = rect.top + rect.height / 2;
                const fromCenter = (center - vh / 2) / vh;
                if (Math.abs(fromCenter) < 1) {
                    h.style.setProperty('--header-drift', `${(fromCenter * -12).toFixed(2)}px`);
                } else {
                    h.style.removeProperty('--header-drift');
                }
            });
        } else {
            document.querySelectorAll('.section-header.reveal').forEach((h) => {
                h.style.removeProperty('--header-drift');
            });
        }
    }

    let ticking = false;
    function scheduleScrollUpdate() {
        if (!ticking) {
            requestAnimationFrame(() => {
                onScroll();
                syncRevealsInViewport();
                ticking = false;
            });
            ticking = true;
        }
    }

    window.addEventListener('scroll', scheduleScrollUpdate, { passive: true });
    window.addEventListener('resize', () => {
        scheduleScrollUpdate();
        syncRevealsInViewport();
    }, { passive: true });
    onScroll();
    syncRevealsInViewport();

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
