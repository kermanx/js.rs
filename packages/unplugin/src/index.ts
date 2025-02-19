import type { UnpluginFactory } from "unplugin";
import type { Options } from "./types";
import { transpile } from "@jsrs/transpiler";
import { createUnplugin } from "unplugin";
import { createFilter } from "unplugin-utils";

export const unpluginFactory: UnpluginFactory<Options | undefined> = (
  options,
) => {
  const transformInclude = createFilter(options?.include, options?.exclude);
  return {
    name: "js.rs",
    transformInclude,
    transform(code) {
      return transpile(code, options?.transpilerOptions);
    },
  };
};

export const unplugin = /* #__PURE__ */ createUnplugin(unpluginFactory);

export default unplugin;
