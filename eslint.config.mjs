import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettierConfig from "eslint-config-prettier";
import { defineConfig, globalIgnores } from "eslint/config";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  prettierConfig,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "screenshots/**",
    "audit-venv/**",
    ".venv/**",
    "coverage/**",
    // Ignore markdown files
    "*.md",
    "**/*.md",
    "DOMAIN_RECOMMENDATIONS.md",
    "README.md",
    "CLAUDE.md",
    "MIGRATION-LIKES-DISLIKES.md",
  ]),
  {
    // Allow dangerouslySetInnerHTML for JSON-LD schema files
    // These are safe because they only output controlled JSON data, not user input
    files: ["components/public/*Schema.tsx", "components/public/SafeHtmlContent.tsx"],
    rules: {
      "react/no-danger": "off",
    },
  },
]);

export default eslintConfig;
