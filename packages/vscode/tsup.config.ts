import fs from "node:fs";
import process from "node:process";
import { defineConfig } from "tsup";

const unlinkSync = fs.unlinkSync;
fs.unlinkSync = (path) => {
  if (typeof path === "string" && path.endsWith(".node")) {
    try {
      return unlinkSync(path);
    }
    catch {
      return;
    }
  }
  return unlinkSync(path);
};

export default defineConfig({
  entry: {
    client: "./src/index.ts",
    server: "../language-server/src/index.ts",
  },
  sourcemap: true,
  external: ["vscode"],
  minify: process.argv.includes("--minify"),
  define: {
    // So that tree-sitter will just require *.node files instead of searching for them.
    "process.versions.bun": JSON.stringify("1.0.0"),
  },
});
