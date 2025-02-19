import { defineConfig } from "tsup";
import fs from "fs";

const writeFile = fs.promises.writeFile;
fs.promises.writeFile = (path, data, options) => {
  if (typeof path === "string" && path.endsWith(".node")) {
    try {
      return writeFile(path, data, options);
    } catch {
      return undefined!;
    }
  }
  return writeFile(path, data, options);
};

const unlinkSync = fs.unlinkSync;
fs.unlinkSync = (path) => {
  if (typeof path === "string" && path.endsWith(".node")) {
    try {
      return unlinkSync(path);
    } catch {
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
  clean: true,
  sourcemap: true,
  external: ["vscode"],
  minify: process.argv.includes("--minify"),
  define: {
    // So that tree-sitter will just require *.node files instead of searching for them.
    "process.versions.bun": JSON.stringify("1.0.0"),
  },
});
