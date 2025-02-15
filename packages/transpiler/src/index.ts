import { parse } from "@jsrs/parser";
import { Context } from "./context";

export function transpile(source: string) {
  const parsed = parse(source);
  const context = new Context();
  return Array.from(context.as_printer().printFile(parsed.rootNode)).join('');
}
