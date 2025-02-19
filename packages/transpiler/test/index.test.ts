import { basename } from "node:path";
import { fileURLToPath } from "node:url";
import { transformSync } from "@babel/core";
import prettier from "prettier";
import { describe, it } from "vitest";
import { transpile } from "../src";
import babelPlugin from "./babel-plugin";

describe("transpiler", () => {
  it("fixtures", async ({ expect }) => {
    // @ts-expect-error
    const fixtures = import.meta.glob("./fixtures/*.jsrs", {
      eager: true,
      query: "?raw",
    });
    const snapshotsDir = fileURLToPath(new URL("./snapshots", import.meta.url));
    for (const [path, { default: source }] of Object.entries(fixtures) as any) {
      const name = basename(path, ".jsrs");
      let result = transpile(source).code;

      let prettified: string;
      try {
        prettified = await prettier.format(result, {
          parser: "babel",
        });
      }
      catch (e) {
        console.log(result);
        throw e;
      }
      await expect(prettified).toMatchFileSnapshot(
        `${snapshotsDir}/${name}.do.js`,
      );

      try {
        result = transformSync(result, {
          plugins: [babelPlugin],
        })!.code!;
        prettified = await prettier.format(result, {
          parser: "babel",
        });
      }
      catch (e) {
        console.log(result);
        throw e;
      }
      await expect(prettified).toMatchFileSnapshot(
        `${snapshotsDir}/${name}.js`,
      );
    }
  });
});
