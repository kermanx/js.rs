import { cp } from "node:fs/promises";
import { resolve } from "node:path";
import process from "node:process";
import { defineConfig } from "tsdown";

export default defineConfig({
  entry: {
    client: "./src/index.ts",
    server: "../language-server/src/index.ts",
  },
  sourcemap: true,
  external: ["vscode"],
  format: "cjs",
  minify: process.argv.includes("--minify"),
  define: {
    // So that tree-sitter will just require *.node files instead of searching for them.
    "process.versions.bun": JSON.stringify("1.0.0"),
  },
  async onSuccess() {
    const sourceDir1 = resolve(import.meta.dirname, "../parser/node_modules/tree-sitter/prebuilds");
    const sourceDir2 = resolve(import.meta.dirname, "../parser/tree-sitter-jsrs/prebuilds");
    const destDir = resolve(import.meta.dirname, "./dist/prebuilds");
    await cp(sourceDir1, destDir, { recursive: true });
    await cp(sourceDir2, destDir, { recursive: true });
  },
});
