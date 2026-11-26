"""Build the source archive for the dedicated moriyati-erp Node service."""
import argparse
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile

ROOT = Path(__file__).resolve().parents[1]
SERVICE = ROOT / "services" / "erp-live"
PREVIEW = ROOT / "dist" / "erp"

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("output", type=Path, help="destination .zip")
parser.add_argument("--accounts-seed", type=Path, help="private account seed to embed in the Liara source archive")
args = parser.parse_args()
output = args.output
with ZipFile(output, "w", compression=ZIP_DEFLATED) as bundle:
    for name in ("package.json", "package-lock.json", "liara.json", "server.cjs",
                 "live/public/index.html", "live/public/live.css", "live/public/live.js"):
        bundle.write(SERVICE / name, name)
    for module in sorted((SERVICE / "live").glob("*.cjs")):
        bundle.write(module, "live/" + module.name)
    for file in sorted(PREVIEW.rglob("*")):
        if file == PREVIEW / "index.html":
            html = file.read_text().replace(
                "<head>", '<head>\n  <meta name="moriyati-environment" content="live">', 1
            ).replace("MORIYATI — Workspace Preview", "فضای کار موریاتی | MORIYATI").replace(
                "پیش‌نمونه کلیکی رابط موریاتی؛ اکسپلور تسک‌ها، فرایندها، مسنجر و کارنامه شخصی",
                "فضای کار کارکنان موریاتی"
            )
            bundle.writestr("erp/index.html", html)
        elif file.is_file() and file.name != "review.html":
            bundle.write(file, "erp/" + file.relative_to(PREVIEW).as_posix())
    bundle.write(ROOT / "dist/assets/Vazirmatn.woff2", "assets/Vazirmatn.woff2")
    if args.accounts_seed:
        bundle.write(args.accounts_seed, "live/accounts-seed.json")
