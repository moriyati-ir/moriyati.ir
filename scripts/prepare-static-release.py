"""Build a portable static release with fewer blocking requests and safe caches.

Source HTML remains readable, and standalone downloads still work. Each page's
classic deferred scripts execute in their original order. CSS keeps its cascade.
No dependency download or JavaScript build tool is needed.
"""
from argparse import ArgumentParser
from hashlib import sha256
from pathlib import Path
import json
import re
import shutil

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = re.compile(r'<script\b(?=[^>]*\bsrc="([^"]+)")[^>]*>\s*</script>')
STYLE = re.compile(r'<link\b(?=[^>]*\brel="stylesheet")(?=[^>]*\bhref="([^"]+)")[^>]*>')


def build(destination, liara=False):
    destination = Path(destination).resolve()
    if destination == ROOT or destination.is_relative_to(ROOT / 'dist') or destination in (ROOT / 'dist').parents:
        raise ValueError('Release output must not replace the source tree')
    if destination.exists():
        raise FileExistsError(f'Release output already exists: {destination}')
    shutil.copytree(ROOT / 'dist', destination)
    pages = {}

    def bundle(paths, extension):
        # Semicolons isolate classic scripts exactly as separate script tags do.
        separator = '\n;\n' if extension == 'js' else '\n'
        body = separator.join((ROOT / 'dist' / path).read_text() for path in paths) + '\n'
        name = f'site.{sha256(body.encode()).hexdigest()[:12]}.{extension}'
        (destination / name).write_text(body)
        return name

    for path in sorted(destination.glob('*.html')):
        html = path.read_text()
        scripts = list(SCRIPT.finditer(html))
        styles = list(STYLE.finditer(html))
        if any('defer' not in match[0] or 'async' in match[0] for match in scripts):
            raise ValueError(f'Only ordered deferred scripts can be combined: {path.name}')
        dependencies = [match[1] for match in scripts + styles]
        if any(':' in name or name.startswith('/') or '..' in Path(name).parts for name in dependencies):
            raise ValueError(f'Unexpected external dependency in {path.name}')
        js = bundle([match[1] for match in scripts], 'js') if scripts else None
        css = bundle([match[1] for match in styles], 'css') if styles else None
        first = True

        def script_tag(match):
            nonlocal first
            if not first:
                return ''
            first = False
            return f'<script src="{js}" defer></script>'

        html = SCRIPT.sub(script_tag, html)
        first = True

        def style_tag(match):
            nonlocal first
            if not first:
                return ''
            first = False
            return f'<link rel="stylesheet" href="{css}">'

        html = STYLE.sub(style_tag, html)
        path.write_text(html)
        pages[path.name] = {'scripts': [m[1] for m in scripts], 'styles': [m[1] for m in styles], 'js': js, 'css': css}
    if liara:
        shutil.copyfile(ROOT / 'liara_nginx.conf', destination / 'liara_nginx.conf')
        (destination / 'liara.json').write_text(json.dumps({'app': 'moriyati-ir', 'platform': 'static'}) + '\n')
    return pages


if __name__ == '__main__':
    parser = ArgumentParser(description=__doc__)
    parser.add_argument('--output', required=True)
    parser.add_argument('--liara', action='store_true')
    args = parser.parse_args()
    print(json.dumps(build(args.output, args.liara), indent=2))
