/* ============================================================
   WORLD EXPERIENCE MAP — Leaflet + dark "Carto" tiles
   - Pan, zoom, click pins
   - Custom themed popups (styled in main.css)
   - EDIT: replace the PLACES array with your own pins

   Pin types: 'lived' | 'visited' | 'work'
   Lat / Long: get them from Google Maps (right-click a place → coordinates)
   ============================================================ */
(function () {
    'use strict';
    if (typeof L === 'undefined') return;            // Leaflet not loaded
    const mapEl = document.getElementById('world-map');
    if (!mapEl) return;

    /* ---------- EDIT THIS LIST ---------- */
    const PLACES = [
        { name: 'Kingston, Canada', detail: 'MSc — Queen\'s University', type: 'work', lat: 44.2334, lng: -76.4940 },
        { name: 'Tehran, Iran', detail: 'Hometown', type: 'lived', lat: 35.6892, lng: 51.3890 },
        { name: 'Toronto, Canada', detail: 'Visited', type: 'visited', lat: 43.6532, lng: -79.3832 },
        { name: 'Istanbul, Turkey', detail: 'Visited', type: 'visited', lat: 41.0082, lng: 28.9784 },
        { name: 'Dubai, UAE', detail: 'Visited', type: 'visited', lat: 25.2048, lng: 55.2708 },
        // Add more like:
        // { name: 'City, Country', detail: 'What you did there', type: 'visited', lat: 0.0, lng: 0.0 },
    ];

    /* ---------- Pin colors (match site palette) ---------- */
    const COLORS = {
        lived:   { fill: '#4a7fb3', glow: 'rgba(74, 127, 179, 0.6)' },
        visited: { fill: '#b0a8c4', glow: 'rgba(176, 168, 196, 0.6)' },
        work:    { fill: '#9ab1c9', glow: 'rgba(154, 177, 201, 0.7)' },
    };

    /* ---------- Initialize map ---------- */
    const map = L.map('world-map', {
        center: [30, 15],
        zoom: 2,
        minZoom: 2,
        maxZoom: 10,
        worldCopyJump: true,
        scrollWheelZoom: false,         // wheel scrolls page, not map — feels natural
        attributionControl: true,
    });

    // Re-enable wheel zoom only when the user explicitly clicks into the map
    map.on('focus', () => map.scrollWheelZoom.enable());
    map.on('blur',  () => map.scrollWheelZoom.disable());
    map.getContainer().addEventListener('click', () => map.scrollWheelZoom.enable());
    map.getContainer().addEventListener('mouseleave', () => map.scrollWheelZoom.disable());

    // Dark themed tiles — CartoDB Dark Matter (free)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19,
    }).addTo(map);

    /* ---------- Build pins ---------- */
    function pinIcon(type) {
        const c = COLORS[type] || COLORS.visited;
        return L.divIcon({
            className: 'world-pin',
            html: `
                <span class="world-pin-outer" style="background:${c.glow};">
                    <span class="world-pin-inner" style="background:${c.fill};"></span>
                </span>
            `,
            iconSize: [22, 22],
            iconAnchor: [11, 11],
        });
    }

    PLACES.forEach((p) => {
        const marker = L.marker([p.lat, p.lng], { icon: pinIcon(p.type) }).addTo(map);
        marker.bindPopup(`<strong>${p.name}</strong>${p.detail || ''}`);
    });

    /* ---------- Pin styles (injected once) ---------- */
    const style = document.createElement('style');
    style.textContent = `
        .world-pin { display:block; width:22px; height:22px; }
        .world-pin-outer {
            display:block; width:22px; height:22px;
            border-radius:50%;
            display:flex; align-items:center; justify-content:center;
            box-shadow: 0 0 12px currentColor;
            animation: pinPulse 2.2s ease-in-out infinite;
        }
        .world-pin-inner {
            width:10px; height:10px; border-radius:50%;
            border: 2px solid rgba(255,255,255,0.85);
        }
        @keyframes pinPulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.15); opacity: 0.85; }
        }
    `;
    document.head.appendChild(style);
})();
