# Crazy Portfolio (FastAPI + Jinja2 + Tailwind + GSAP)

## Run locally

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python uvicorn app.main:app --reload
```

Open `http://127.0.0.1:8000`.

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
