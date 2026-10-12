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
MAX_THUMB_BYTES = 80_000
MAX_MOBILE_BYTES = 120_000
IMAGE_SUFFIXES = {".jpg", ".jpeg", ".png", ".webp"}
INQUIRY_MAILTO = "mailto:urlaub@gaestehaus-perschall.com?subject="
# 404.html uses absolute paths (see README) and has its own minimal layout.
LAYOUT_EXEMPT_PAGES = {"404.html"}


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
    path_value = path_value.split("#", 1)[0].split("?", 1)[0]
    if not (ROOT / path_value).exists():
        fail(f"Missing local asset from {source}: {path_value}")


def srcset_urls(value: str) -> list[str]:
    return [part.strip().split()[0] for part in value.split(",") if part.strip()]


def image_limit(relative: str) -> int:
    if relative.startswith("img/works/thumbs/"):
        return MAX_THUMB_BYTES
    if relative.endswith("-800.jpg"):
        return MAX_MOBILE_BYTES
    return MAX_IMAGE_BYTES


def block(html: str, pattern: str) -> str | None:
    match = re.search(pattern, html, re.S)
    if not match:
        return None
    text = match.group(0).replace("index.html#", "#")
    return re.sub(r"\s+", " ", text).strip()


def check_all_pages(pages: dict[str, str]) -> None:
    """Checks that apply to every HTML page in the site root."""
    reference_header = block(pages["index.html"], r'<header class="site-header".*?</header>')
    reference_footer = block(pages["index.html"], r'<footer class="site-footer".*?</footer>')
    inquiry_links: set[str] = set()

    for name, html in pages.items():
        parser = PageParser()
        parser.feed(html)
        if parser.lang != "de":
            fail(f"{name}: <html lang=\"de\"> fehlt.")

        for img in parser.images:
            if "alt" not in img:
                fail(f"{name}: Bild ohne alt-Text: {img.get('src', '(ohne src)')}")
            # The lightbox <img> gets its src from JavaScript and has no fixed size.
            if img.get("src") and not (img.get("width") and img.get("height")):
                fail(
                    f"{name}: Bild ohne width/height: {img['src']}. "
                    "Bitte die Pixelmaße als width- und height-Attribut ergänzen."
                )

        for tag, attrs in parser.attrs:
            href = attrs.get("href", "")
            if href.startswith(INQUIRY_MAILTO):
                inquiry_links.add(href)
            if name in LAYOUT_EXEMPT_PAGES:
                continue
            for attr in ("src", "href", "data-full"):
                check_local_asset(attrs.get(attr, ""), f"{name} {tag}[{attr}]")
            for attr in ("srcset", "imagesrcset"):
                for url in srcset_urls(attrs.get(attr, "")):
                    check_local_asset(url, f"{name} {tag}[{attr}]")

        if name in LAYOUT_EXEMPT_PAGES or name == "index.html":
            continue
        if block(html, r'<header class="site-header".*?</header>') != reference_header:
            fail(f"{name}: Kopfbereich (Menü) weicht von index.html ab. Bitte den Header aus index.html übernehmen.")
        if block(html, r'<footer class="site-footer".*?</footer>') != reference_footer:
            fail(f"{name}: Footer weicht von index.html ab. Bitte den Footer aus index.html übernehmen.")

    if len(inquiry_links) > 1:
        fail(
            "Die Anfrage-Links (mailto mit Betreff) sind nicht identisch. "
            "Bitte alle Buttons „Jetzt unverbindlich anfragen“ auf denselben Link setzen."
        )


def check_images(pages: dict[str, str]) -> None:
    referenced = "\n".join(pages.values())
    for css_file in (ROOT / "assets/css").glob("*.css"):
        referenced += "\n" + css_file.read_text(encoding="utf-8")

    for image in sorted((ROOT / "img").rglob("*")):
        if not image.is_file():
            continue
        relative = image.relative_to(ROOT).as_posix()
        if image.suffix.lower() not in IMAGE_SUFFIXES:
            continue
        if image.suffix.lower() == ".png":
            fail(
                f"PNG-Datei unter img/: {relative}. Fotos bitte als JPEG (Qualität ~80) speichern; "
                "Icons gehören nach assets/icons/."
            )
        size = image.stat().st_size
        limit = image_limit(relative)
        if size > limit:
            fail(
                f"Bild zu groß: {relative} ({size // 1000} KB, erlaubt {limit // 1000} KB). "
                "Bitte mit Qualität ~80 neu speichern oder verkleinern."
            )
        if relative not in referenced:
            fail(f"Ungenutztes Bild: {relative}. Bitte löschen oder in einer Seite verwenden.")


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

    pages = {page.name: page.read_text(encoding="utf-8") for page in sorted(ROOT.glob("*.html"))}
    check_all_pages(pages)
    check_images(pages)

    print("All static-site checks passed.")


if __name__ == "__main__":
    main()
