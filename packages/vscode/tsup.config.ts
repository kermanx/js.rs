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
    "process.env.NODE_ENV": "\"production\"",
  },
});
