/* ============================================================
   WORLD MAP RENDERER — used by both pages
   Call window.initWorldMap('containerId', { initialZoom, etc. })
   after the ArcGIS API has loaded. Reads CSV data from
   window.STAYS / window.WELL_EXPLORED / window.TRAVELS.
   ============================================================ */
window.initWorldMap = function (containerId, opts) {
    opts = opts || {};
    if (typeof require === 'undefined') {
        console.warn('ArcGIS API not loaded yet');
        return;
    }

    require([
        "esri/Map",
        "esri/views/MapView",
        "esri/Graphic",
        "esri/layers/GraphicsLayer",
        "esri/widgets/ScaleBar"
    ], function (Map, MapView, Graphic, GraphicsLayer, ScaleBar) {

        // Two basemaps we'll toggle between (theme-aware)
        function currentMapBasemap() {
            return document.documentElement.getAttribute('data-theme') === 'light'
                ? 'gray-vector'           // light fog map for light theme
                : 'dark-gray-vector';     // dark map for dark theme
        }
        const SAT_BASEMAP = "satellite";

        const map = new Map({ basemap: currentMapBasemap() });

        const view = new MapView({
            container: containerId,
            map: map,
            zoom: opts.initialZoom || 2,
            center: opts.center || [10, 25],
            constraints: {
                minZoom: opts.minZoom || 2,
                snapToZoom: false
            },
            ui: { components: ["attribution", "zoom"] }
        });

        // Disable scroll-wheel zoom on small embedded views so page scrolls naturally.
        if (opts.disableScrollZoom) {
            view.on("mouse-wheel", (event) => event.stopPropagation());
        }

        /* ---------- Custom themed Satellite ↔ Map toggle (top-right) ---------- */
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'basemap-toggle-btn';
        toggleBtn.setAttribute('aria-label', 'Toggle satellite view');
        toggleBtn.setAttribute('title', 'Toggle satellite / map view');

        function renderToggle(isSatellite) {
            toggleBtn.innerHTML = isSatellite
                ? '<i class="fas fa-map"></i><span>Map</span>'
                : '<i class="fas fa-satellite"></i><span>Satellite</span>';
            toggleBtn.classList.toggle('is-satellite', isSatellite);
        }

        let isSatellite = false;
        renderToggle(isSatellite);
        toggleBtn.addEventListener('click', () => {
            isSatellite = !isSatellite;
            map.basemap = isSatellite ? SAT_BASEMAP : currentMapBasemap();
            renderToggle(isSatellite);
        });

        // Swap basemap when user toggles theme (unless currently on satellite)
        window.addEventListener('themechange', () => {
            if (!isSatellite) map.basemap = currentMapBasemap();
        });
        view.ui.add(toggleBtn, "top-right");

        // Scale bar (only on the full-screen view; clutters the embed otherwise)
        if (opts.showScaleBar !== false) {
            view.ui.add(new ScaleBar({ view: view, unit: "metric" }), "bottom-left");
        }

        const layer = new GraphicsLayer();
        map.add(layer);

        /* Pin colors — match the Oxford Blue / fog theme */
        const COLOR_STAYS    = [ 74, 127, 179, 0.95 ];
        const COLOR_EXPLORED = [176, 168, 196, 0.90 ];
        const COLOR_TRAVELS  = [154, 177, 201, 0.65 ];

        function stayMarker(size) {
            return { type: "simple-marker", color: COLOR_STAYS, style: "square",
                size: size, outline: { color: [255,255,255], width: 1.2 } };
        }
        function exploredMarker(size) {
            return { type: "simple-marker", color: COLOR_EXPLORED, style: "square",
                size: size, outline: { color: [255,255,255], width: 1.2 } };
        }
        function travelMarker(size) {
            return { type: "simple-marker", color: COLOR_TRAVELS, style: "circle",
                size: size, outline: { color: [255,255,255], width: 1 } };
        }

        function addCsv(csv, markerFn, category) {
            if (!csv) return;
            const rows = csv.split('\n').slice(1);
            rows.forEach((row) => {
                const cols = row.split(',');
                if (cols.length < 3) return;
                const city = cols[0].trim();
                const lat = parseFloat(cols[1]);
                const lng = parseFloat(cols[2]);
                if (Number.isNaN(lat) || Number.isNaN(lng)) return;

                const g = new Graphic({
                    geometry: { type: "point", longitude: lng, latitude: lat },
                    symbol: markerFn(12),
                    attributes: { city, category }
                });
                g.category = category;
                layer.add(g);
            });
        }

        addCsv(window.STAYS,         stayMarker,     "stay");
        addCsv(window.WELL_EXPLORED, exploredMarker, "explored");
        addCsv(window.TRAVELS,       travelMarker,   "travel");

        /* Popup on click */
        view.popup.dockEnabled = false;
        view.on("click", (event) => {
            view.hitTest(event).then((response) => {
                const hit = response.results.find(r =>
                    r.graphic && r.graphic.attributes && r.graphic.attributes.city);
                if (!hit) return;
                const g = hit.graphic;
                view.openPopup({
                    title: g.attributes.city,
                    content: `<span style="font-family:'JetBrains Mono', monospace; color:#9ab1c9;">${g.attributes.category.toUpperCase()}</span>`,
                    location: event.mapPoint
                });
            });
        });

        /* Auto-scale pin sizes with zoom */
        view.watch("scale", () => {
            const scale = view.scale;
            const stayBase = 13 * Math.pow(45000000 / scale, 0.3);
            const travelBase = 9 * Math.pow(45000000 / scale, 0.3);

            layer.graphics.forEach((g) => {
                if (g.category === "stay")          g.symbol = stayMarker(stayBase);
                else if (g.category === "explored") g.symbol = exploredMarker(stayBase);
                else                                g.symbol = travelMarker(travelBase);
            });
        });
    });
};
