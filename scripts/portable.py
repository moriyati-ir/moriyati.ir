"""Build the same self-contained export provided by the site's download control."""
from pathlib import Path
import base64
import mimetypes
import re

DIST = Path(__file__).resolve().parents[1] / 'dist'
ORIGIN = 'https://moriyati-ir.github.io/moriyati.ir/'

def build(page, filename):
    cache = {}
    def uri(relative):
        if relative not in cache:
            path = DIST / relative
            mime = mimetypes.guess_type(path.name)[0] or 'application/octet-stream'
            cache[relative] = 'data:' + mime + ';base64,' + base64.b64encode(path.read_bytes()).decode('ascii')
        return cache[relative]
    html = (DIST / (page + '.html')).read_text()
    sources = re.findall(r'<script\b[^>]*src="([^"]+)"[^>]*></script>', html)
    js = '\n;\n'.join((DIST / p).read_text() for p in sources)
    html = re.sub(r'\s*<link rel="preload"[^>]+>', '', html)
    html = re.sub(r'<script\b[\s\S]*?</script>', '', html)
    html = re.sub(r'^[\t ]+$', '', html, flags=re.M)
    html = html.replace('<html ', '<html data-portable="true" data-portable-language="fa" data-site-base="' + ORIGIN + '" ')
    def stylesheet(match):
        css = (DIST / match[1]).read_text()
        css = re.sub(r"url\(['\"]?([^'\")]+)['\"]?\)", lambda m: m[0] if m[1].startswith('data:') else "url('" + uri(m[1]) + "')", css)
        return '<style>' + css + '</style>'
    html = re.sub(r'<link rel="stylesheet" href="([^"]+)">', stylesheet, html)
    html = re.sub(r'(src|href)="(assets/[^\"]+)"', lambda m: m[1] + '="' + uri(m[2]) + '"', html)
    for path in set(re.findall(r'(?<![A-Za-z0-9_-])assets/[A-Za-z0-9_./-]+\.(?:webp|png|jpeg|jpg|svg)', js)):
        js = js.replace(path, uri(path))
    html = re.sub(r'href="((?:index|expertise|contact|authenticity|heritage|bulletin)\.html[^\"]*)"', lambda m: 'href="' + ORIGIN + m[1] + '"', html)
    licenses = '\n\n'.join(p.name + '\n' + p.read_text() for p in sorted((DIST / 'assets/licenses').glob('*.txt')))
    content = '<script type="text/plain" id="font-licenses">' + licenses.replace('</script', '<\\/script') + '</script>'
    content += '<script>\n' + js.replace('</script', '<\\/script') + '\n</script>\n'
    html = html.replace('</body>', content + '</body>')
    target = DIST.parent / 'exports' / filename
    target.parent.mkdir(exist_ok=True)
    target.write_text(html)
    print(f'{target}: {target.stat().st_size:,} bytes')
    return target
