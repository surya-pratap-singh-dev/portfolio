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

The static build writes `www.suryaa.app` to the Pages `CNAME` file. In Name.com, open the domain's **DNS Records** page and configure the records below. Delete the old AWS records pointing to `13.206.194.159` first.

| Type | Host | Value | TTL |
| --- | --- | --- | --- |
| A Record | `@` / blank | `185.199.108.153` | `300` |
| A Record | `@` / blank | `185.199.109.153` | `300` |
| A Record | `@` / blank | `185.199.110.153` | `300` |
| A Record | `@` / blank | `185.199.111.153` | `300` |
| CNAME Record | `www` | `surya-pratap-singh-dev.github.io` | `300` |

In Name.com, the root-domain host can appear as `suryaa.app`; for the `www` record, enter only `www` in the host field. Remove any conflicting `www` record, especially an old A record. Do not include `https://` or `/portfolio` in the CNAME value.

Then open the repository's **Settings → Pages**, set **Source** to **GitHub Actions**, enter `www.suryaa.app` under **Custom domain**, and click **Save**. Click **Check again** after DNS changes propagate.

GitHub will show **DNS check successful** and provision a TLS certificate. Certificate provisioning can take 15 minutes to 24 hours. The **Enforce HTTPS** checkbox stays unavailable until the certificate is fully issued; it is safe to close the browser while waiting. Refresh the Pages settings later, enable **Enforce HTTPS**, and verify the site at <https://www.suryaa.app>.

## Updating the portfolio

- Edit text and portfolio data in `app/main.py`.
- Edit the page structure in `app/templates/index.html`.
- Edit styling in `app/static/css/styles.css`.
- Edit animations and interactions in `app/static/js/main.js` and `app/static/js/network.js`.
- Commit and push changes through a pull request to `main`. The workflow checks the build before merge and deploys after changes reach `main`.

To preview the static deployment output locally, run `python build_pages.py`. The generated `dist/` folder is ignored by Git; GitHub Actions creates and publishes it during deployment.
