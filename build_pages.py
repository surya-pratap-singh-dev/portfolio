from pathlib import Path
from shutil import copy2, copytree, rmtree

from jinja2 import Environment, FileSystemLoader, select_autoescape

from app.main import get_home_context


ROOT = Path(__file__).resolve().parent
OUTPUT = ROOT / "dist"
RESUME_SOURCE = ROOT / "app" / "static" / "Surya_Backend_Engineer (13) (16).pdf"
RESUME_NAME = "Surya_Pratap_Singh_Resume.pdf"


def main() -> None:
    if OUTPUT.exists():
        rmtree(OUTPUT)
    copytree(ROOT / "app" / "static", OUTPUT / "static", dirs_exist_ok=True)
    copy2(RESUME_SOURCE, OUTPUT / "static" / RESUME_NAME)

    context = get_home_context()
    context["owner"] = {**context["owner"], "resume_url": f"static/{RESUME_NAME}"}
    environment = Environment(
        loader=FileSystemLoader(ROOT / "app" / "templates"),
        autoescape=select_autoescape(["html"]),
    )
    html = environment.get_template("index.html").render(**context)
    (OUTPUT / "index.html").write_text(html, encoding="utf-8")


if __name__ == "__main__":
    main()
