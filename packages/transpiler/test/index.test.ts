import { describe, test } from "vitest";
import { transpile } from "../src";
import { fileURLToPath } from "node:url";
import prettier from "prettier";
import { basename } from "node:path";
import babelPlugin from "./babel-plugin";

describe("transpiler", () => {
  test("fixtures", async ({ expect }) => {
    // @ts-expect-error
    const fixtures = import.meta.glob("./fixtures/*.jsrs", {
      eager: true,
      query: "?raw",
    });
    const snapshotsDir = fileURLToPath(new URL("./snapshots", import.meta.url));
    for (const [path, { default: source }] of Object.entries(fixtures) as any) {
      const name = basename(path, ".jsrs");
      let result = transpile(source).code;

      try {
        var prettified = await prettier.format(result, {
          parser: "babel",
        });
      } catch (e) {
        console.log(result);
        throw e;
      }
      await expect(prettified).toMatchFileSnapshot(
        `${snapshotsDir}/${name}.do.js`
      );

      try {
        result = require("@babel/core").transformSync(result, {
          plugins: [babelPlugin],
        }).code;
        var prettified = await prettier.format(result, {
          parser: "babel",
        });
      } catch (e) {
        console.log(result);
        throw e;
      }
      await expect(prettified).toMatchFileSnapshot(
        `${snapshotsDir}/${name}.js`
      );
    }
  });
});
