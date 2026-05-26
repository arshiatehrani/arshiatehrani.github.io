/* ============================================================
   INTERACTIVE PARTICLE NETWORK — fast, faded, parallax edition
   ----------------------------------------------------------
   What's new vs earlier versions:
     - PARALLAX with page scroll: particles drift with the page,
       background slower than foreground (Apple-style depth).
     - SPATIAL HASH GRID: connection-line checks are now O(n)
       on average instead of O(n²). Same particle count, far
       cheaper per frame.
     - FADED COLORS: lower base opacity + softer glow.
     - Pauses when the tab is hidden.

   Tune density / sizes / parallax in NEAR_CONFIG and BACK_CONFIG.
   ============================================================ */
(function () {
    'use strict';

    /* ============================================================
       THEME-AWARE COLOR HELPERS
       Read RGB triplets from CSS custom properties so the particle
       network repaints automatically when the user toggles theme.
       ============================================================ */
    function readVar(name) {
        return getComputedStyle(document.documentElement)
            .getPropertyValue(name).trim();
    }
    function rgbaPrefix(varName, fallback) {
        const v = readVar(varName) || fallback;
        return 'rgba(' + v + ', ';
    }

    /* Mutable color objects — re-populated by refreshColors() */
    const NEAR_COLORS = {};
    const BACK_COLORS = {};

    function refreshColors() {
        NEAR_COLORS.particleColor   = rgbaPrefix('--particle-near-rgb',        '154, 177, 201');
        NEAR_COLORS.accentColor     = rgbaPrefix('--particle-near-accent-rgb', '200, 215, 240');
        NEAR_COLORS.glowColor       = rgbaPrefix('--particle-near-glow-rgb',   '120, 165, 215');
        NEAR_COLORS.lineColor       = NEAR_COLORS.particleColor;
        NEAR_COLORS.accentLineColor = NEAR_COLORS.accentColor;
        NEAR_COLORS.mouseLineColor  = rgbaPrefix('--particle-mouse-rgb',       '210, 225, 250');

        BACK_COLORS.particleColor   = rgbaPrefix('--particle-back-rgb',         '74, 127, 179');
        BACK_COLORS.accentColor     = rgbaPrefix('--particle-back-accent-rgb', '176, 168, 196');
        BACK_COLORS.glowColor       = BACK_COLORS.particleColor;
        BACK_COLORS.lineColor       = BACK_COLORS.particleColor;
        BACK_COLORS.accentLineColor = BACK_COLORS.accentColor;
        BACK_COLORS.mouseLineColor  = BACK_COLORS.particleColor;
    }
    refreshColors();

    /* Re-read colors when theme changes */
    window.addEventListener('themechange', refreshColors);

    /* ============================================================
       LAYER ENGINE
       ============================================================ */
    function makeLayer(canvasId, config) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return null;
        const ctx = canvas.getContext('2d', { alpha: true });

        let particles = [];
        let width = 0, height = 0;
        const dpr = Math.min(window.devicePixelRatio || 1, 1.75);   // tiny perf gain on retina

        // Pre-allocated spatial grid (rebuilt each frame, but arrays reused)
        let grid = [];
        let cols = 0, rows = 0;

        function resize() {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width * dpr;
            canvas.height = height * dpr;
            canvas.style.width = width + 'px';
            canvas.style.height = height + 'px';
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.scale(dpr, dpr);
            spawn();
            buildGridSkeleton();
        }

        function buildGridSkeleton() {
            const cellSize = config.connectionDistance || 100;
            cols = Math.ceil(width / cellSize) + 2;
            rows = Math.ceil(height / cellSize) + 2;
            grid = new Array(cols * rows);
            for (let i = 0; i < grid.length; i++) grid[i] = [];
        }

        function spawn() {
            const target = Math.min(
                config.maxParticles,
                Math.floor(width * height * config.density)
            );
            particles = [];
            for (let i = 0; i < target; i++) particles.push(make());
        }

        function make() {
            const angle = Math.random() * Math.PI * 2;
            const speed = config.minSpeed + Math.random() * (config.maxSpeed - config.minSpeed);
            const isAccent = Math.random() < config.accentRatio;
            return {
                x: Math.random() * width,
                y: Math.random() * height,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                r: isAccent
                    ? config.minRadius + Math.random() * (config.maxRadius - config.minRadius) * 1.8
                    : config.minRadius + Math.random() * (config.maxRadius - config.minRadius),
                accent: isAccent,
                twinkle: Math.random() * Math.PI * 2,
                twinkleSpeed: 0.015 + Math.random() * 0.030,
                baseOpacity: 0.30 + Math.random() * 0.30,        // dimmer base
            };
        }

        function update(p, mouse, scrollDelta) {
            p.x += p.vx;
            p.y += p.vy;
            // parallax: shift particles opposite to scroll, scaled by factor
            p.y -= scrollDelta * (config.parallaxFactor || 0);
            p.twinkle += p.twinkleSpeed;

            if (config.reactsToMouse && mouse.active) {
                const dx = p.x - mouse.x;
                const dy = p.y - mouse.y;
                const distSq = dx * dx + dy * dy;
                const infl = config.mouseInfluence;
                if (distSq < infl * infl && distSq > 0) {
                    const dist = Math.sqrt(distSq);
                    const force = (1 - dist / infl) * config.mouseForce;
                    p.x += (dx / dist) * force;
                    p.y += (dy / dist) * force;
                }
            }

            // wrap edges so the field is endless
            if (p.x < -30) p.x = width + 30;
            if (p.x > width + 30) p.x = -30;
            if (p.y < -30) p.y = height + 30;
            if (p.y > height + 30) p.y = -30;
        }

        /* ---------- SPATIAL HASH CONNECTION CHECK ----------
           Only check particle pairs in the same or neighboring grid cell.
           For 600+ particles this is ~50-100x faster than the naive O(n²). */
        function drawConnections(mouse) {
            if (!config.drawConnections) return;
            const maxDist = config.connectionDistance;
            const maxDistSq = maxDist * maxDist;
            const cellSize = maxDist;

            // 1) clear grid buckets
            for (let i = 0; i < grid.length; i++) grid[i].length = 0;

            // 2) bucket particles into cells
            for (let i = 0; i < particles.length; i++) {
                const p = particles[i];
                const cx = Math.max(0, Math.min(cols - 1, ((p.x / cellSize) | 0) + 1));
                const cy = Math.max(0, Math.min(rows - 1, ((p.y / cellSize) | 0) + 1));
                grid[cy * cols + cx].push(i);
            }

            // 3) line from cursor (cheap, separate)
            if (config.reactsToMouse && mouse.active) {
                const mc = config.mouseInfluence * 1.5;
                const mcSq = mc * mc;
                for (let i = 0; i < particles.length; i++) {
                    const a = particles[i];
                    const mdx = a.x - mouse.x;
                    const mdy = a.y - mouse.y;
                    const dSq = mdx * mdx + mdy * mdy;
                    if (dSq < mcSq) {
                        const alpha = 1 - Math.sqrt(dSq) / mc;
                        ctx.beginPath();
                        ctx.moveTo(a.x, a.y);
                        ctx.lineTo(mouse.x, mouse.y);
                        ctx.strokeStyle = config.colors.mouseLineColor + (alpha * 0.45) + ')';
                        ctx.lineWidth = 1.0;
                        ctx.stroke();
                    }
                }
            }

            // 4) particle-to-particle lines via grid neighbors only
            for (let cy = 0; cy < rows; cy++) {
                for (let cx = 0; cx < cols; cx++) {
                    const cell = grid[cy * cols + cx];
                    if (cell.length === 0) continue;

                    for (let ci = 0; ci < cell.length; ci++) {
                        const i = cell[ci];
                        const a = particles[i];

                        // check same cell (j > i) + neighbors right/below to avoid dupes
                        for (let dy = 0; dy <= 1; dy++) {
                            for (let dx = -1; dx <= 1; dx++) {
                                if (dy === 0 && dx < 0) continue;       // skip already-checked half
                                const ncx = cx + dx;
                                const ncy = cy + dy;
                                if (ncx < 0 || ncx >= cols || ncy < 0 || ncy >= rows) continue;
                                const ncell = grid[ncy * cols + ncx];
                                if (ncell.length === 0) continue;

                                for (let cj = 0; cj < ncell.length; cj++) {
                                    const j = ncell[cj];
                                    if (j <= i && !(dx !== 0 || dy !== 0)) continue;  // same cell + same index
                                    if (dx === 0 && dy === 0 && j <= i) continue;
                                    const b = particles[j];
                                    const bdx = a.x - b.x;
                                    const bdy = a.y - b.y;
                                    const distSq = bdx * bdx + bdy * bdy;
                                    if (distSq < maxDistSq) {
                                        const alpha = 1 - Math.sqrt(distSq) / maxDist;
                                        const useAccent = (a.accent || b.accent);
                                        ctx.beginPath();
                                        ctx.moveTo(a.x, a.y);
                                        ctx.lineTo(b.x, b.y);
                                        ctx.strokeStyle = (useAccent ? config.colors.accentLineColor : config.colors.lineColor)
                                            + (alpha * config.lineOpacity) + ')';
                                        ctx.lineWidth = useAccent ? config.lineWidth * 1.3 : config.lineWidth;
                                        ctx.stroke();
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        function drawParticle(p) {
            // Twinkle: opacity oscillates softly
            const twinkleAmp = p.accent ? 0.22 : 0.14;
            const opacity = Math.max(0, Math.min(1,
                p.baseOpacity + Math.sin(p.twinkle) * twinkleAmp
            ));

            // Core dot
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = (p.accent ? config.colors.accentColor : config.colors.particleColor) + opacity + ')';
            ctx.fill();

            // Soft halo on accent ("hub") particles — dimmer than before
            if (p.accent && config.drawGlow) {
                const glowR = p.r * 4.2;
                const grad = ctx.createRadialGradient(p.x, p.y, p.r * 0.5, p.x, p.y, glowR);
                grad.addColorStop(0, config.colors.glowColor + (opacity * 0.28) + ')');
                grad.addColorStop(0.5, config.colors.glowColor + (opacity * 0.06) + ')');
                grad.addColorStop(1, config.colors.glowColor + '0)');
                ctx.beginPath();
                ctx.arc(p.x, p.y, glowR, 0, Math.PI * 2);
                ctx.fillStyle = grad;
                ctx.fill();
            }
        }

        function render(mouse, scrollDelta) {
            ctx.clearRect(0, 0, width, height);
            for (const p of particles) update(p, mouse, scrollDelta);
            drawConnections(mouse);
            for (const p of particles) drawParticle(p);
        }

        return { resize, render };
    }

    /* ============================================================
       LAYER CONFIGS — edit density / sizes / parallax here
       ============================================================ */

    // NEAR — foreground, denser, moves more with scroll
    const NEAR_CONFIG = {
        density: 0.00055,
        maxParticles: 620,
        minSpeed: 0.18,                                 // bumped — clearer idle drift
        maxSpeed: 0.62,
        minRadius: 1.4,
        maxRadius: 2.8,
        connectionDistance: 130,
        accentRatio: 0.18,
        drawConnections: true,
        drawGlow: true,
        parallaxFactor: 0.45,
        colors: NEAR_COLORS,                            // theme-aware (filled by refreshColors)
        lineOpacity: 0.32,
        lineWidth: 0.8,
        reactsToMouse: true,
        mouseInfluence: 340,                            // bigger radius — many more particles react
        mouseForce: 1.9,                                // a touch stronger push for a livelier ripple
    };

    // BACK — distant, slower, dimmer, less parallax (looks farther)
    // Now also reacts to the cursor (gently) so the whole field feels alive.
    const BACK_CONFIG = {
        density: 0.00030,
        maxParticles: 360,
        minSpeed: 0.08,                                 // gentle bump — distant layer still slow
        maxSpeed: 0.26,
        minRadius: 0.7,
        maxRadius: 1.6,
        connectionDistance: 95,
        accentRatio: 0.10,
        drawConnections: true,
        drawGlow: false,
        parallaxFactor: 0.18,
        colors: BACK_COLORS,                            // theme-aware
        lineOpacity: 0.22,
        lineWidth: 0.55,
        reactsToMouse: true,                            // distant layer drifts subtly too
        mouseInfluence: 280,                            // slightly smaller than NEAR
        mouseForce: 0.7,                                // weaker push — feels like depth
    };

    /* ============================================================
       Build & run
       ============================================================ */
    const layers = [
        makeLayer('particle-canvas-back', BACK_CONFIG),
        makeLayer('particle-canvas',      NEAR_CONFIG),
    ].filter(Boolean);

    if (layers.length === 0) return;

    /* Mouse tracking */
    const mouse = { x: -1000, y: -1000, active: false };
    window.addEventListener('mousemove', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
        mouse.active = true;
    });
    window.addEventListener('mouseleave', () => { mouse.active = false; });
    window.addEventListener('touchmove', (e) => {
        if (e.touches.length > 0) {
            mouse.x = e.touches[0].clientX;
            mouse.y = e.touches[0].clientY;
            mouse.active = true;
        }
    }, { passive: true });
    window.addEventListener('touchend', () => { mouse.active = false; });

    /* Scroll tracking for parallax */
    let lastScrollY = window.scrollY;
    let pendingScrollDelta = 0;
    window.addEventListener('scroll', () => {
        const cur = window.scrollY;
        pendingScrollDelta += (cur - lastScrollY);
        lastScrollY = cur;
    }, { passive: true });

    /* Animation loop */
    let animationId = null;
    function animate() {
        const delta = pendingScrollDelta;
        pendingScrollDelta = 0;
        for (const layer of layers) layer.render(mouse, delta);
        animationId = requestAnimationFrame(animate);
    }

    window.addEventListener('resize', () => {
        for (const layer of layers) layer.resize();
    });

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            if (animationId) cancelAnimationFrame(animationId);
            animationId = null;
        } else if (!animationId) {
            animate();
        }
    });

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        for (const cfg of [NEAR_CONFIG, BACK_CONFIG]) {
            cfg.minSpeed = 0; cfg.maxSpeed = 0.02; cfg.parallaxFactor = 0;
        }
    }

    for (const layer of layers) layer.resize();
    animate();
})();
