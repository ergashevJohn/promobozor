import "dotenv/config";

import { spawnSync } from "node:child_process";
import path from "node:path";

const scripts = [
  "preview-store-slugs.ts",
  "preview-category-slugs.ts",
  "preview-brand-slugs.ts",
  "preview-promocode-slugs.ts",
];

function main() {
  const dir = path.dirname(new URL(import.meta.url).pathname);
  for (const script of scripts) {
    console.log(`\n========== ${script} ==========\n`);
    const result = spawnSync("npx", ["tsx", path.join(dir, script)], {
      stdio: "inherit",
      env: process.env,
    });
    if (result.status !== 0) {
      process.exit(result.status ?? 1);
    }
  }
}

main();
