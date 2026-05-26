/* ============================================================
   INTERACTIVE PARTICLE NETWORK — Antigravity-style
   Two layers for depth: a slow distant layer + a faster near layer.
   - Particles drift, connect with thin lines when close
   - Near layer reacts to mouse (gentle repulsion + connecting lines)
   - DPR-aware, auto-resizes, pauses when tab hidden

   If you ever want to swap to a library, tsparticles is a great pick:
   https://github.com/tsparticles/tsparticles
   ============================================================ */
(function () {
    'use strict';

    /* ---------- Layer constructor ---------- */
    function makeLayer(canvasId, config) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return null;
        const ctx = canvas.getContext('2d', { alpha: true });

        let particles = [];
        let width = 0, height = 0;
        let dpr = Math.min(window.devicePixelRatio || 1, 2);

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
            return {
                x: Math.random() * width,
                y: Math.random() * height,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                r: config.minRadius + Math.random() * (config.maxRadius - config.minRadius),
                accent: Math.random() < config.accentRatio,
                pulse: Math.random() * Math.PI * 2,
            };
        }

        function update(p, mouse) {
            p.x += p.vx;
            p.y += p.vy;
            p.pulse += 0.02;

            if (config.reactsToMouse && mouse.active) {
                const dx = p.x - mouse.x;
                const dy = p.y - mouse.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < config.mouseInfluence && dist > 0) {
                    const force = (1 - dist / config.mouseInfluence) * config.mouseForce;
                    p.x += (dx / dist) * force;
                    p.y += (dy / dist) * force;
                }
            }

            if (p.x < -20) p.x = width + 20;
            if (p.x > width + 20) p.x = -20;
            if (p.y < -20) p.y = height + 20;
            if (p.y > height + 20) p.y = -20;
        }

        function drawConnections(mouse) {
            const maxDist = config.connectionDistance;
            const maxDistSq = maxDist * maxDist;

            for (let i = 0; i < particles.length; i++) {
                const a = particles[i];

                if (config.reactsToMouse && mouse.active) {
                    const mdx = a.x - mouse.x;
                    const mdy = a.y - mouse.y;
                    const mdistSq = mdx * mdx + mdy * mdy;
                    const mc = config.mouseInfluence * 1.4;
                    if (mdistSq < mc * mc) {
                        const alpha = 1 - Math.sqrt(mdistSq) / mc;
                        ctx.beginPath();
                        ctx.moveTo(a.x, a.y);
                        ctx.lineTo(mouse.x, mouse.y);
                        ctx.strokeStyle = config.mouseLineColor + (alpha * 0.45) + ')';
                        ctx.lineWidth = 1;
                        ctx.stroke();
                    }
                }

                for (let j = i + 1; j < particles.length; j++) {
                    const b = particles[j];
                    const dx = a.x - b.x;
                    const dy = a.y - b.y;
                    const distSq = dx * dx + dy * dy;
                    if (distSq < maxDistSq) {
                        const alpha = 1 - Math.sqrt(distSq) / maxDist;
                        ctx.beginPath();
                        ctx.moveTo(a.x, a.y);
                        ctx.lineTo(b.x, b.y);
                        ctx.strokeStyle = (a.accent || b.accent ? config.accentLineColor : config.lineColor) + (alpha * config.lineOpacity) + ')';
                        ctx.lineWidth = config.lineWidth;
                        ctx.stroke();
                    }
                }
            }
        }

        function drawParticle(p) {
            const pulseSize = p.r + Math.sin(p.pulse) * 0.3;
            ctx.beginPath();
            ctx.arc(p.x, p.y, pulseSize, 0, Math.PI * 2);
            ctx.fillStyle = (p.accent ? config.accentColor : config.particleColor) + config.particleOpacity + ')';
            ctx.fill();

            // soft outer glow on accent particles
            if (p.accent) {
                ctx.beginPath();
                ctx.arc(p.x, p.y, pulseSize * 2.5, 0, Math.PI * 2);
                ctx.fillStyle = config.accentColor + '0.08)';
                ctx.fill();
            }
        }

        function render(mouse) {
            ctx.clearRect(0, 0, width, height);
            for (const p of particles) update(p, mouse);
            drawConnections(mouse);
            for (const p of particles) drawParticle(p);
        }

        return { resize, render, get count() { return particles.length; } };
    }

    /* ---------- LAYER CONFIG — tweak here to taste ---------- */
    // Near (foreground): denser, reacts to mouse
    const NEAR_CONFIG = {
        density: 0.00022,               // ~2.4x denser than before
        maxParticles: 260,
        minSpeed: 0.12,
        maxSpeed: 0.45,
        minRadius: 1.0,
        maxRadius: 2.4,
        connectionDistance: 130,
        accentRatio: 0.22,
        particleColor: 'rgba(154, 177, 201, ',     // fog light
        accentColor: 'rgba(176, 168, 196, ',       // fog lavender
        lineColor: 'rgba(154, 177, 201, ',
        accentLineColor: 'rgba(176, 168, 196, ',
        mouseLineColor: 'rgba(176, 168, 196, ',
        particleOpacity: '0.85)',
        lineOpacity: 0.4,
        lineWidth: 0.7,
        reactsToMouse: true,
        mouseInfluence: 170,
        mouseForce: 1.6,
    };

    // Back (distant): slower, sparser, deeper, no mouse interaction
    const BACK_CONFIG = {
        density: 0.00010,
        maxParticles: 140,
        minSpeed: 0.04,
        maxSpeed: 0.15,
        minRadius: 0.6,
        maxRadius: 1.4,
        connectionDistance: 95,
        accentRatio: 0.15,
        particleColor: 'rgba(74, 127, 179, ',      // fog blue
        accentColor: 'rgba(0, 33, 71, ',           // oxford blue
        lineColor: 'rgba(74, 127, 179, ',
        accentLineColor: 'rgba(0, 33, 71, ',
        mouseLineColor: 'rgba(74, 127, 179, ',
        particleOpacity: '0.55)',
        lineOpacity: 0.25,
        lineWidth: 0.5,
        reactsToMouse: false,
    };

    /* ---------- Build layers ---------- */
    const layers = [
        makeLayer('particle-canvas-back', BACK_CONFIG),
        makeLayer('particle-canvas', NEAR_CONFIG),
    ].filter(Boolean);

    if (layers.length === 0) return;

    /* ---------- Mouse tracking ---------- */
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

    /* ---------- Animation loop ---------- */
    let animationId = null;
    function animate() {
        for (const layer of layers) layer.render(mouse);
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

    // Reduced motion: nearly freeze particles
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        NEAR_CONFIG.maxSpeed = 0.05; NEAR_CONFIG.minSpeed = 0;
        BACK_CONFIG.maxSpeed = 0.02; BACK_CONFIG.minSpeed = 0;
    }

    for (const layer of layers) layer.resize();
    animate();
})();
