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
        let worldMinX = 0, worldMaxX = 0, worldMinY = 0, worldMaxY = 0;

        const MARGIN_X = 30;
        const WRAP_Y_NEAR = 30;
        const MARGIN_Y_BELOW = 150;
        const MARGIN_Y_ABOVE = 150;

        function parallaxScrollReserve() {
            const factor = config.parallaxFactor || 0;
            if (!factor || !height) return MARGIN_Y_BELOW;
            const pageScroll = Math.max(0, (document.documentElement.scrollHeight || height) - height);
            return Math.min(height * 2, pageScroll * factor + MARGIN_Y_BELOW);
        }

        function computeWorldBounds() {
            worldMinX = -MARGIN_X;
            worldMaxX = width + MARGIN_X;
            worldMinY = -WRAP_Y_NEAR - MARGIN_Y_ABOVE;
            worldMaxY = height + WRAP_Y_NEAR + parallaxScrollReserve();
        }

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

        function gridCellSize() {
            return (config.connectionDistance || 100) * 0.5;
        }

        function buildGridSkeleton() {
            const cellSize = gridCellSize();
            computeWorldBounds();
            cols = Math.ceil((worldMaxX - worldMinX) / cellSize) + 1;
            rows = Math.ceil((worldMaxY - worldMinY) / cellSize) + 1;
            grid = new Array(cols * rows);
            for (let i = 0; i < grid.length; i++) grid[i] = [];
        }

        function particleCell(p) {
            const cellSize = gridCellSize();
            const cx = ((p.x - worldMinX) / cellSize) | 0;
            const cy = ((p.y - worldMinY) / cellSize) | 0;
            return {
                cx: Math.max(0, Math.min(cols - 1, cx)),
                cy: Math.max(0, Math.min(rows - 1, cy)),
            };
        }

        function spawn() {
            computeWorldBounds();
            const target = Math.max(0, Math.min(
                config.maxParticles,
                Math.floor(width * height * config.density)
            ));
            particles = [];
            for (let i = 0; i < target; i++) particles.push(make());
        }

        function randomSpawnY() {
            if (Math.random() < 0.7) {
                return Math.random() * height;
            }
            return height + Math.random() * Math.max(1, worldMaxY - height);
        }

        function make() {
            const angle = Math.random() * Math.PI * 2;
            const speed = config.minSpeed + Math.random() * (config.maxSpeed - config.minSpeed);
            const isAccent = Math.random() < config.accentRatio;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            return {
                x: Math.random() * width,
                y: randomSpawnY(),
                vx: vx,
                vy: vy,
                baseVx: vx,                                  // remembered for damping-back
                baseVy: vy,
                r: isAccent
                    ? config.minRadius + Math.random() * (config.maxRadius - config.minRadius) * 1.8
                    : config.minRadius + Math.random() * (config.maxRadius - config.minRadius),
                accent: isAccent,
                twinkle: Math.random() * Math.PI * 2,
                twinkleSpeed: 0.015 + Math.random() * 0.030,
                baseOpacity: 0.30 + Math.random() * 0.30,
            };
        }

        /* Parallax is render-only — scroll must not mutate p.y (causes top/bottom line blink). */
        function parallaxOffset() {
            return -window.scrollY * (config.parallaxFactor || 0);
        }

        function update(p, mouse, parallaxY, mouseVx, mouseVy) {
            p.x += p.vx;
            p.y += p.vy;
            p.twinkle += p.twinkleSpeed;

            // Cursor interaction — small "physical ball" pushing particles aside.
            // Particles get nudged in the cursor's direction of motion, but ONLY:
            //   - when the cursor is moving (mouseVx/mouseVy not both zero),
            //   - within a tight radius around the cursor, AND
            //   - when they are AHEAD of the cursor's motion direction.
            // The dot product between the cursor's velocity vector and the
            // (cursor → particle) vector tells us whether the particle is in
            // front (dot > 0) or behind (dot < 0). Only those in front are
            // pushed, just like water in front of a moving hand.
            if (config.reactsToMouse && mouse.active && (mouseVx !== 0 || mouseVy !== 0)) {
                const dx = p.x - mouse.x;
                const dy = (p.y + parallaxY) - mouse.y;
                const distSq = dx * dx + dy * dy;
                const infl = config.mouseInfluence;
                if (distSq < infl * infl) {
                    const dist = Math.sqrt(distSq);
                    const t = 1 - dist / infl;              // 0 at edge, 1 at cursor
                    const eased = t * t * (3 - 2 * t);

                    // "Frontness" — 1 if particle is directly in cursor's path,
                    // 0 if perpendicular, 0 if behind. Particles touching the
                    // cursor exactly (dist≈0) always count as "in front".
                    let frontness = 1;
                    if (dist > 0.5) {
                        const cursorMag = Math.sqrt(mouseVx * mouseVx + mouseVy * mouseVy);
                        if (cursorMag > 0.01) {
                            const cosTheta = (mouseVx * dx + mouseVy * dy) / (cursorMag * dist);
                            frontness = Math.max(0, cosTheta);
                        }
                    }

                    if (frontness > 0) {
                        // Clamp cursor velocity so very fast flicks don't blast
                        // particles across the page — keeps motion believable.
                        const CAP = 25;
                        const cvx = Math.max(-CAP, Math.min(CAP, mouseVx));
                        const cvy = Math.max(-CAP, Math.min(CAP, mouseVy));
                        const k = eased * config.mouseForce * frontness;
                        p.vx += cvx * k;
                        p.vy += cvy * k;
                    }
                }
            }

            // Damp velocity back toward natural drift. Anything the cursor adds
            // bleeds off over ~0.4-0.6 s, leaving the original trajectory.
            const damp = 0.07;
            p.vx += (p.baseVx - p.vx) * damp;
            p.vy += (p.baseVy - p.vy) * damp;

            // Hard speed cap — safety net against runaway velocity.
            const maxV = config.maxSpeed * 6;
            const speedSq = p.vx * p.vx + p.vy * p.vy;
            if (speedSq > maxV * maxV) {
                const s = Math.sqrt(speedSq);
                p.vx = (p.vx / s) * maxV;
                p.vy = (p.vy / s) * maxV;
            }

            // Wrap edges with SCATTER. When a particle leaves at one edge it
            // re-enters at a random spot on the opposite edge (random X and a
            // randomized Y band) — this breaks up the "horizontal line of new
            // particles" artifact that appeared on fast scrolls.
            if (p.x < -MARGIN_X) {
                p.x = width + MARGIN_X;
                p.y = Math.random() * height;
            } else if (p.x > width + MARGIN_X) {
                p.x = -MARGIN_X;
                p.y = Math.random() * height;
            }
            if (p.y < worldMinY) {
                p.y = height + WRAP_Y_NEAR + Math.random() * (worldMaxY - height - WRAP_Y_NEAR);
                p.x = Math.random() * width;
            } else if (p.y > worldMaxY) {
                p.y = worldMinY + Math.random() * (WRAP_Y_NEAR + MARGIN_Y_ABOVE);
                p.x = Math.random() * width;
            }
        }

        /* ---------- SPATIAL HASH CONNECTION CHECK ----------
           Only check particle pairs in the same or neighboring grid cell.
           For 600+ particles this is ~50-100x faster than the naive O(n²). */
        function drawConnections(parallaxY) {
            if (!config.drawConnections) return;
            const maxDist = config.connectionDistance;
            const maxDistSq = maxDist * maxDist;

            // 1) clear grid buckets
            for (let i = 0; i < grid.length; i++) grid[i].length = 0;

            // 2) bucket particles by physics position (margin included)
            for (let i = 0; i < particles.length; i++) {
                const cell = particleCell(particles[i]);
                grid[cell.cy * cols + cell.cx].push(i);
            }

            // (Cursor-to-particle "spider-web" lines intentionally removed — the
            // user prefers only the lattice connections between particles.)

            // 3) particle-to-particle lines via grid neighbors only
            for (let cy = 0; cy < rows; cy++) {
                for (let cx = 0; cx < cols; cx++) {
                    const cell = grid[cy * cols + cx];
                    if (cell.length === 0) continue;

                    for (let ci = 0; ci < cell.length; ci++) {
                        const i = cell[ci];
                        const a = particles[i];

                        for (let dy = -1; dy <= 1; dy++) {
                            for (let dx = -1; dx <= 1; dx++) {
                                if (dy < 0 || (dy === 0 && dx <= 0)) continue;
                                const ncx = cx + dx;
                                const ncy = cy + dy;
                                if (ncx < 0 || ncx >= cols || ncy < 0 || ncy >= rows) continue;
                                const ncell = grid[ncy * cols + ncx];
                                if (ncell.length === 0) continue;

                                for (let cj = 0; cj < ncell.length; cj++) {
                                    const j = ncell[cj];
                                    if (j <= i && dy === 0 && dx === 0) continue;
                                    const b = particles[j];
                                    const bdx = a.x - b.x;
                                    const bdy = a.y - b.y;
                                    const distSq = bdx * bdx + bdy * bdy;
                                    if (distSq < maxDistSq) {
                                        const dist = Math.sqrt(distSq);
                                        const t = 1 - dist / maxDist;
                                        const smooth = t * t * (3 - 2 * t);
                                        const lineAlpha = smooth * config.lineOpacity;
                                        if (lineAlpha < 0.04) continue;
                                        const useAccent = (a.accent || b.accent);
                                        ctx.beginPath();
                                        ctx.moveTo(a.x, a.y + parallaxY);
                                        ctx.lineTo(b.x, b.y + parallaxY);
                                        ctx.strokeStyle = (useAccent ? config.colors.accentLineColor : config.colors.lineColor)
                                            + lineAlpha + ')';
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

        function drawParticle(p, parallaxY) {
            const sy = p.y + parallaxY;
            // Twinkle: opacity oscillates softly
            const twinkleAmp = p.accent ? 0.22 : 0.14;
            const opacity = Math.max(0, Math.min(1,
                p.baseOpacity + Math.sin(p.twinkle) * twinkleAmp
            ));

            // Core dot
            ctx.beginPath();
            ctx.arc(p.x, sy, p.r, 0, Math.PI * 2);
            ctx.fillStyle = (p.accent ? config.colors.accentColor : config.colors.particleColor) + opacity + ')';
            ctx.fill();

            // Soft halo on accent ("hub") particles — dimmer than before
            if (p.accent && config.drawGlow) {
                const glowR = p.r * 4.2;
                const grad = ctx.createRadialGradient(p.x, sy, p.r * 0.5, p.x, sy, glowR);
                grad.addColorStop(0, config.colors.glowColor + (opacity * 0.28) + ')');
                grad.addColorStop(0.5, config.colors.glowColor + (opacity * 0.06) + ')');
                grad.addColorStop(1, config.colors.glowColor + '0)');
                ctx.beginPath();
                ctx.arc(p.x, sy, glowR, 0, Math.PI * 2);
                ctx.fillStyle = grad;
                ctx.fill();
            }
        }

        function render(mouse, mouseVx, mouseVy) {
            const parallaxY = parallaxOffset();
            ctx.clearRect(0, 0, width, height);
            for (const p of particles) update(p, mouse, parallaxY, mouseVx, mouseVy);
            drawConnections(parallaxY);
            for (const p of particles) drawParticle(p, parallaxY);
        }

        return { resize, render };
    }

    /* ============================================================
       LAYER CONFIGS — edit density / sizes / parallax here
       ============================================================ */

    // NEAR — foreground, fast drift, big swirl radius
    const NEAR_CONFIG = {
        density: 0.00042,
        maxParticles: 420,
        minSpeed: 0.30,
        maxSpeed: 1.05,
        minRadius: 1.4,
        maxRadius: 2.8,
        connectionDistance: 130,
        accentRatio: 0.18,
        drawConnections: true,
        drawGlow: true,
        parallaxFactor: 0.18,                           // gentle scroll-coupled motion
        colors: NEAR_COLORS,
        lineOpacity: 0.32,
        lineWidth: 0.8,
        reactsToMouse: true,
        mouseInfluence: 70,                             // tighter physical "ball" — push stays very local
        mouseForce: 0.45,                               // strong transfer inside the ball
    };

    // BACK — distant, slower, gentler swirl
    const BACK_CONFIG = {
        density: 0.00046,
        maxParticles: 460,
        minSpeed: 0.15,
        maxSpeed: 0.45,
        minRadius: 0.7,
        maxRadius: 1.6,
        connectionDistance: 95,
        accentRatio: 0.10,
        drawConnections: true,
        drawGlow: false,
        parallaxFactor: 0.09,                           // slower scroll-coupling (depth)
        colors: BACK_COLORS,
        lineOpacity: 0.22,
        lineWidth: 0.55,
        reactsToMouse: true,
        mouseInfluence: 55,
        mouseForce: 0.30,                               // distant layer still moves but a touch less
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

    /* Animation loop — also tracks cursor velocity per frame. When the cursor
       is still, mouseVx/mouseVy decay to 0 within a frame and particles drift
       freely through the influence circle. */
    let animationId = null;
    let prevMouseX = mouse.x;
    let prevMouseY = mouse.y;
    function animate() {
        const mvx = mouse.x - prevMouseX;
        const mvy = mouse.y - prevMouseY;
        prevMouseX = mouse.x;
        prevMouseY = mouse.y;
        for (const layer of layers) layer.render(mouse, mvx, mvy);
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
