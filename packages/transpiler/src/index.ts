import { parse } from "@jsrs/parser";
import { Context } from "./context";
import { Options } from "./types";

export function transpile(source: string, options?: Options): string {
  const parsed = parse(source);
  const context = new Context(options);
  return Array.from(context.as_printer().printFile(parsed.rootNode)).join("");
}

export { Options } from "./types";
