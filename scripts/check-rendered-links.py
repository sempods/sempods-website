#!/usr/bin/env python3
"""Check built links and inline word boundaries against selected local sources."""
import argparse
from html.parser import HTMLParser
from pathlib import Path
import re
import subprocess
from urllib.parse import unquote, urljoin, urlparse

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--dist', default='dist')
parser.add_argument('--kotlin', required=True)
parser.add_argument('--spec', required=True)
args = parser.parse_args()
root = Path(args.dist).resolve()
errors = []

class Page(HTMLParser):
    def __init__(self, path):
        super().__init__()
        self.path = path
        self.links, self.ids, self.stack = [], set(), []
        self.last = ''
        self.boundary = False
        self.feed(path.read_text())

    def handle_starttag(self, tag, attributes):
        attributes = dict(attributes)
        if 'id' in attributes:
            self.ids.add(attributes['id'])
        if tag == 'a' and 'href' in attributes:
            self.links.append(attributes['href'])
        if tag == 'img' and 'src' in attributes:
            self.links.append(attributes['src'])
        if tag in ('p', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'):
            self.last = ''
        if tag in ('a', 'code'):
            self.boundary = True
        if tag not in ('img', 'meta', 'link', 'br', 'hr', 'input', 'source', 'wbr'):
            self.stack.append(tag)

    def handle_endtag(self, tag):
        if tag in self.stack:
            self.stack = self.stack[:len(self.stack) - 1 - self.stack[::-1].index(tag)]
        if tag in ('a', 'code'):
            self.boundary = True

    def handle_data(self, data):
        prose = any(tag in self.stack for tag in ('p', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'))
        if self.boundary and prose and 'pre' not in self.stack and data:
            if self.last and self.last[-1].isalnum() and data[0].isalnum():
                errors.append(f'{self.path.relative_to(root)}: words join at an inline element: {self.last[-24:]!r} + {data[:24]!r}')
        if data:
            self.last = data
            self.boundary = False

pages = {path: Page(path) for path in root.rglob('*.html') if 'pagefind' not in path.parts}
if not pages:
    parser.error('No built HTML found; run npm run build first.')
source_links = set()
internal = 0
repositories = {'sempods-kotlin': args.kotlin, 'sempods-spec': args.spec}
for file, page in pages.items():
    for href in page.links:
        parsed = urlparse(href)
        if not parsed.scheme and not parsed.netloc:
            page_path = '/' + file.relative_to(root).as_posix()
            if page_path.endswith('/index.html'):
                page_path = page_path[:-len('index.html')]
            local = urlparse(urljoin(page_path, href))
            target = root / unquote(local.path).lstrip('/')
            parsed = local
            if target.is_dir() or not target.exists() and not target.suffix:
                target /= 'index.html'
            if not target.exists():
                errors.append(f'{file.relative_to(root)}: missing target {href}')
            elif parsed.fragment and (target not in pages or unquote(parsed.fragment) not in pages[target].ids):
                errors.append(f'{file.relative_to(root)}: missing anchor {href}')
            internal += 1
        match = re.fullmatch(r'https://github.com/sempods/(sempods-kotlin|sempods-spec)/blob/([^/]+)/([^#]+)(?:#(.*))?', href)
        if not match or href in source_links:
            continue
        source_links.add(href)
        repository, ref, path, anchor = match.groups()
        result = subprocess.run(['git', '-c', 'core.fsmonitor=false', '-C', repositories[repository], 'show', f'{ref}:{unquote(path)}'], capture_output=True, text=True)
        if result.returncode:
            errors.append(f'{href}: source absent at linked revision')
            continue
        if anchor:
            anchors, occurrences = set(), {}
            for heading in re.findall(r'^#{1,6}\s+(.+?)(?:\s+#+)?$', result.stdout, re.M):
                slug = re.sub(r'[^\w\- ]', '', re.sub(r'<[^>]*>', '', heading).lower()).replace(' ', '-')
                count = occurrences.get(slug, 0)
                anchors.add(slug if not count else f'{slug}-{count}')
                occurrences[slug] = count + 1
            anchors.update(re.findall(r'(?:id|name)=["\']([^"\']+)', result.stdout))
            if unquote(anchor) not in anchors:
                errors.append(f'{href}: heading anchor absent (check custom GitHub rendering manually)')

for error in errors:
    print(error)
if errors:
    raise SystemExit(1)
print(f'{len(pages)} pages; {internal} internal links/assets/anchors; {len(source_links)} source links; inline word boundaries passed.')
