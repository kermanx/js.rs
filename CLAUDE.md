# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Project Is

**js.rs** is a transpiler that converts Rust syntax to JavaScript. It lets you write JavaScript using Rust's expressive syntax (enums, pattern matching, structs, impls, traits, etc.) and transpiles it to idiomatic JS with do-expressions, then through Babel to standard JS.

## Commands

This is a **pnpm monorepo**. All commands run from the repo root.

```bash
pnpm test          # Run all tests (transpiler + language server)
pnpm lint          # Lint all packages
pnpm lint:fix      # Auto-fix lint issues
pnpm play          # Start the Vite playground
```

To run a single test file:
```bash
pnpm vitest test/transpiler.test.ts
pnpm vitest test/language-server.test.ts
```

To update snapshots after intentional transpiler changes:
```bash
pnpm vitest --update-snapshots
```

## Architecture

### Transpilation Pipeline

```
.jsrs source
  → tree-sitter-jsrs (grammar submodule) → SyntaxNode AST
  → @jsrs/transpiler → JS with do-expressions + source maps
  → Babel (do-expression plugin) → standard JS
```

Every transpiled file gets `import * as _r from "@jsrs/runtime"` prepended — the runtime provides helpers for enums (`variant`, `matches`), traits (`implTrait`), references (`ref`/`deref`), ranges, and the try-operator symbol.

### Packages

- **`packages/transpiler`** — Core transpiler. Entry: `src/index.ts`. The `Transpiler` class in `src/transpiler.ts` is extended via `defineTranspilerComponent()` — each file in `src/` (nodes.ts, matcher.ts, type.ts, etc.) augments `Transpiler.prototype` with generator methods that `yield` code segments. This is the main place to add language features.

- **`packages/parser`** — Wraps tree-sitter + the `tree-sitter-jsrs` grammar submodule. Exposes `parse(input: string)`.

- **`packages/language-server`** — Volar.js-based LSP server. `src/virtualCode.ts` generates virtual TypeScript from .jsrs for IDE analysis. `src/codegen/` has per-feature code generators (struct.ts, enum.ts, impl.ts, match.ts, etc.) that mirror the transpiler but produce type-checkable TS.

- **`packages/runtime`** — Small JS helpers (`src/index.js`) imported by all transpiled files as `_r`.

- **`packages/unplugin`** — Build tool integration (Vite, Webpack, Rollup, esbuild, Astro, Nuxt, etc.) that calls `transpile()` on `.jsrs` files.

- **`packages/vscode`** — VSCode extension: TextMate grammar for syntax highlighting + LSP client.

### Adding a Transpiler Feature

1. Add a `.jsrs` fixture to `test/fixtures/`
2. Run `pnpm test` — it will fail with the current vs. expected output
3. Add/modify generator methods in `packages/transpiler/src/nodes.ts` (or a relevant file) using `defineTranspilerComponent`
4. Run `pnpm vitest --update-snapshots` to accept the new `.do.js` and `.js` snapshots
5. Mirror the change in `packages/language-server/src/codegen/` for IDE support

### Tree-sitter Grammar

`packages/parser/tree-sitter-jsrs/` is a **git submodule** (repo: `https://github.com/kermanx/tree-sitter-jsrs`). Grammar changes require updating that submodule separately. The grammar is defined in `grammar.js` and compiled to native Node.js bindings.
