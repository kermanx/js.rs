#!/usr/bin/env node

import { Buffer } from "node:buffer";
import { readFile } from "node:fs/promises";
import process from "node:process";
import { transpile } from "./index";

async function readStdin(): Promise<string> {
	const chunks: Buffer[] = [];
	for await (const chunk of process.stdin) {
		chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
	}
	return Buffer.concat(chunks).toString("utf8");
}

async function main() {
	const input = process.argv[2];

	const source = input && input !== "-"
		? await readFile(input, "utf8")
		: process.stdin.isTTY
			? ""
			: await readStdin();

	if (!source) {
		process.stderr.write("Usage: jsrs-transpile <input.rs>\n       jsrs-transpile - < input.rs\n");
		process.exitCode = 1;
		return;
	}

	const { code } = transpile(source);
	process.stdout.write(code);
}

main().catch((error) => {
	process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
	process.exitCode = 1;
});
