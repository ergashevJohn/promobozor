module.exports = {
  // TypeScript and JavaScript files
  "*.{ts,tsx,js,jsx}": [
    "eslint --fix", // Fix ESLint errors
    "prettier --write", // Format with Prettier
    "vitest related --run", // Run related tests
  ],

  // JSON files
  "*.{json,jsonc}": ["prettier --write"],

  // Markdown files
  "*.{md,mdx}": ["prettier --write"],

  // CSS/SCSS files
  "*.{css,scss,sass}": ["prettier --write"],
};
