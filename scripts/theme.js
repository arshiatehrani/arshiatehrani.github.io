/* ============================================================
   THEME TOGGLE — light / dark with persistence
   ----------------------------------------------------------
   On boot: read saved preference from localStorage. If none,
   fall back to the OS-level prefers-color-scheme. Then expose
   a global toggle and dispatch a 'themechange' event so other
   modules (particles.js) can repaint.
   ============================================================ */
(function () {
    'use strict';

    const STORAGE_KEY = 'site-theme';
    const root = document.documentElement;

    function getInitial() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved === 'light' || saved === 'dark') return saved;
        } catch (_) { /* localStorage might be unavailable */ }
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
            return 'light';
        }
        return 'dark';
    }

    function applyTheme(theme) {
        root.setAttribute('data-theme', theme);
        try { localStorage.setItem(STORAGE_KEY, theme); } catch (_) {}
        // Sync icon state on every toggle button on the page
        document.querySelectorAll('.theme-toggle').forEach((btn) => {
            btn.setAttribute('aria-pressed', theme === 'light' ? 'true' : 'false');
            btn.setAttribute('aria-label',
                theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode');
        });
        // Notify other modules (particles, map basemap, ...)
        window.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));
    }

    // Apply ASAP to avoid the wrong-theme flash
    applyTheme(getInitial());

    // Wire all toggle buttons (call after DOM is ready)
    function wireToggles() {
        document.querySelectorAll('.theme-toggle').forEach((btn) => {
            if (btn.dataset.wired) return;
            btn.dataset.wired = '1';
            btn.addEventListener('click', () => {
                const next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
                applyTheme(next);
            });
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', wireToggles);
    } else {
        wireToggles();
    }

    // Follow OS theme changes ONLY if the user hasn't set a preference
    if (window.matchMedia) {
        const mq = window.matchMedia('(prefers-color-scheme: light)');
        const handler = (e) => {
            try {
                if (localStorage.getItem(STORAGE_KEY)) return;  // user override exists
            } catch (_) {}
            applyTheme(e.matches ? 'light' : 'dark');
        };
        if (mq.addEventListener) mq.addEventListener('change', handler);
        else if (mq.addListener) mq.addListener(handler);
    }

    // Expose a tiny global API
    window.SiteTheme = {
        get: () => root.getAttribute('data-theme'),
        set: applyTheme,
        toggle: () => applyTheme(root.getAttribute('data-theme') === 'light' ? 'dark' : 'light'),
    };
})();
