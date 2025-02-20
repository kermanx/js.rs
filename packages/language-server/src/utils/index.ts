import type { CodeInformation } from "@volar/language-core";
import type { Code } from "../types";

export function wrapWith(
  start: number,
  end: number,
  features: CodeInformation,
  ...codes: Code[]
): Generator<Code>;
export function wrapWith(
  start: number,
  end: number,
  features: CodeInformation,
  codes: () => Iterable<Code>
): Generator<Code>;
export function* wrapWith(
  start: number,
  end: number,
  features: CodeInformation,
  ...codes: Code[] | [() => Iterable<Code>]
): Generator<Code> {
  yield [``, start, features];
  let offset = 1;

  let normalized: Iterable<Code>;
  if (codes.length === 1 && typeof codes[0] === "function") {
    normalized = codes[0]();
  }
  else {
    normalized = codes as Code[];
  }

  for (const code of normalized) {
    if (typeof code !== "string") {
      offset++;
    }
    yield code;
  }
  yield [``, end, { __combineOffset: offset }];
}
