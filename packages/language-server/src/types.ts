import type { CodeInformation } from "@volar/language-core";
import type { SyntaxNode } from "tree-sitter";

declare module "@volar/language-core" {
  interface CodeInformation {
    __combineOffset?: number;
  }
}

export class UserError {
  constructor(public node: SyntaxNode, public message: string) {}
}

export type Code = string | [
  source: string,
  offset: number,
  features?: CodeInformation,
] | SyntaxNode | UserError;
