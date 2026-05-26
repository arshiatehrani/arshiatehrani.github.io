# Personal Portfolio Website

An interactive, cinematic portfolio template inspired by Apple-style scrolling and Google Antigravity's particle field.

**Features**
- Layered interactive particle network background (Antigravity-style, two depth layers, mouse-reactive)
- Lenis-powered buttery smooth scroll
- Apple-style scroll reveals, hero scale-out, parallax section headers
- Sections: Hero, About, Timeline (expandable), Tools, Projects, Publications, Gallery, World Experience (interactive Leaflet map), Contact
- Oxford Blue + foggy lavender/gray palette
- Fully responsive
- Pure HTML / CSS / JS — no build step

---

## File Structure

```
github.io/
├── index.html                  # All page content
├── styles/
│   └── main.css                # Styling (colors at the top)
├── scripts/
│   ├── particles.js            # Layered particle network
│   ├── scroll-effects.js       # Lenis + reveals + parallax
│   ├── world-map.js            # Leaflet map (EDIT the PLACES list here)
│   └── main.js                 # Typewriter, mobile nav, timeline, cursor glow
├── assets/                     # Your photos, resume PDF
│   └── gallery/                # Gallery photos
├── .nojekyll                   # Tells GitHub Pages to serve files as-is
└── README.md
```

---

## Quick Preview

Double-click `index.html`. Or for a clean local server:

```powershell
python -m http.server 8000
```

then open http://localhost:8000.

---

## Where To Edit What

Every editable spot is marked `EDIT:` in the source. The big ones:

| Section | File | What |
| --- | --- | --- |
| Name, bio, links | `index.html` | search `EDIT:` |
| Typewriter roles | `scripts/main.js` | `ROLES` array at the top |
| Colors / theme | `styles/main.css` | `:root` block at the very top |
| World map pins | `scripts/world-map.js` | `PLACES` array — add `{name, detail, type, lat, lng}` per pin |
| Particle density / behavior | `scripts/particles.js` | `NEAR_CONFIG` and `BACK_CONFIG` blocks |
| Profile photo | `assets/profile.jpg` | drop a square photo here |
| Resume | `assets/resume.pdf` | drop your PDF here |
| Gallery photos | `assets/gallery/photo1.jpg`, ... | match the filenames referenced in `index.html` |

### Adding a world map pin
Open `scripts/world-map.js` and add an entry to `PLACES`:

```javascript
{ name: 'Paris, France', detail: 'Visited 2024', type: 'visited', lat: 48.8566, lng: 2.3522 },
```

`type` is one of `'lived'`, `'visited'`, `'work'`. Get coordinates by right-clicking any place in Google Maps.

### Adding a gallery photo
1. Drop the image in `assets/gallery/` (e.g., `iceland.jpg`)
2. Copy a `.gallery-item` block in `index.html`, change the `src` and the caption text.

### Adding a timeline year
Copy a `.timeline-item` block in `index.html`. The expand-on-click works automatically.

---

## Deploying to GitHub Pages

GitHub Pages will host your site for free at `https://YOUR-USERNAME.github.io`.

### 1. Create the repo
1. Go to https://github.com and sign in
2. Click **+** → **New repository**
3. Name it **exactly** `YOUR-USERNAME.github.io` (this exact naming is what triggers the personal-site behavior)
4. Set **Public**, do NOT add a README
5. Click **Create repository**

### 2. Push your code
Open PowerShell in the project folder:

```powershell
git init
git branch -M main
git add .
git commit -m "Initial portfolio"
git remote add origin https://github.com/YOUR-USERNAME/YOUR-USERNAME.github.io.git
git push -u origin main
```

If git asks who you are first time:

```powershell
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
```

GitHub will pop a browser to authenticate.

### 3. Enable Pages (usually already on)
**Settings → Pages → Build and deployment**:
- Source: **Deploy from a branch**
- Branch: **main**, folder: **/ (root)**
- Save

### 4. Visit your site
Wait 1–3 minutes after pushing. It will be live at:

```
https://YOUR-USERNAME.github.io
```

### 5. Updating later
```powershell
git add .
git commit -m "Update content"
git push
```

Hard-refresh (Ctrl+Shift+R) if changes don't show right away.

---

## Customization Tips

### Change the color theme
The whole site recolors from this one block at the top of `styles/main.css`:

```css
:root {
    --bg-primary: #050a18;
    --oxford: #002147;
    --fog-blue: #4a7fb3;
    --fog-light: #9ab1c9;
    --fog-lavender: #b0a8c4;
    /* ... */
}
```

### Particle density
Top of `scripts/particles.js`:

```javascript
const NEAR_CONFIG = {
    density: 0.00022,           // higher = more particles
    maxParticles: 260,
    connectionDistance: 130,    // longer = more lines
    mouseInfluence: 170,
};
```

### Switch to a particle library (optional)
If you ever want to use `tsparticles` instead: replace `scripts/particles.js` with their CDN script and a config object. The custom version is lighter (~3KB vs ~30KB) and was kept for that reason.

### Use a custom domain (optional)
1. Buy a domain (Namecheap, Porkbun, etc.)
2. Repo **Settings → Pages → Custom domain** → enter the domain
3. At your registrar, add a CNAME record pointing to `YOUR-USERNAME.github.io`
4. Tick **Enforce HTTPS** once DNS verifies

---

## Troubleshooting

| Problem | Fix |
| --- | --- |
| 404 after pushing | Wait 2–3 min; check Settings → Pages shows "Your site is live" |
| Assets not loading | Folders are case-sensitive on GitHub — match `styles`, `scripts`, `assets` exactly |
| Profile / gallery images not showing | Confirm filenames in `assets/` match exactly what `index.html` references |
| Map shows but no pins | Open browser console — usually a typo in `PLACES` (missing lat/lng) |
| Particles laggy on phone | Lower `maxParticles` and `connectionDistance` in `scripts/particles.js` |
| Changes pushed but old version showing | Hard refresh (Ctrl+Shift+R) — browser cache |

---

Built with care. Have fun making it yours.
