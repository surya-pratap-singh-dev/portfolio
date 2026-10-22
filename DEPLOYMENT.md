# GitHub Pages deployment

## What changed

- Replaced the AWS EC2/ECR deployment workflow with a GitHub Pages workflow.
- Added `build_pages.py` to render the existing Jinja portfolio into static files under `dist/`, including the resume.
- Kept the FastAPI app for local preview and shared portfolio data between the FastAPI page and static build.
- Added checks that verify the generated HTML is rendered and its local CSS, JavaScript, and resume files exist.
- Added `.venv/` and `dist/` to `.gitignore`.

## Deployment flow

Pull requests targeting `main` build the static site and run its checks, but do not deploy. Pushes to `main` build and check the site, then deploy it to GitHub Pages. A workflow can also be started manually from the Actions tab using the `main` branch.

Before the first deployment, set the repository's **Settings → Pages → Build and deployment → Source** to **GitHub Actions**.

The expected site address is <https://surya-pratap-singh-dev.github.io/portfolio/>.

## Custom domain

The static build writes `www.suryaa.app` to the Pages `CNAME` file. In Name.com, open the domain's **DNS Records** page and add:

| Type | Host | Value | TTL |
| --- | --- | --- | --- |
| CNAME Record | `www` | `surya-pratap-singh-dev.github.io` | Automatic |

Remove any conflicting `www` record first. Then open the repository's **Settings → Pages**, enter `www.suryaa.app` under **Custom domain**, and save. GitHub will issue the HTTPS certificate after DNS has propagated; then enable **Enforce HTTPS**.

## Updating the portfolio

- Edit text and portfolio data in `app/main.py`.
- Edit the page structure in `app/templates/index.html`.
- Edit styling in `app/static/css/styles.css`.
- Edit animations and interactions in `app/static/js/main.js` and `app/static/js/network.js`.
- Commit and push changes through a pull request to `main`. The workflow checks the build before merge and deploys after changes reach `main`.

To preview the static deployment output locally, run `python build_pages.py`. The generated `dist/` folder is ignored by Git; GitHub Actions creates and publishes it during deployment.
