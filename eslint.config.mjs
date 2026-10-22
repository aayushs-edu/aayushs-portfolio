import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  // Decorative code shown inside the hero letters; not part of the app.
  { ignores: ["src/components/hero/code-snippets/**"] },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
];

export default eslintConfig;
