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

   Tune maxParticles (per screen), sizes / parallax in NEAR_CONFIG and BACK_CONFIG.
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

        let worldMinX = 0, worldMaxX = 0, worldMinY = 0, worldMaxY = 0;
        let pageHeight = 0;

        const MARGIN_X = 30;
        const WRAP_Y_NEAR = 30;
        const MARGIN_Y_DOC = 80;

        function documentHeight() {
            return Math.max(
                height,
                document.documentElement.scrollHeight || 0,
                document.body ? document.body.scrollHeight : 0
            );
        }

        function computeWorldBounds() {
            pageHeight = documentHeight();
            worldMinX = -MARGIN_X;
            worldMaxX = width + MARGIN_X;
            worldMinY = -WRAP_Y_NEAR;
            worldMaxY = pageHeight + WRAP_Y_NEAR + MARGIN_Y_DOC;
        }

        function randomPageY() {
            return Math.random() * pageHeight;
        }

        let lastWidth = 0;
        function resize() {
            const newWidth = window.innerWidth;
            const newHeight = window.innerHeight;

            // On mobile, ignore height-only resizing (dynamic browser address bar changes)
            if (newWidth === lastWidth && newWidth <= 768) {
                // Just update canvas height boundaries so rendering fills the screen,
                // but do NOT clear the particles array or trigger spawn()!
                width = newWidth;
                height = newHeight;
                canvas.width = width * dpr;
                canvas.height = height * dpr;
                canvas.style.width = width + 'px';
                canvas.style.height = height + 'px';
                ctx.setTransform(1, 0, 0, 1, 0, 0);
                ctx.scale(dpr, dpr);
                computeWorldBounds();
                return;
            }

            lastWidth = newWidth;
            width = newWidth;
            height = newHeight;
            canvas.width = width * dpr;
            canvas.height = height * dpr;
            canvas.style.width = width + 'px';
            canvas.style.height = height + 'px';
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.scale(dpr, dpr);
            spawn();
        }

        function gridCellSize() {
            return config.connectionDistance || 100;
        }

        /* Viewport grid for connections — bucket by on-screen position (shifted by pad for boundary stability) */
        function particleViewCell(p, parallaxY, viewCols, viewRows, cellSize, pad) {
            const cx = (((p.x + pad) / cellSize) | 0);
            const cy = ((((p.y + parallaxY + pad) / cellSize) | 0));
            if (cx < 0 || cx >= viewCols || cy < 0 || cy >= viewRows) return null;
            return { cx, cy };
        }

        function lineVisible(sy, pad) {
            return sy > -pad && sy < height + pad;
        }

        function spawn() {
            computeWorldBounds();
            /* maxParticles = per-screen target; × page length for site-wide uniform spread */
            const pageScale = Math.max(1, pageHeight / height);
            const target = Math.min(8000, Math.floor(config.maxParticles * pageScale));
            
            if (particles.length === 0) {
                // First spawn: build the full target
                for (let i = 0; i < target; i++) {
                    particles.push(make(randomPageY()));
                }
            } else if (particles.length < target) {
                // Viewport grew: add new particles without resetting existing active ones!
                const diff = target - particles.length;
                for (let i = 0; i < diff; i++) {
                    particles.push(make(randomPageY()));
                }
            } else if (particles.length > target) {
                // Viewport shrunk: trim smoothly from the end to preserve remaining active ones
                particles.length = target;
            }
        }

        function make(spawnY) {
            const angle = Math.random() * Math.PI * 2;
            /* Two random samples → wider, more natural spread of speeds per particle */
            const t1 = Math.random();
            const t2 = Math.random();
            const span = config.maxSpeed - config.minSpeed;
            const speed = config.minSpeed + (t1 + t2) * 0.5 * span;
            const wobble = 0.7 + Math.random() * 0.6;
            const isAccent = Math.random() < config.accentRatio;
            const vx = Math.cos(angle) * speed * wobble;
            const vy = Math.sin(angle) * speed * wobble;
            return {
                x: Math.random() * width,
                y: spawnY,
                vx: vx,
                vy: vy,
                baseVx: vx,                                  // remembered for damping-back
                baseVy: vy,
                speed: speed * wobble,
                r: isAccent
                    ? config.minRadius + Math.random() * (config.maxRadius - config.minRadius) * 1.8
                    : config.minRadius + Math.random() * (config.maxRadius - config.minRadius),
                accent: isAccent,
                twinkle: Math.random() * Math.PI * 2,
                twinkleSpeed: 0.015 + Math.random() * 0.030,
                baseOpacity: (config.baseOpacityMin || 0.30)
                    + Math.random() * (config.baseOpacityRange || 0.30),
            };
        }

        function parallaxOffset(scrollYVal) {
            return -scrollYVal * (1 - (config.parallaxFactor || 0));
        }

        function update(p, mouse, parallaxY, mouseVx, mouseVy, dt) {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.twinkle += p.twinkleSpeed * dt;

            // 1. Organic Fluid Steering Field (sinusoidal underwater harmonic currents)
            const timeScale = p.twinkle * 0.15;
            const flowAngle = Math.sin(p.x * 0.0035 + timeScale) * Math.PI 
                            + Math.cos(p.y * 0.0035 - timeScale * 1.3) * Math.PI * 0.5;
            
            const currentSpeed = (p.speed || config.minSpeed) * 0.28;
            const currentVx = Math.cos(flowAngle) * currentSpeed;
            const currentVy = Math.sin(flowAngle) * currentSpeed;

            // Gently blend the local fluid current into the natural drift velocity
            p.vx += (currentVx - p.vx) * 0.015 * dt;
            p.vy += (currentVy - p.vy) * 0.015 * dt;

            // 2. Upgraded Dual-Action Cursor Interaction (Radial Repulsion + Momentum Transfer)
            if (config.reactsToMouse && mouse.active) {
                const dx = p.x - mouse.x;
                const dy = (p.y + parallaxY) - mouse.y;
                const distSq = dx * dx + dy * dy;
                const isMobile = window.innerWidth <= 768;
                const infl = isMobile ? config.mouseInfluence * 0.8 : config.mouseInfluence * 1.15;

                if (distSq < infl * infl) {
                    const dist = Math.sqrt(distSq) || 0.1;
                    const t = 1 - dist / infl;              // 0 at edge, 1 at center
                    const eased = t * t * (3 - 2 * t);      // smoothstep easing

                    // A. Radial Elastic Repulsion (creates a tactile bubble around cursor even when stationary)
                    const repelForce = isMobile ? 0.38 : 0.95;
                    const rx = (dx / dist) * repelForce * eased;
                    const ry = (dy / dist) * repelForce * eased;
                    p.vx += rx * dt;
                    p.vy += ry * dt;

                    // B. Dynamic Kinetic Push (transfers mouse swipe momentum)
                    if (mouseVx !== 0 || mouseVy !== 0) {
                        const cursorMag = Math.sqrt(mouseVx * mouseVx + mouseVy * mouseVy);
                        if (cursorMag > 0.01) {
                            const cosTheta = (mouseVx * dx + mouseVy * dy) / (cursorMag * dist);
                            const frontness = Math.max(0, cosTheta);
                            if (frontness > 0) {
                                const CAP = isMobile ? 8 : 25;
                                const cvx = Math.max(-CAP, Math.min(CAP, mouseVx));
                                const cvy = Math.max(-CAP, Math.min(CAP, mouseVy));
                                const force = isMobile ? config.mouseForce * 0.6 : config.mouseForce;
                                const k = eased * force * frontness;
                                p.vx += cvx * k * dt;
                                p.vy += cvy * k * dt;
                            }
                        }
                    }
                }
            }

            // Damp velocity back toward natural drift, framedelta adjusted.
            const damp = 0.07 * dt;
            p.vx += (p.baseVx - p.vx) * Math.min(0.99, damp);
            p.vy += (p.baseVy - p.vy) * Math.min(0.99, damp);

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
                p.y = randomPageY();
            } else if (p.x > width + MARGIN_X) {
                p.x = -MARGIN_X;
                p.y = randomPageY();
            }
            if (p.y < worldMinY) {
                p.y = randomPageY();
                p.x = Math.random() * width;
            } else if (p.y > worldMaxY) {
                p.y = randomPageY();
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
            const cellSize = gridCellSize();
            const pad = maxDist;

            const gridWidth = width + 2 * pad;
            const gridHeight = height + 2 * pad;
            const viewCols = Math.ceil(gridWidth / cellSize) + 1;
            const viewRows = Math.ceil(gridHeight / cellSize) + 1;
            
            const viewGrid = new Array(viewCols * viewRows);
            for (let g = 0; g < viewGrid.length; g++) viewGrid[g] = [];

            for (let i = 0; i < particles.length; i++) {
                const p = particles[i];
                const sy = p.y + parallaxY;
                if (!lineVisible(sy, pad)) continue;
                const cell = particleViewCell(p, parallaxY, viewCols, viewRows, cellSize, pad);
                if (!cell) continue;
                viewGrid[cell.cy * viewCols + cell.cx].push(i);
            }

            for (let cy = 0; cy < viewRows; cy++) {
                for (let cx = 0; cx < viewCols; cx++) {
                    const cell = viewGrid[cy * viewCols + cx];
                    if (cell.length === 0) continue;

                    for (let ci = 0; ci < cell.length; ci++) {
                        const i = cell[ci];
                        const a = particles[i];
                        const ay = a.y + parallaxY;

                        for (let dy = -1; dy <= 1; dy++) {
                            for (let dx = -1; dx <= 1; dx++) {
                                if (dy < 0 || (dy === 0 && dx < 0)) continue;
                                const ncx = cx + dx;
                                const ncy = cy + dy;
                                if (ncx < 0 || ncx >= viewCols || ncy < 0 || ncy >= viewRows) continue;
                                const ncell = viewGrid[ncy * viewCols + ncx];
                                if (ncell.length === 0) continue;

                                for (let cj = 0; cj < ncell.length; cj++) {
                                    const j = ncell[cj];
                                    if (j <= i && dy === 0 && dx === 0) continue;
                                    const b = particles[j];
                                    const by = b.y + parallaxY;
                                    if (!lineVisible(ay, pad) && !lineVisible(by, pad)) continue;
                                    const bdx = a.x - b.x;
                                    const bdy = a.y - b.y;
                                    const distSq = bdx * bdx + bdy * bdy;
                                    if (distSq < maxDistSq) {
                                        const dist = Math.sqrt(distSq);
                                        const t = 1 - dist / maxDist;
                                        const smooth = t * t * (3 - 2 * t);
                                        const lineAlpha = smooth * config.lineOpacity;
                                        if (lineAlpha < 0.01) continue;

                                        const useAccent = (a.accent || b.accent);
                                        ctx.beginPath();
                                        ctx.moveTo(a.x, ay);
                                        ctx.lineTo(b.x, by);
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
            if (sy < -80 || sy > height + 80) return;
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

        function render(mouse, mouseVx, mouseVy, dt, scrollYVal) {
            const parallaxY = parallaxOffset(scrollYVal);
            ctx.clearRect(0, 0, width, height);
            for (const p of particles) update(p, mouse, parallaxY, mouseVx, mouseVy, dt);
            drawConnections(parallaxY);
            for (const p of particles) drawParticle(p, parallaxY);
        }

        return { resize, render };
    }

    /* ============================================================
       LAYER CONFIGS — edit maxParticles / sizes / parallax here
       ============================================================ */

    // NEAR — foreground (maxParticles = count per screen; site-wide via spawn × page height)
    const NEAR_CONFIG = {
        maxParticles: 90,
        minSpeed: 0.12,
        maxSpeed: 0.48,
        minRadius: 1.4,
        maxRadius: 2.8,
        connectionDistance: 150,
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

    // BACK — background (8× foreground per screen, site-wide distribution)
    const BACK_CONFIG = {
        maxParticles: 360,
        baseOpacityMin: 0.42,
        baseOpacityRange: 0.38,
        minSpeed: 0.24,
        maxSpeed: 0.96,
        minRadius: 0.7,
        maxRadius: 1.6,
        connectionDistance: 110,
        accentRatio: 0.10,
        drawConnections: true,
        drawGlow: false,
        parallaxFactor: 0.09,                           // slower scroll-coupling (depth)
        colors: BACK_COLORS,
        lineOpacity: 0.30,
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

    /* Mouse and Touch tracking */
    const mouse = { x: -1000, y: -1000, active: false };

    function setMousePos(clientX, clientY) {
        mouse.x = clientX;
        mouse.y = clientY;
        mouse.active = true;
    }

    window.addEventListener('mousemove', (e) => {
        setMousePos(e.clientX, e.clientY);
    });
    window.addEventListener('mouseleave', () => {
        mouse.active = false;
        mouse.x = -1000;
        mouse.y = -1000;
    });

    window.addEventListener('touchstart', (e) => {
        if (e.touches.length > 0) {
            setMousePos(e.touches[0].clientX, e.touches[0].clientY);
            prevMouseX = mouse.x;
            prevMouseY = mouse.y;
        }
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
        if (e.touches.length > 0) {
            setMousePos(e.touches[0].clientX, e.touches[0].clientY);
        }
    }, { passive: true });

    window.addEventListener('touchend', () => {
        mouse.active = false;
        mouse.x = -1000;
        mouse.y = -1000;
    });

    /* Animation loop — delta-time corrected & scroll interpolated for cinematic smoothness */
    let animationId = null;
    let prevMouseX = mouse.x;
    let prevMouseY = mouse.y;
    let lastTime = performance.now();
    let currentScrollY = window.scrollY;

    function animate(currentTime) {
        if (!currentTime) currentTime = performance.now();
        const rawDt = currentTime - lastTime;
        lastTime = currentTime;

        // Clamp rawDt to 100ms max to prevent massive leaps when swapping windows/tabs,
        // and normalize to standard 60fps frame rate (16.66ms per frame = 1.0)
        const dt = Math.min(100, rawDt) / 16.666;

        // Smooth scroll interpolation (smooths out scroll events, dynamic mobile toolbars, touch swipes)
        const targetScrollY = window.scrollY;
        currentScrollY += (targetScrollY - currentScrollY) * Math.min(1.0, 0.35 * dt);

        let mvx = 0;
        let mvy = 0;
        // Only compute velocity if pointer was active and on screen in both current and previous frames
        if (mouse.active && prevMouseX > -500 && mouse.x > -500) {
            mvx = mouse.x - prevMouseX;
            mvy = mouse.y - prevMouseY;
        }
        prevMouseX = mouse.x;
        prevMouseY = mouse.y;

        for (const layer of layers) layer.render(mouse, mvx, mvy, dt, currentScrollY);
        animationId = requestAnimationFrame(animate);
    }

    window.addEventListener('resize', () => {
        for (const layer of layers) layer.resize();
    });

    /* Re-spawn when page length settles (images, fonts, lazy content) */
    let pageHeightTimer = null;
    function schedulePageHeightSync() {
        clearTimeout(pageHeightTimer);
        pageHeightTimer = setTimeout(() => {
            for (const layer of layers) layer.resize();
        }, 400);
    }
    window.addEventListener('load', schedulePageHeightSync);
    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(schedulePageHeightSync);
    }

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            if (animationId) cancelAnimationFrame(animationId);
            animationId = null;
        } else if (!animationId) {
            lastTime = performance.now(); // reset timestamp to prevent delta jumps when resuming!
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
