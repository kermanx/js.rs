import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    client: "./src/index.ts",
    server: "../language-server/src/index.ts",
  },
  clean: true,
  sourcemap: true,
  external: ["vscode"],
  minify: process.argv.includes("--minify"),
  define: {
    // So that tree-sitter will just require *.node files instead of searching for them.
    "process.versions.bun": JSON.stringify("1.0.0"),
  },
});
