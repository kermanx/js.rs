import { parse } from "@jsrs/parser";
import { Context } from "./context";
import { Options } from "./types";
import { Segment } from "muggle-string";
import { generateMap } from "muggle-string/out/map";

export function transpile(source: string, options?: Options): string {
  const parsed = parse(source);
  const context = new Context(options);
  const segments: Segment[] = [];
  for (const s of context.as_printer().printFile(parsed.rootNode)) {
    if (typeof s === "string") segments.push(s);
    else segments.push([s[0], undefined, s[1]]);
  }
  generateMap(segments);
}

export { Options } from "./types";
