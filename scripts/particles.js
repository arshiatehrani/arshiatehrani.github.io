/* ============================================================
   INTERACTIVE PARTICLE NETWORK BACKGROUND
   - Particles drift, connect with lines when close
   - React to mouse: nearby particles are pushed away
   - Auto-adapts to screen size and device pixel ratio
   ============================================================ */
(function () {
    'use strict';

    const canvas = document.getElementById('particle-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });

    // -------- TUNABLES --------
    const CONFIG = {
        particleDensity: 0.00009,   // particles per pixel of viewport area
        maxParticles: 140,           // hard cap (for performance)
        minSpeed: 0.15,
        maxSpeed: 0.5,
        particleRadius: 1.8,
        connectionDistance: 140,     // px; lines drawn between particles closer than this
        mouseInfluence: 160,         // px; mouse repulsion radius
        mouseForce: 1.5,             // strength of mouse repulsion
        particleColor: 'rgba(0, 212, 255, ',   // base color (alpha is appended)
        lineColor: 'rgba(0, 212, 255, ',
        accentColor: 'rgba(145, 94, 255, ',
    };

    let particles = [];
    let mouse = { x: -1000, y: -1000, active: false };
    let width = 0;
    let height = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let animationId = null;

    function resize() {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
        ctx.scale(dpr, dpr);
        spawnParticles();
    }

    function spawnParticles() {
        const target = Math.min(
            CONFIG.maxParticles,
            Math.floor(width * height * CONFIG.particleDensity)
        );
        particles = [];
        for (let i = 0; i < target; i++) {
            particles.push(createParticle());
        }
    }

    function createParticle() {
        const angle = Math.random() * Math.PI * 2;
        const speed = CONFIG.minSpeed + Math.random() * (CONFIG.maxSpeed - CONFIG.minSpeed);
        return {
            x: Math.random() * width,
            y: Math.random() * height,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            r: CONFIG.particleRadius * (0.5 + Math.random() * 0.8),
            // mix some accent-colored particles for visual interest
            accent: Math.random() < 0.25,
        };
    }

    function updateParticle(p) {
        // base motion
        p.x += p.vx;
        p.y += p.vy;

        // mouse repulsion
        if (mouse.active) {
            const dx = p.x - mouse.x;
            const dy = p.y - mouse.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < CONFIG.mouseInfluence && dist > 0) {
                const force = (1 - dist / CONFIG.mouseInfluence) * CONFIG.mouseForce;
                p.x += (dx / dist) * force;
                p.y += (dy / dist) * force;
            }
        }

        // wrap edges (particles flow infinitely)
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;
        if (p.y < -10) p.y = height + 10;
        if (p.y > height + 10) p.y = -10;
    }

    function drawParticle(p) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = (p.accent ? CONFIG.accentColor : CONFIG.particleColor) + '0.8)';
        ctx.fill();
    }

    function drawConnections() {
        const maxDist = CONFIG.connectionDistance;
        const maxDistSq = maxDist * maxDist;

        for (let i = 0; i < particles.length; i++) {
            const a = particles[i];

            // line from particle to mouse (only when mouse is over the page)
            if (mouse.active) {
                const mdx = a.x - mouse.x;
                const mdy = a.y - mouse.y;
                const mdistSq = mdx * mdx + mdy * mdy;
                const mouseConnect = CONFIG.mouseInfluence * 1.3;
                if (mdistSq < mouseConnect * mouseConnect) {
                    const alpha = 1 - Math.sqrt(mdistSq) / mouseConnect;
                    ctx.beginPath();
                    ctx.moveTo(a.x, a.y);
                    ctx.lineTo(mouse.x, mouse.y);
                    ctx.strokeStyle = CONFIG.accentColor + (alpha * 0.4) + ')';
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }
            }

            // particle-to-particle lines
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
                    ctx.strokeStyle = CONFIG.lineColor + (alpha * 0.35) + ')';
                    ctx.lineWidth = 0.8;
                    ctx.stroke();
                }
            }
        }
    }

    function animate() {
        ctx.clearRect(0, 0, width, height);

        for (const p of particles) updateParticle(p);
        drawConnections();
        for (const p of particles) drawParticle(p);

        animationId = requestAnimationFrame(animate);
    }

    // Pause animation when tab is hidden (saves battery)
    function handleVisibility() {
        if (document.hidden) {
            if (animationId) cancelAnimationFrame(animationId);
            animationId = null;
        } else if (!animationId) {
            animate();
        }
    }

    // Event wiring
    window.addEventListener('resize', () => {
        // reset transform before scaling again on resize
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        resize();
    });

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

    document.addEventListener('visibilitychange', handleVisibility);

    // Respect reduced motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        CONFIG.minSpeed = 0;
        CONFIG.maxSpeed = 0.05;
    }

    resize();
    animate();
})();
