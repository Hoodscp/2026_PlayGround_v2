import { readFileSync } from "node:fs";
import { join } from "node:path";

function readLegacyHtml() {
  return readFileSync(join(process.cwd(), "index.html"), "utf8");
}

function extractBody(html: string) {
  const match = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);

  if (!match) {
    throw new Error("Legacy index.html does not contain a body element.");
  }

  return match[1].replace(/\s*<script\s+src=["']script\.js["']><\/script>\s*/i, "");
}

function withoutMotionSection(body: string) {
  return body.replace(
    /\s*<section class="motion-lab"[\s\S]*?<\/section>\s*(?=<\/main>)/i,
    "",
  );
}

function withoutHeroSection(body: string) {
  return body.replace(
    /\s*<section class="hero"[\s\S]*?<\/section>\s*(?=<section class="motion-lab")/i,
    "",
  );
}

export function getHomeMarkup() {
  return withoutMotionSection(extractBody(readLegacyHtml()));
}

export function getMotionMarkup() {
  return withoutHeroSection(extractBody(readLegacyHtml()));
}
