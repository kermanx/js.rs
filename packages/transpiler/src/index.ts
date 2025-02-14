import { parse } from "@jsrs/parser";
import { Context } from "./context";

export function transpile(source: string) {
  const parsed = parse(source);
  const context = new Context();
  context.as_printer().printFile(parsed.rootNode);
  return context.toString();
}
