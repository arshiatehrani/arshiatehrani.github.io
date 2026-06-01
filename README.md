# Personal Portfolio Website

A multi-page interactive portfolio with an Antigravity-style particle network background,
Apple-style cinematic scroll, an ArcGIS-powered world experience map, and a full photo gallery.

**Pages**
- `index.html` — main portfolio (Hero, About, Timeline, Tools, Projects, Publications, Explore, Contact)
- `world.html` — full-page interactive world map (ArcGIS, dark theme, satellite toggle)
- `gallery.html` — full-page photo gallery with category filters + lightbox

**Theme**
- Navy Blue + foggy lavender / mist gray palette
- All colors live in one `:root` block per stylesheet

---

## File Structure

```
github.io/
├── index.html                # Main page
├── world.html                # Dedicated world map page
├── gallery.html              # Dedicated gallery page
├── styles/
│   ├── main.css              # Main page styles
│   └── subpage.css           # Shared styles for world + gallery pages
├── scripts/
│   ├── particles.js          # Layered particle network background
│   ├── scroll-effects.js     # Lenis + reveals + parallax
│   └── main.js               # Typewriter, mobile nav, timeline expand
├── assets/                   # Profile photo, resume PDF
│   └── gallery/              # Gallery photos
├── .nojekyll                 # Tells GitHub Pages to serve files as-is
└── README.md
```

---

## Quick Preview Locally

```powershell
# from the project folder
python -m http.server 8000
```

Then visit http://localhost:8000.

(Plain double-click on `index.html` also works.)

---

## Where to Edit What

| What | File | How |
| --- | --- | --- |
| Name, bio, projects, publications, links | `index.html` | Search for `EDIT:` |
| Typewriter roles (in hero) | `scripts/main.js` | `ROLES` array at top |
| Theme colors | `styles/main.css` | `:root` block at top |
| Subpage theme colors | `styles/subpage.css` | `:root` block at top |
| Particle density / look | `scripts/particles.js` | `NEAR_CONFIG` / `BACK_CONFIG` |
| **World map pins** | `world.html` | three CSV strings near the top: `stays`, `well_explored`, `travels` |
| **Gallery photos** | `gallery.html` | each `.photo` block; add files in `assets/gallery/` |
| Profile photo | `assets/profile.jpg` | drop the file here |
| Resume | `assets/resume.pdf` | drop the file here |

### Adding a world map pin
Open `world.html` and add a line to one of the three CSV strings:

```javascript
const stays = `city,latitude,longitude
Kingston,44.2334,-76.4940
Tehran,35.6892,51.3890
NewPlace,12.3456,-78.9012`;
```

Get coordinates by right-clicking any place in Google Maps. The three categories
(`stays`, `well_explored`, `travels`) render as different colored markers and auto-scale as you zoom.

### Adding a gallery photo
1. Drop the image in `assets/gallery/` (e.g. `iceland.jpg`)
2. In `gallery.html`, copy a `.photo` block and update:
   - `data-full` → image path
   - `data-category` → `travel` / `research` / `life` (for the filter buttons)
   - `data-caption` → caption shown in the lightbox
   - The `<img src>` and the `<h3>` / `<p>` inside `figcaption`

If a file is missing, the tile shows a clean placeholder icon.

---

## Deploying to GitHub Pages

Your site will be live at **`https://YOUR-USERNAME.github.io`**.

### 1. Create the repository
1. Sign in at https://github.com
2. **+** → **New repository**
3. Name it **exactly** `YOUR-USERNAME.github.io`
4. **Public**, do NOT add a README
5. **Create repository**

### 2. Push your code
Open PowerShell in this folder:

```powershell
git init
git branch -M main
git add .
git commit -m "Initial portfolio"
git remote add origin https://github.com/YOUR-USERNAME/YOUR-USERNAME.github.io.git
git push -u origin main
```

First time on this machine? Set your identity once:

```powershell
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
```

### 3. Enable Pages
**Settings → Pages**:
- Source: **Deploy from a branch**
- Branch: **main**, folder: **/ (root)**
- Save

### 4. Visit
After 1–3 minutes:

```
https://YOUR-USERNAME.github.io
```

The world map opens at `/world.html`, gallery at `/gallery.html`.

### 5. Update later
```powershell
git add .
git commit -m "Update content"
git push
```

**Important:** Browsers cache CSS and JS aggressively. After pushing changes, hard refresh
with **Ctrl+Shift+R** (or **Cmd+Shift+R** on Mac). If you've ever opened the page before,
this is usually the reason "your changes didn't apply".

---

## Customization Tips

### Change the theme colors
Edit the `:root` block at the top of `styles/main.css` (and `styles/subpage.css` to match):

```css
:root {
    --bg-primary: #050a18;
    --navy: #1A5276;
    --fog-blue: #4a7fb3;
    --fog-light: #9ab1c9;
    --fog-lavender: #b0a8c4;
}
```

### Particle density / behavior
`scripts/particles.js`, top of the file:

```javascript
const NEAR_CONFIG = {
    density: 0.00022,            // higher = more particles
    maxParticles: 260,
    connectionDistance: 130,     // longer = more lines
    mouseInfluence: 170,
};
```

### Use a custom domain (optional)
1. Buy a domain
2. **Settings → Pages → Custom domain** → enter the domain
3. At your registrar, add a CNAME record pointing to `YOUR-USERNAME.github.io`
4. Tick **Enforce HTTPS** once DNS verifies

---

## Troubleshooting

| Problem | Fix |
| --- | --- |
| Changes pushed but old version showing | Hard refresh (**Ctrl+Shift+R**). Browser cache. |
| 404 right after pushing | Wait 2–3 min, then check Settings → Pages says "Your site is live" |
| Map page is blank | Check the browser console — usually a typo in the CSV (lat/lng not parseable) |
| Photos missing in gallery | Confirm filenames in `assets/gallery/` match exactly what `gallery.html` references (case-sensitive on GitHub) |
| Particles laggy on phone | Lower `maxParticles` and `connectionDistance` in `scripts/particles.js` |
| Devicon icons missing | Make sure you have internet — they load from a CDN |

---

Built with care. Have fun.
