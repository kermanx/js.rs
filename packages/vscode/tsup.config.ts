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
    "process.versions.bun": JSON.stringify("1.0.0"),
  },
  esbuildPlugins: [
    {
      name: "bindingProcessor",
      setup(build) {
        build.onEnd(async (result) => {
          if (result.outputFiles) {
            for (const file of result.outputFiles) {
              if (file.path.endsWith(".cjs")) {
                file.contents = Buffer.from(
                  file.text.replace(/\s+=\s+binding;/g, " = (x=>(typeof x==='string'?require(x):x))(binding);")
                );
              }
            }
          }
        });
      },
    },
  ],
});
