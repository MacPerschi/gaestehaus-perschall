#!/usr/bin/env python3
"""Lightweight static-site checks for CI and local verification."""
from __future__ import annotations

import json
import re
import sys
from html.parser import HTMLParser
from pathlib import Path
from xml.etree import ElementTree

ROOT = Path(__file__).resolve().parents[1]
HTML = ROOT / "index.html"
MAX_IMAGE_BYTES = 300_000


class PageParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.attrs: list[tuple[str, dict[str, str]]] = []
        self.images: list[dict[str, str]] = []
        self.h1_count = 0
        self.lang: str | None = None

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        data = {key: value or "" for key, value in attrs}
        self.attrs.append((tag, data))
        if tag == "html":
            self.lang = data.get("lang")
        if tag == "img":
            self.images.append(data)
        if tag == "h1":
            self.h1_count += 1


def fail(message: str) -> None:
    print(f"ERROR: {message}", file=sys.stderr)
    raise SystemExit(1)


def check_local_asset(path_value: str, source: str) -> None:
    if not path_value or path_value.startswith(("http://", "https://", "mailto:", "tel:", "data:", "#")):
        return
    if not (ROOT / path_value).exists():
        fail(f"Missing local asset from {source}: {path_value}")


def main() -> None:
    if not HTML.exists():
        fail("index.html is missing")

    html = HTML.read_text(encoding="utf-8")
    parser = PageParser()
    parser.feed(html)

    checks = {
        "html_lang_de": parser.lang == "de",
        "one_h1": parser.h1_count == 1,
        "has_skip_link": "skip-link" in html,
        "has_main_landmark": "<main id=\"main\"" in html,
        "has_meta_description": "name=\"description\"" in html,
        "has_canonical": "rel=\"canonical\"" in html,
        "has_open_graph": "property=\"og:title\"" in html,
        "has_json_ld": "application/ld+json" in html,
        "has_robots": (ROOT / "robots.txt").exists(),
        "has_sitemap": (ROOT / "sitemap.xml").exists(),
        "has_pages_workflow": (ROOT / ".github/workflows/pages.yml").exists(),
        "images_have_alt": all("alt" in img for img in parser.images),
    }

    for name, passed in checks.items():
        if not passed:
            fail(f"Check failed: {name}")

    for tag, attrs in parser.attrs:
        for attr in ("src", "href"):
            check_local_asset(attrs.get(attr, ""), f"{tag}[{attr}]")

    for css_file in (ROOT / "assets/css").glob("*.css"):
        css = css_file.read_text(encoding="utf-8")
        for url in re.findall(r"url\(['\"]?([^)'\"]+)", css):
            if url.startswith(("data:", "http://", "https://")):
                continue
            if not (css_file.parent / url).resolve().exists():
                fail(f"Missing CSS asset from {css_file.name}: {url}")

    json_ld_match = re.search(r'<script type="application/ld\+json">(.*?)</script>', html, re.S)
    if not json_ld_match:
        fail("JSON-LD block is missing")
    data = json.loads(json_ld_match.group(1))
    if data.get("@type") != "LodgingBusiness":
        fail("JSON-LD type should be LodgingBusiness")

    canonical_urls = [
        attrs.get("href", "") for tag, attrs in parser.attrs
        if tag == "link" and "canonical" in attrs.get("rel", "").split()
    ]
    if len(canonical_urls) != 1 or not canonical_urls[0]:
        fail("Expected one non-empty canonical URL")
    base_url = canonical_urls[0]

    for property_name, prefix in (("og:url", False), ("og:image", True)):
        values = [
            attrs.get("content", "") for tag, attrs in parser.attrs
            if tag == "meta" and attrs.get("property") == property_name
        ]
        if len(values) != 1 or not values[0]:
            fail(f"Expected one non-empty {property_name}")
        if (not values[0].startswith(base_url) if prefix else values[0] != base_url):
            fail(f"{property_name} does not match canonical URL: {values[0]}")

    for field, prefix in (("url", False), ("image", True)):
        value = data.get(field)
        if not isinstance(value, str) or not value:
            fail(f"JSON-LD {field} must be a non-empty URL string")
        if (not value.startswith(base_url) if prefix else value != base_url):
            fail(f"JSON-LD {field} does not match canonical URL: {value}")

    try:
        sitemap = ElementTree.parse(ROOT / "sitemap.xml")
    except ElementTree.ParseError as exc:
        fail(f"Invalid sitemap.xml: {exc}")
    locations = [
        (element.text or "").strip()
        for element in sitemap.findall(".//{http://www.sitemaps.org/schemas/sitemap/0.9}loc")
    ]
    if locations != [base_url]:
        fail(f"sitemap.xml loc does not match canonical URL: {locations}")

    robots = (ROOT / "robots.txt").read_text(encoding="utf-8")
    sitemap_urls = re.findall(r"(?mi)^Sitemap:\s*(\S+)\s*$", robots)
    if sitemap_urls != [base_url.rstrip("/") + "/sitemap.xml"]:
        fail(f"robots.txt Sitemap does not match canonical URL: {sitemap_urls}")

    for image in sorted((ROOT / "img").rglob("*")):
        if image.is_file() and image.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp"}:
            size = image.stat().st_size
            if size > MAX_IMAGE_BYTES:
                fail(f"Image exceeds {MAX_IMAGE_BYTES} bytes: {image.relative_to(ROOT)} ({size} bytes)")

    print("All static-site checks passed.")


if __name__ == "__main__":
    main()
