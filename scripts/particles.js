/* ============================================================
   INTERACTIVE PARTICLE NETWORK — blended edition
   ----------------------------------------------------------
   Combines the calm, network-feel of the first 2-layer version
   with the twinkle and glow-halo nodes from the denser one.

   Two layers:
     - NEAR (foreground): denser, brighter, mouse-reactive,
       includes a handful of glowing "hub" nodes with radial halos.
     - BACK (distant):    slower, smaller, subtler connections,
       gentle twinkle, no mouse interaction.

   Tune `density` / `maxParticles` per layer below to taste.
   ============================================================ */
(function () {
    'use strict';

    /* ============================================================
       LAYER ENGINE
       ============================================================ */
    function makeLayer(canvasId, config) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return null;
        const ctx = canvas.getContext('2d', { alpha: true });

        let particles = [];
        let width = 0, height = 0;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);

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
            const isAccent = Math.random() < config.accentRatio;
            return {
                x: Math.random() * width,
                y: Math.random() * height,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                // accent ("node") particles are noticeably bigger so they read as hubs
                r: isAccent
                    ? config.minRadius + Math.random() * (config.maxRadius - config.minRadius) * 1.8
                    : config.minRadius + Math.random() * (config.maxRadius - config.minRadius),
                accent: isAccent,
                twinkle: Math.random() * Math.PI * 2,
                twinkleSpeed: 0.015 + Math.random() * 0.030,
                baseOpacity: 0.55 + Math.random() * 0.4,
            };
        }

        function update(p, mouse) {
            p.x += p.vx;
            p.y += p.vy;
            p.twinkle += p.twinkleSpeed;

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

            // wrap edges so the field is endless
            if (p.x < -20) p.x = width + 20;
            if (p.x > width + 20) p.x = -20;
            if (p.y < -20) p.y = height + 20;
            if (p.y > height + 20) p.y = -20;
        }

        function drawConnections(mouse) {
            if (!config.drawConnections) return;
            const maxDist = config.connectionDistance;
            const maxDistSq = maxDist * maxDist;

            for (let i = 0; i < particles.length; i++) {
                const a = particles[i];

                // cursor-to-particle line (only when close)
                if (config.reactsToMouse && mouse.active) {
                    const mdx = a.x - mouse.x;
                    const mdy = a.y - mouse.y;
                    const mdistSq = mdx * mdx + mdy * mdy;
                    const mc = config.mouseInfluence * 1.5;
                    if (mdistSq < mc * mc) {
                        const alpha = 1 - Math.sqrt(mdistSq) / mc;
                        ctx.beginPath();
                        ctx.moveTo(a.x, a.y);
                        ctx.lineTo(mouse.x, mouse.y);
                        ctx.strokeStyle = config.mouseLineColor + (alpha * 0.55) + ')';
                        ctx.lineWidth = 1.1;
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
                        const useAccent = (a.accent || b.accent);
                        ctx.beginPath();
                        ctx.moveTo(a.x, a.y);
                        ctx.lineTo(b.x, b.y);
                        ctx.strokeStyle = (useAccent ? config.accentLineColor : config.lineColor)
                            + (alpha * config.lineOpacity) + ')';
                        ctx.lineWidth = useAccent ? config.lineWidth * 1.3 : config.lineWidth;
                        ctx.stroke();
                    }
                }
            }
        }

        function drawParticle(p) {
            // gentle opacity oscillation — bigger amplitude for the accent stars
            const twinkleAmp = p.accent ? 0.30 : 0.18;
            const opacity = Math.max(0, Math.min(1,
                p.baseOpacity + Math.sin(p.twinkle) * twinkleAmp
            ));

            // main dot
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = (p.accent ? config.accentColor : config.particleColor) + opacity + ')';
            ctx.fill();

            // bright radial halo on accent ("node") particles
            if (p.accent && config.drawGlow) {
                const glowR = p.r * 4.5;
                const grad = ctx.createRadialGradient(p.x, p.y, p.r * 0.5, p.x, p.y, glowR);
                grad.addColorStop(0, config.glowColor + (opacity * 0.45) + ')');
                grad.addColorStop(0.5, config.glowColor + (opacity * 0.10) + ')');
                grad.addColorStop(1, config.glowColor + '0)');
                ctx.beginPath();
                ctx.arc(p.x, p.y, glowR, 0, Math.PI * 2);
                ctx.fillStyle = grad;
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

    /* ============================================================
       LAYER CONFIGS
       ============================================================ */

    // NEAR — foreground, denser, with a handful of bright glowing hubs
    const NEAR_CONFIG = {
        density: 0.00055,                          // bumped from 0.00035
        maxParticles: 620,                         // bumped from 420
        minSpeed: 0.10,
        maxSpeed: 0.40,
        minRadius: 1.4,                            // slightly larger dots
        maxRadius: 2.8,
        connectionDistance: 130,
        accentRatio: 0.18,                         // ~18% bright accent "nodes"
        drawConnections: true,
        drawGlow: true,
        particleColor:   'rgba(154, 177, 201, ',   // foggy light
        accentColor:     'rgba(210, 220, 240, ',   // bright white-blue stars
        glowColor:       'rgba(130, 175, 225, ',   // blue glow
        lineColor:       'rgba(154, 177, 201, ',
        accentLineColor: 'rgba(200, 215, 240, ',
        mouseLineColor:  'rgba(220, 230, 255, ',
        lineOpacity: 0.45,
        lineWidth: 0.8,
        reactsToMouse: true,
        mouseInfluence: 190,
        mouseForce: 1.6,
    };

    // BACK — distant, slower, smaller, twinkle but no glow halos, sparser network
    const BACK_CONFIG = {
        density: 0.00030,                          // bumped from 0.00018
        maxParticles: 360,                         // bumped from 240
        minSpeed: 0.04,
        maxSpeed: 0.15,
        minRadius: 0.7,                            // slightly larger
        maxRadius: 1.6,
        connectionDistance: 95,
        accentRatio: 0.10,
        drawConnections: true,
        drawGlow: false,
        particleColor:   'rgba(74, 127, 179, ',    // foggy blue
        accentColor:     'rgba(176, 168, 196, ',   // lavender mist
        glowColor:       'rgba(74, 127, 179, ',
        lineColor:       'rgba(74, 127, 179, ',
        accentLineColor: 'rgba(176, 168, 196, ',
        mouseLineColor:  'rgba(74, 127, 179, ',
        lineOpacity: 0.32,
        lineWidth: 0.55,
        reactsToMouse: false,
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

    /* Animation loop */
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

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        for (const cfg of [NEAR_CONFIG, BACK_CONFIG]) {
            cfg.minSpeed = 0; cfg.maxSpeed = 0.02;
        }
    }

    for (const layer of layers) layer.resize();
    animate();
})();
