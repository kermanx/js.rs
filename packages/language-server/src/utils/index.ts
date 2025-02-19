import type { CodeInformation } from "@volar/language-core";
import type { Code } from "../types";

export function* wrapWith(
    start: number,
    end: number,
    features: CodeInformation,
    ...codes: Code[]
): Generator<Code> {
    yield [``, start, features];
	let offset = 1;
	for (const code of codes) {
		if (typeof code !== "string") {
			offset++;
		}
		yield code;
	}
	yield [``, end, { __combineOffset: offset }];
}
