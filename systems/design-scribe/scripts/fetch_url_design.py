#!/usr/bin/env python3
"""
fetch_url_design.py — Design Scribe's reference-fetching script.

For a given URL, this ALWAYS attempts both of the following, independently:
  1. A full-page screenshot via Playwright/Chromium  -> screenshot.png
  2. CSS/color/font token extraction via requests+BeautifulSoup -> tokens.json

The two are independent on purpose: a site that blocks headless browsers
might still be readable via plain requests, and vice versa. Failure of one
does not cancel the other. A JSON summary is always printed to stdout so
the calling agent can react to partial success without parsing logs.

Usage:
    python3 fetch_url_design.py <url> <output_dir>

Output files (in output_dir):
    screenshot.png   — present only if the screenshot succeeded
    source.html       — raw HTML as fetched by requests, if that succeeded
    tokens.json        — extracted design tokens + a status/error summary
"""

import json
import re
import sys
import os
from urllib.parse import urljoin, urlparse

HEX_COLOR_RE = re.compile(r"#(?:[0-9a-fA-F]{3}){1,2}\b")
RGB_COLOR_RE = re.compile(r"rgba?\([^)]+\)")
FONT_FAMILY_RE = re.compile(r"font-family\s*:\s*([^;{}]+)", re.IGNORECASE)
RADIUS_RE = re.compile(r"border-radius\s*:\s*([^;{}]+)", re.IGNORECASE)
SPACING_RE = re.compile(r"(?:margin|padding)\s*:\s*([^;{}]+)", re.IGNORECASE)


def extract_css_tokens(css_text):
    colors = set(m.group(0) for m in HEX_COLOR_RE.finditer(css_text))
    colors |= set(m.group(0) for m in RGB_COLOR_RE.finditer(css_text))
    fonts = set(m.group(1).strip() for m in FONT_FAMILY_RE.finditer(css_text))
    radii = set(m.group(1).strip() for m in RADIUS_RE.finditer(css_text))
    spacing = set(m.group(1).strip() for m in SPACING_RE.finditer(css_text))
    return {
        "colors": sorted(colors)[:40],
        "fonts": sorted(fonts)[:20],
        "border_radius_values": sorted(radii)[:20],
        "spacing_values": sorted(spacing)[:30],
    }


def fetch_css_tokens(url, output_dir):
    """Best-effort HTML/CSS extraction. Returns (tokens_dict, error_or_none)."""
    try:
        import requests
        from bs4 import BeautifulSoup
    except ImportError as e:
        return None, f"missing dependency: {e}"

    try:
        resp = requests.get(url, timeout=15, headers={"User-Agent": "design-scribe/0.1"})
        resp.raise_for_status()
        html = resp.text
    except Exception as e:
        return None, f"requests fetch failed: {e}"

    try:
        with open(os.path.join(output_dir, "source.html"), "w", encoding="utf-8") as f:
            f.write(html)
    except OSError:
        pass  # non-fatal — extraction can still proceed from the in-memory html

    soup = BeautifulSoup(html, "html.parser")
    css_blobs = [style.get_text() for style in soup.find_all("style")]

    for tag in soup.find_all("style"):
        css_blobs.append(tag.get_text())
    for tag in soup.find_all(style=True):
        css_blobs.append(tag["style"])

    css_link_errors = []
    for link in soup.find_all("link", rel=lambda v: v and "stylesheet" in v):
        href = link.get("href")
        if not href:
            continue
        css_url = urljoin(url, href)
        try:
            css_resp = requests.get(css_url, timeout=10, headers={"User-Agent": "design-scribe/0.1"})
            css_resp.raise_for_status()
            css_blobs.append(css_resp.text)
        except Exception as e:
            css_link_errors.append({"url": css_url, "error": str(e)})

    theme_color = None
    meta = soup.find("meta", attrs={"name": "theme-color"})
    if meta and meta.get("content"):
        theme_color = meta["content"]

    tokens = extract_css_tokens("\n".join(css_blobs))
    tokens["theme_color_meta"] = theme_color
    tokens["title"] = soup.title.get_text().strip() if soup.title else None
    if css_link_errors:
        tokens["stylesheet_fetch_errors"] = css_link_errors

    return tokens, None


def take_screenshot(url, output_dir):
    """Best-effort full-page screenshot. Returns (path_or_none, error_or_none)."""
    try:
        from playwright.sync_api import sync_playwright
    except ImportError as e:
        return None, f"playwright not installed: {e}"

    screenshot_path = os.path.join(output_dir, "screenshot.png")
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch()
            page = browser.new_page(viewport={"width": 1440, "height": 900})
            page.goto(url, timeout=30000, wait_until="networkidle")
            page.screenshot(path=screenshot_path, full_page=True)
            browser.close()
        return screenshot_path, None
    except Exception as e:
        return None, f"playwright screenshot failed: {e}"


def main():
    if len(sys.argv) != 3:
        print(json.dumps({"error": "usage: fetch_url_design.py <url> <output_dir>"}))
        sys.exit(1)

    url, output_dir = sys.argv[1], sys.argv[2]
    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https"):
        print(json.dumps({"error": f"not a valid http(s) url: {url}"}))
        sys.exit(1)

    os.makedirs(output_dir, exist_ok=True)

    screenshot_path, screenshot_err = take_screenshot(url, output_dir)
    tokens, tokens_err = fetch_css_tokens(url, output_dir)

    result = {
        "url": url,
        "screenshot": screenshot_path,
        "screenshot_error": screenshot_err,
        "tokens": tokens,
        "tokens_error": tokens_err,
    }

    tokens_json_path = os.path.join(output_dir, "tokens.json")
    with open(tokens_json_path, "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2)

    # Always print the summary — this is what the calling agent reads.
    print(json.dumps(result, indent=2))

    # Exit 0 even on partial failure: a failed screenshot with good tokens
    # (or vice versa) is still useful input, and the caller (skill) decides
    # how to proceed. Only exit non-zero if BOTH failed.
    if screenshot_path is None and tokens is None:
        sys.exit(2)
    sys.exit(0)


if __name__ == "__main__":
    main()
