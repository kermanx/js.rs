import { describe, test } from "vitest";
import { transpile } from "../src";
import { fileURLToPath } from "node:url";
import { readdirSync, readFileSync } from "node:fs";
import prettier from "prettier";

describe("transpiler", () => {
  test("fixtures", async ({ expect }) => {
    const fixturesDir = fileURLToPath(new URL("./fixtures", import.meta.url));
    const snapshotsDir = fileURLToPath(new URL("./snapshots", import.meta.url));
    for (const file of readdirSync(fixturesDir)) {
      if (file.endsWith(".jsrs")) {
        const name = file.replace(/\.jsrs$/, "");
        const source = readFileSync(`${fixturesDir}/${file}`, "utf-8");
        const result = transpile(source);
        try {
          var prettified = await prettier.format(result, { parser: "babel" });
        } catch (e) {
          console.log(result);
          throw e;
        }
        await expect(prettified).toMatchFileSnapshot(
          `${snapshotsDir}/${name}.js`
        );
      }
    }
  });
});
