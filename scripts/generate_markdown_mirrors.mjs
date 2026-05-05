import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import TurndownService from "turndown";
import * as cheerio from "cheerio";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const appDir = path.join(repoRoot, "src", "app");
const mirrorRoot = path.join(repoRoot, "public", "markdown-mirrors");
const baseUrl = process.argv[2] || "https://www.glcapitalinvestment.com";

function routeFromPage(filePath) {
  const rel = path.relative(appDir, filePath).replaceAll("\\", "/");
  const parts = rel.split("/").slice(0, -1);
  const clean = parts.filter((p) => !(p.startsWith("(") && p.endsWith(")")));
  if (clean.length === 0) return "/";
  return `/${clean.join("/")}`;
}

async function listPageFiles(dir) {
  const out = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      const sub = await listPageFiles(full);
      out.push(...sub);
    } else if (e.isFile() && e.name === "page.tsx") {
      out.push(full);
    }
  }
  return out;
}

function stripJunk(html) {
  const $ = cheerio.load(html);
  $("script, style, noscript, iframe, svg").remove();
  $("nav, footer, [role='dialog'], [aria-modal='true'], .modal, .popup, .cookie, #cookie-banner, #cookie-consent").remove();
  return $;
}

function mdFromDom($) {
  const td = new TurndownService({ headingStyle: "atx" });
  const target = $("main").first().length ? $("main").first() : $("body").first();
  const text = td.turndown(target.html() || "").trim();
  return text;
}

function mirrorPath(route) {
  const key = route === "/" ? "home" : route.slice(1);
  return path.join(mirrorRoot, key, "index.md");
}

function mirrorUrl(route) {
  const key = route === "/" ? "home" : route.slice(1);
  return `${baseUrl.replace(/\/$/, "")}/markdown-mirrors/${key}/index.md`;
}

async function run() {
  const files = await listPageFiles(appDir);
  const routes = files
    .map(routeFromPage)
    .filter((r) => !r.includes("["))
    .sort((a, b) => a.localeCompare(b));

  let generated = 0;
  const generatedUrls = [];
  const now = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");

  for (const route of routes) {
    const pageUrl = `${baseUrl.replace(/\/$/, "")}${route === "/" ? "/" : route}`;
    try {
      const resp = await fetch(pageUrl, { redirect: "follow" });
      if (!resp.ok) continue;
      const html = await resp.text();
      const $ = stripJunk(html);
      const title = $("title").first().text().trim();
      const description = $('meta[name="description"]').attr("content")?.trim() || "";
      const bodyMd = mdFromDom($);
      if (!bodyMd) continue;

      const output = `title: ${title}\ndescription: ${description}\nurl: ${pageUrl}\nlast_updated: ${now}\n\n${bodyMd}\n`;
      const outPath = mirrorPath(route);
      await fs.mkdir(path.dirname(outPath), { recursive: true });
      await fs.writeFile(outPath, output, "utf8");
      generated += 1;
      generatedUrls.push(mirrorUrl(route));
    } catch {
      // Ignore network or parse failures per page.
    }
  }

  console.log(`Pages detected: ${routes.length}`);
  console.log(`Markdown files generated: ${generated}`);
  for (const url of generatedUrls) console.log(url);
}

run();
