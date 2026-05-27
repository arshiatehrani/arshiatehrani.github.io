/* ============================================================
   LAZY ARCGIS LOADER — only loads the heavy map SDK when the
   World section is near the viewport (saves ~2MB+ on initial load).
   ============================================================ */
(function () {
    'use strict';

    const embed = document.getElementById('world-map-embed');
    if (!embed) return;

    let loaded = false;

    function initMap() {
        function tryInit() {
            if (typeof require === 'undefined' || typeof window.initWorldMap !== 'function') {
                setTimeout(tryInit, 100);
                return;
            }
            window.initWorldMap('world-map-embed', {
                initialZoom: 2,
                center: [15, 25],
                showScaleBar: false,
                disableScrollZoom: true,
            });
        }
        tryInit();
    }

    function loadArcGIS() {
        if (loaded) return;
        loaded = true;

        const css = document.createElement('link');
        css.rel = 'stylesheet';
        css.href = 'https://js.arcgis.com/4.29/esri/themes/dark/main.css';
        document.head.appendChild(css);

        const script = document.createElement('script');
        script.src = 'https://js.arcgis.com/4.29/';
        script.async = true;
        script.onload = initMap;
        document.body.appendChild(script);
    }

    const observer = new IntersectionObserver(
        (entries) => {
            if (entries.some((e) => e.isIntersecting)) {
                loadArcGIS();
                observer.disconnect();
            }
        },
        { rootMargin: '300px' }
    );
    observer.observe(embed);
})();
