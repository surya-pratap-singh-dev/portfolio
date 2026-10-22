import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "dist"


class PagesBuildTests(unittest.TestCase):
    def test_rendered_page_has_no_template_syntax(self) -> None:
        html = (OUTPUT / "index.html").read_text(encoding="utf-8")
        self.assertNotIn("{{", html)
        self.assertNotIn("{%", html)

    def test_local_assets_exist(self) -> None:
        html = (OUTPUT / "index.html").read_text(encoding="utf-8")
        assets = (
            "static/css/styles.css",
            "static/js/main.js",
            "static/js/network.js",
            "static/Surya_Pratap_Singh_Resume.pdf",
        )
        for asset in assets:
            with self.subTest(asset=asset):
                self.assertIn(asset, html)
                self.assertTrue((OUTPUT / asset).is_file())

    def test_resume_url_is_static(self) -> None:
        html = (OUTPUT / "index.html").read_text(encoding="utf-8")
        self.assertNotIn('href="/resume"', html)


if __name__ == "__main__":
    unittest.main()
