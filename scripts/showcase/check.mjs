// Unit-checks the home page's pure modules (the zip, the exploded still life) and media in Node:
// compiles scripts/showcase/checks.ts with tsc into node_modules/.cache, then runs it.
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const out = path.join(root, "node_modules/.cache/showcase-check");
try {
  execFileSync(process.execPath, [path.join(root, "node_modules/typescript/bin/tsc"), "-p", "scripts/showcase/tsconfig.json", "--outDir", out], {
    cwd: root,
    stdio: "inherit",
  });
} catch {
  console.error("showcase:check: compile failed");
  process.exit(1);
}
await import(pathToFileURL(path.join(out, "scripts/showcase/checks.js")).href);
