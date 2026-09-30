#!/usr/bin/env python3
"""Check built links and inline word boundaries against selected local sources."""
import argparse
import json
from html.parser import HTMLParser
from pathlib import Path
import re
import subprocess
from urllib.parse import unquote, urljoin, urlparse

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--dist', default='dist')
parser.add_argument('--kotlin', required=True)
parser.add_argument('--spec', required=True)
parser.add_argument('--site', default=json.loads((Path(__file__).resolve().parent.parent / 'src/data/site.json').read_text())['url'])
args = parser.parse_args()
root = Path(args.dist).resolve()
errors = []

def origin(url):
    parsed = urlparse(url)
    port = parsed.port if parsed.port is not None else {'https': 443, 'http': 80}.get(parsed.scheme.lower())
    return parsed.scheme.lower(), parsed.hostname, port

site_origin = origin(args.site)
if site_origin[0] not in ('http', 'https') or not site_origin[1]:
    parser.error('--site must be an absolute HTTP(S) URL.')

social_url_fields = {
    'og:url', 'og:image', 'og:image:url', 'og:image:secure_url',
    'og:video', 'og:video:url', 'og:video:secure_url',
    'og:audio', 'og:audio:url', 'og:audio:secure_url',
    'twitter:image', 'twitter:image:src', 'twitter:player', 'twitter:player:stream',
}

def srcset_urls(value):
    position = 0
    whitespace = ' \t\n\r\f'
    while position < len(value):
        while position < len(value) and value[position] in whitespace + ',':
            position += 1
        start = position
        while position < len(value) and value[position] not in whitespace:
            position += 1
        token = value[start:position]
        if not token:
            return
        yield token.rstrip(',')
        if token.endswith(','):
            continue
        depth = 0
        while position < len(value):
            char = value[position]
            position += 1
            if char == '(':
                depth += 1
            elif char == ')':
                depth = max(0, depth - 1)
            elif char == ',' and not depth:
                break


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
        url_attributes = {
            'a': ('href',), 'area': ('href',), 'link': ('href',),
            'img': ('src',), 'script': ('src',), 'source': ('src',),
            'audio': ('src',), 'video': ('src', 'poster'), 'track': ('src',),
            'iframe': ('src',), 'embed': ('src',), 'input': ('src',), 'object': ('data',),
        }
        for attribute in url_attributes.get(tag, ()):
            if attribute in attributes:
                url = (attributes[attribute] or '').strip()
                if not url and tag not in ('a', 'area'):
                    errors.append(f'{self.path.relative_to(root)}: empty asset URL {tag}[{attribute}]')
                else:
                    self.links.append(url)
        if tag == 'meta':
            field = (attributes.get('property') or attributes.get('name') or '').lower()
            if field in social_url_fields:
                content = (attributes.get('content') or '').strip()
                if content:
                    self.links.append(content)
                else:
                    errors.append(f'{self.path.relative_to(root)}: empty social URL {field}')
        candidate_attribute = 'imagesrcset' if tag == 'link' else 'srcset'
        if tag in ('img', 'source', 'link') and candidate_attribute in attributes:
            candidates = list(srcset_urls(attributes[candidate_attribute] or ''))
            if candidates:
                self.links.extend(candidates)
            else:
                errors.append(f'{self.path.relative_to(root)}: empty asset URL {tag}[{candidate_attribute}]')
        if tag in ('p', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'):
            self.last = ''
        if tag in ('a', 'code'):
            self.boundary = True
        if tag not in ('area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'):
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
        page_path = '/' + file.relative_to(root).as_posix()
        if page_path.endswith('/index.html'):
            page_path = page_path[:-len('index.html')]
        resolved = urljoin(args.site.rstrip('/') + page_path, href)
        parsed = urlparse(resolved)
        if origin(resolved) == site_origin:
            target = root / unquote(parsed.path).lstrip('/')
            if target.is_dir() or not target.exists() and not target.suffix:
                target /= 'index.html'
            if not target.exists():
                errors.append(f'{file.relative_to(root)}: missing target {href}')
            elif parsed.fragment and target in pages and unquote(parsed.fragment) not in pages[target].ids:
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
