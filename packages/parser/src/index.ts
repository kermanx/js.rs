import type { Language } from "tree-sitter";
import Parser from "tree-sitter";
import Rust from "tree-sitter-rust";

export function parse(input: string) {
  const parser = new Parser();
  parser.setLanguage(Rust as unknown as Language);
  return parser.parse(input);
}
