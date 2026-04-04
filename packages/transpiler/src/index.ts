import type { Options } from "./types";
import { parse } from "@jsrs/parser";
import { generateMap } from "./sourcemap";
import { Transpiler } from "./transpiler";
import "./nodes";
import "./matcher";

export function transpile(source: string, options?: Options): {
  code: string;
  mappings: string;
} {
  const parsed = parse(source);
  const context = new Transpiler(options);
  return generateMap(context.File(parsed.rootNode));
}

export { Options } from "./types";
