# Personal Portfolio Website

A modern, interactive portfolio template featuring:

- **Interactive particle network background** — particles drift, connect, and react to your mouse
- **Apple-style scroll animations** — sections fade and slide into view as you scroll
- **Parallax hero**, animated typewriter, animated stat counters
- **Scroll progress bar**, glass-blur navbar, custom cursor glow
- **Fully responsive** for desktop, tablet, and mobile
- **Pure HTML / CSS / JavaScript** — zero build step, no frameworks

---

## File Structure

```
github.io/
├── index.html              # All page content lives here
├── styles/
│   └── main.css            # All styling (colors, layout, animations)
├── scripts/
│   ├── particles.js        # Particle network background
│   ├── scroll-effects.js   # Scroll reveals, parallax, progress bar
│   └── main.js             # Typewriter, mobile nav, cursor glow
├── assets/                 # Your photos, resume PDF, project images
├── .nojekyll               # Tells GitHub Pages to serve files as-is
└── README.md
```

---

## Step 1 — Preview Locally

Open `index.html` in your browser by double-clicking it. That's it. Everything works from disk.

If you want a proper local server (recommended for cleaner asset loading):

```powershell
# from the project folder
python -m http.server 8000
```

Then visit http://localhost:8000

---

## Step 2 — Fill in Your Content

Every place you need to edit is marked with an `EDIT:` comment in the files. The main spots:

### `index.html`
- **Title & meta** at the top
- **Hero section** — your name, intro line, resume link
- **About section** — photo path, bio paragraphs, stat numbers
- **Tools grid** — add/remove `.tool-card` blocks (find icons at https://fontawesome.com/icons)
- **Projects grid** — duplicate a `.project-card` block for each project
- **Publications list** — duplicate a `.publication-item` block per paper
- **Contact section** — your email, GitHub, LinkedIn, Scholar URLs
- **Logo** — change `YN.` in the nav to your initials

### `scripts/main.js`
- **`ROLES` array** at the top — the words that get typed in the hero

### `styles/main.css`
- **`:root` block** at the very top — change the color palette in one place

### `assets/` folder
- Add `profile.jpg` (your photo)
- Add `resume.pdf` (your resume)
- Add any project screenshots you want to use

---

## Step 3 — Push to GitHub Pages

GitHub Pages can host your site for free at **`https://YOUR-USERNAME.github.io`**.

### 3a. Create the repository

1. Go to https://github.com and sign in (or create an account)
2. Click the **+** in the top-right → **New repository**
3. **Repository name must be exactly**: `YOUR-USERNAME.github.io`
   (replace `YOUR-USERNAME` with your actual GitHub username — this exact naming is what makes it a user site)
4. Set it to **Public**
5. **Do NOT** check "Add a README" (we already have one)
6. Click **Create repository**

### 3b. Push your code

Open PowerShell in this folder and run:

```powershell
# initialize a git repo
git init
git branch -M main

# stage and commit everything
git add .
git commit -m "Initial portfolio commit"

# connect to GitHub (replace YOUR-USERNAME)
git remote add origin https://github.com/YOUR-USERNAME/YOUR-USERNAME.github.io.git

# push
git push -u origin main
```

If you've never used git on this machine, you'll be prompted to sign in. The easiest path is:

```powershell
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

…and then push again. GitHub will open a browser to authenticate you.

### 3c. Enable Pages (usually already on for `username.github.io` repos)

1. On your repo page, click **Settings** → **Pages** (left sidebar)
2. Under **Build and deployment**, source should be **Deploy from a branch**
3. Branch: **`main`**, folder: **`/ (root)`**
4. Click **Save**

### 3d. Visit your site

Wait 1–3 minutes after pushing. Your site will be live at:

```
https://YOUR-USERNAME.github.io
```

---

## Step 4 — Updating the Site Later

Any time you change something:

```powershell
git add .
git commit -m "Update content"
git push
```

GitHub Pages will redeploy within a minute or two. Hard-refresh your browser (Ctrl+Shift+R) if you don't see changes right away.

---

## Customization Tips

### Change the color theme
Open `styles/main.css` and edit the variables at the very top:

```css
:root {
    --accent-primary: #00d4ff;   /* cyan */
    --accent-secondary: #915eff; /* purple */
    /* ...etc */
}
```

The whole site recolors instantly.

### Slow down or speed up the particles
In `scripts/particles.js`, top of the file:

```javascript
const CONFIG = {
    particleDensity: 0.00009,  // higher = more particles
    minSpeed: 0.15,
    maxSpeed: 0.5,
    connectionDistance: 140,   // longer = more lines
    mouseInfluence: 160,       // bigger mouse repulsion field
};
```

### Add more projects, tools, or publications
Just copy one of the existing `.project-card`, `.tool-card`, or `.publication-item` blocks in `index.html` and edit the content. The grid layout and scroll animations work automatically.

### Use a custom domain (optional)
1. Buy a domain (Namecheap, Google Domains, etc.)
2. In your repo: **Settings → Pages → Custom domain**, enter your domain
3. At your domain registrar, add a CNAME record pointing to `YOUR-USERNAME.github.io`
4. Enable **Enforce HTTPS** once the DNS check passes

---

## Troubleshooting

| Problem | Fix |
| --- | --- |
| Site shows 404 after pushing | Wait 2–3 minutes; check Settings → Pages says "Your site is live" |
| CSS or JS not loading | Make sure folder names are lowercase exactly: `styles`, `scripts`, `assets` |
| Profile image not showing | Add a file at `assets/profile.jpg` (lowercase, exact name) |
| Particles look laggy on phone | Lower `maxParticles` and `connectionDistance` in `scripts/particles.js` |
| Changes pushed but not appearing | Hard refresh (Ctrl+Shift+R) — your browser is caching the old version |

---

Have fun, and good luck with the launch.
