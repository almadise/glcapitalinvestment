from __future__ import annotations

import argparse
import datetime as dt
from pathlib import Path
from typing import List

import requests
from bs4 import BeautifulSoup
from markdownify import markdownify as md


REPO_ROOT = Path(__file__).resolve().parents[1]
APP_DIR = REPO_ROOT / "src" / "app"
MIRROR_ROOT = REPO_ROOT / "public" / "markdown-mirrors"


def route_from_page_path(page_path: Path) -> str:
    rel = page_path.relative_to(APP_DIR)
    parts = list(rel.parts[:-1])  # remove page.tsx
    clean_parts = []
    for part in parts:
        if part.startswith("(") and part.endswith(")"):
            continue
        clean_parts.append(part)
    if not clean_parts:
        return "/"
    return "/" + "/".join(clean_parts)


def discover_page_files() -> List[Path]:
    page_files = sorted(APP_DIR.rglob("page.tsx"))
    filtered: List[Path] = []
    for page_file in page_files:
        route = route_from_page_path(page_file)
        # Skip dynamic routes like /case/[id]
        if "[" in route or "]" in route:
            continue
        filtered.append(page_file)
    return filtered


def strip_junk(html: str) -> BeautifulSoup:
    soup = BeautifulSoup(html, "html.parser")

    # Remove non-content tags.
    for tag in soup.select("script, style, noscript, iframe, svg"):
        tag.decompose()

    # Remove global UI chrome and common popups.
    for tag in soup.select(
        "nav, footer, [role='dialog'], [aria-modal='true'], .modal, .popup, .cookie, #cookie-banner, #cookie-consent"
    ):
        tag.decompose()

    return soup


def extract_markdown(soup: BeautifulSoup) -> str:
    main = soup.find("main")
    target = main if main else soup.body
    if target is None:
        return ""
    return md(str(target), heading_style="ATX").strip()


def metadata(soup: BeautifulSoup) -> tuple[str, str]:
    title = ""
    if soup.title and soup.title.string:
        title = soup.title.string.strip()

    desc_tag = soup.find("meta", attrs={"name": "description"})
    description = ""
    if desc_tag and desc_tag.get("content"):
        description = str(desc_tag.get("content")).strip()
    return title, description


def mirror_path_for_route(route: str) -> Path:
    route_key = "home" if route == "/" else route.strip("/")
    return MIRROR_ROOT / route_key / "index.md"


def mirror_url_for_route(base_url: str, route: str) -> str:
    route_key = "home" if route == "/" else route.strip("/")
    return f"{base_url.rstrip('/')}/markdown-mirrors/{route_key}/index.md"


def generate(base_url: str, timeout: int) -> tuple[int, int, List[str]]:
    pages = discover_page_files()
    session = requests.Session()
    generated = 0
    attempted = 0
    urls_generated: List[str] = []

    now = dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat()

    for page_file in pages:
        route = route_from_page_path(page_file)
        url = base_url.rstrip("/") + ("" if route == "/" else route)
        attempted += 1

        try:
            resp = session.get(url, timeout=timeout)
            if resp.status_code >= 400:
                continue
        except requests.RequestException:
            continue

        soup = strip_junk(resp.text)
        title, description = metadata(soup)
        body_md = extract_markdown(soup)

        if not body_md:
            continue

        out_path = mirror_path_for_route(route)
        out_path.parent.mkdir(parents=True, exist_ok=True)
        mirror_url = mirror_url_for_route(base_url, route)
        content = (
            f"title: {title}\n"
            f"description: {description}\n"
            f"url: {url}\n"
            f"last_updated: {now}\n\n"
            f"{body_md}\n"
        )
        out_path.write_text(content, encoding="utf-8")
        generated += 1
        urls_generated.append(mirror_url)

    return attempted, generated, urls_generated


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate markdown mirrors for app pages.")
    parser.add_argument(
        "--base-url",
        default="https://www.glcapitalinvestment.com",
        help="Public website base URL.",
    )
    parser.add_argument("--timeout", type=int, default=20, help="HTTP timeout in seconds.")
    args = parser.parse_args()

    attempted, generated, urls_generated = generate(args.base_url, args.timeout)
    print(f"Pages detected: {attempted}")
    print(f"Markdown files generated: {generated}")
    for url in urls_generated:
        print(url)


if __name__ == "__main__":
    main()
