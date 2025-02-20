import type { CodeInformation } from "@volar/language-core";

declare module "@volar/language-core" {
  interface CodeInformation {
    __combineOffset?: number;
  }
}

export type Code = string | [
  source: string,
  offset: number,
  features?: CodeInformation,
];
