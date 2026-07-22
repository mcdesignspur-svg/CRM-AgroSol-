import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const globalsPath = resolve("src/app/globals.css");
const css = readFileSync(globalsPath, "utf8");

const checks = [
  {
    name: "outline token must stay subtle (not pure black)",
    test: () => !css.includes("--color-outline: #000000"),
  },
  {
    name: "industrial-border must use 1px subtle border",
    test: () =>
      css.includes("border: 1px solid #e5e7eb") &&
      css.includes(".industrial-border"),
  },
  {
    name: "hard offset shadows must not return",
    test: () => !css.includes("box-shadow: 4px 4px 0 0 #000000"),
  },
  {
    name: "table headers must use light style",
    test: () => css.includes(".table-header") && css.includes("#f9fafb"),
  },
];

const failures = checks.filter((check) => !check.test());

if (failures.length > 0) {
  console.error("UI regression detected in src/app/globals.css:\n");
  for (const failure of failures) {
    console.error(`  - ${failure.name}`);
  }
  console.error(
    "\nThe CRM uses a minimalist UI. See design/minimal_ui/DESIGN.md",
  );
  process.exit(1);
}

console.log("UI token checks passed.");
