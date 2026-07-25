import { readFileSync } from "node:fs";
import { join } from "node:path";

export const dynamic = "force-static";

export function GET() {
  const script = readFileSync(join(process.cwd(), "script.js"), "utf8");

  return new Response(script, {
    headers: {
      "Cache-Control": "public, max-age=0, must-revalidate",
      "Content-Type": "text/javascript; charset=utf-8",
    },
  });
}
