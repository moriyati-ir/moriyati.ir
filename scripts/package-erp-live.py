"""Build the source archive for the dedicated moriyati-erp Node service."""
import argparse
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile

ROOT = Path(__file__).resolve().parents[1]
SERVICE = ROOT / "services" / "erp-live"
PREVIEW = ROOT / "dist" / "erp"

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("output", type=Path, help="destination .zip")
output = parser.parse_args().output
with ZipFile(output, "w", compression=ZIP_DEFLATED) as bundle:
    for name in ("package.json", "package-lock.json", "liara.json", "server.cjs",
                 "live/api.cjs", "live/workflow.cjs", "live/provision.cjs", "live/public/index.html", "live/public/live.css",
                 "live/public/live.js"):
        bundle.write(SERVICE / name, name)
    for file in sorted(PREVIEW.rglob("*")):
        if file == PREVIEW / "index.html":
            notice = ('<aside aria-label="نوع محیط" style="position:relative;z-index:1;'
                      'text-align:center;padding:.45rem;background:#f6eddb;color:#352915;'
                      'font:14px Workspace,sans-serif">پیش‌نمایش با دادهٔ آزمایشی · '
                      '<a style="color:inherit" href="/live/">ورود به ثبت عملیاتی</a></aside>')
            html = file.read_text().replace("<body>", "<body>\n  " + notice, 1)
            bundle.writestr("erp/index.html", html)
        elif file.is_file():
            bundle.write(file, "erp/" + file.relative_to(PREVIEW).as_posix())
    bundle.write(ROOT / "dist/assets/Vazirmatn.woff2", "assets/Vazirmatn.woff2")
