import type { Language } from "tree-sitter";
import Parser from "tree-sitter";
import JsRs from "tree-sitter-jsrs";

export function parse(input: string) {
  const parser = new Parser();
  parser.setLanguage(JsRs as unknown as Language);
  return parser.parse(input);
}
