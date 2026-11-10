// Fails when a category name is hardcoded in src/ outside the allowlist.
// Allowed: entries in scripts/grep-allowlist.txt. The seed migration lives in supabase/, outside src/.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
const ROOT = process.cwd();
const NAMES = ["عناية بالبشرة", "واقيات الشمس", "العناية بالشعر", "مستحضرات التجميل"];
const allow = readFileSync(join(ROOT, "scripts/grep-allowlist.txt"), "utf8")
  .split("\n")
  .map((l) => l.trim())
  .filter((l) => l && !l.startsWith("#"))
  .map((l) => {
    const [path, text] = l.split("::").map((x) => x.trim());
    return { path, text };
  });
function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}
const failures = [];
let matches = 0;
for (const file of walk(join(ROOT, "src"))) {
  const rel = relative(ROOT, file).replaceAll("\\", "/");
  const lines = readFileSync(file, "utf8").split("\n");
  lines.forEach((line, i) => {
    if (!NAMES.some((n) => line.includes(n))) return;
    matches++;
    const ok = allow.some((a) => a.path === rel && (a.text === "*" || line.includes(a.text)));
    if (!ok) failures.push(`${rel}:${i + 1}: ${line.trim().slice(0, 140)}`);
  });
}
if (failures.length) {
  console.error("Hardcoded category names found outside the allowlist:");
  for (const f of failures) console.error("  " + f);
  process.exit(1);
}
console.log(`check-hardcoded-categories: ${matches} matches, all allowed.`);
