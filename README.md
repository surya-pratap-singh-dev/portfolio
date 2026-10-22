# Portfolio (GitHub Pages + FastAPI + Jinja2 + GSAP)

The live portfolio is a static site hosted on GitHub Pages. FastAPI remains available for local development; the Pages build renders the same Jinja template and portfolio data into static files.

## Run locally with FastAPI

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Open `http://127.0.0.1:8000`. To preview the exact static output that GitHub Pages will publish, run:

```bash
python build_pages.py
```

This generates the site in `dist/`.

## Publish with GitHub Pages

GitHub Actions builds and verifies each pull request targeting `main`. When changes are pushed to `main`, it builds, verifies, and deploys the site automatically. To enable it:

1. Open the repository's **Settings → Pages**.
2. Set **Build and deployment → Source** to **GitHub Actions**.
3. Push to `main`, or run the **Deploy to GitHub Pages** workflow manually from the **Actions** tab while selecting the `main` branch.

The project site URL is `https://surya-pratap-singh-dev.github.io/portfolio/`.
The configured custom domain is `https://www.suryaa.app/`.

### Custom domain setup

The domain is registered at Name.com. To point it to GitHub Pages:

1. In Name.com, open `suryaa.app` → **DNS Records**.
2. Remove the old AWS records pointing to `13.206.194.159`.
3. Add four root A records: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, and `185.199.111.153`.
4. Add a CNAME record with host `www` and value `surya-pratap-singh-dev.github.io`.
5. In GitHub, open **Settings → Pages**, choose **GitHub Actions**, and set the custom domain to `www.suryaa.app`.
6. Wait for the DNS check and TLS certificate to complete, then enable **Enforce HTTPS**. This can take up to 24 hours; the browser can be closed while waiting.

## What is included

- Hero section with animated intro + tagline
- Featured projects with demo/source links, tech stack, and impact
- Skills and tech stack grouped with animated bars
- Experience/internship/hackathon timeline
- Story-driven about section
- Contact CTA section
- Optional blog/thoughts cards
- GSAP + ScrollTrigger motion
- `prefers-reduced-motion` accessibility fallback

## Customize quickly

- Update profile, projects, and links in `app/main.py`
- Update visuals in `app/static/css/styles.css`
- Update animations in `app/static/js/main.js`
- The deployment workflow runs `build_pages.py` to generate the static site in `dist/`.
- Pull requests are checked for a successful static build and required local assets before changes can be merged.
