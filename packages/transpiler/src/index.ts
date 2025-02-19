import { parse } from "@jsrs/parser";
import { Context } from "./context";
import { Options } from "./types";
import { generateMap } from "./sourcemap";

export function transpile(source: string, options?: Options): {
  code: string;
  mappings: string;
} {
  const parsed = parse(source);
  const context = new Context(options);
  return generateMap(context.as_printer().printFile(parsed.rootNode), source);
}

export { Options } from "./types";
