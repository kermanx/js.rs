import type { SyntaxNode } from "tree-sitter";
import type { Code } from "../types";
import { codeFeatures } from "../utils/codeFeatures";
import { wrapWith } from "./utils";

export function* generateUse(node: SyntaxNode): Generator<Code> {
  const reexportsNamed: Code[] = [];
  const reexportsAll: string[] = [];
  yield* generateUseItem(node.childForFieldName("argument")!);
  if (node.namedChildren[0]?.type === "visibility_modifier") {
    if (reexportsNamed.length) {
      yield "export {";
      yield* reexportsNamed;
      yield "};\n";
    }
    if (reexportsAll.length) {
      for (const path of reexportsAll) {
        yield `export * from "`;
        yield path;
        yield `";\n`;
      }
    }
  }
  else {
    if (reexportsAll.length) {
      // TODO: throw new Error("Wildcard import is not supported");
    }
  }

  function* generateUseItem(node: SyntaxNode, base = "", alias?: Code): Generator<Code> {
    switch (node.type) {
      case "scoped_use_list": {
        const path = getPath(node.namedChildren[0]);
        let wildcard: Code[] | undefined;
        const named: [original: Code, alias?: Code][] = [];
        for (const child of node.namedChildren[1].namedChildren) {
          if (child.type === "self") {
            wildcard = [...wrapWith(
              child.startIndex,
              child.endIndex,
              codeFeatures.verification,
              getSelfName(node.namedChildren[0]),
            )];
          }
          else if (child.type === "identifier") {
            named.push([[child.text, child.startIndex]]);
          }
          else if (child.type === "use_as_clause") {
            const original = child.namedChildren[0];
            const alias = child.namedChildren[1];
            if (original.type === "self") {
              wildcard = [[alias.text, alias.startIndex]];
            }
            else if (original.type === "identifier") {
              named.push([[original.text, original.startIndex], [alias.text, alias.startIndex]]);
            }
            else {
              yield* generateUseItem(original, path, [alias.text, alias.startIndex]);
            }
          }
          else {
            yield* generateUseItem(child, path);
          }
        }
        if (wildcard) {
          reexportsNamed.push(...wildcard, ", ");
          yield `import * as `;
          yield* wildcard;
          yield ` from `;
          yield* generatePath(node, path);
          yield `;\n`;
        }
        if (named.length > 0) {
          yield "import { ";
          let isFirst = true;
          for (const [name, alias] of named) {
            if (!isFirst)
              yield `, `;
            isFirst = false;

            reexportsNamed.push(alias || name, ", ");
            yield name;
            if (alias) {
              yield ` as `;
              yield alias;
            }
          }
          yield ` } from `;
          yield* generatePath(node, path);
          yield `;\n`;
        }
        break;
      }
      case "scoped_identifier": {
        const path = getPath(node.namedChildren[0]);
        const name = node.namedChildren[1];
        if (name.text === "self") {
          const nameCode = alias
            ? [alias]
            : [...wrapWith(
                name.startIndex,
                name.endIndex,
                codeFeatures.verification,
                getSelfName(node.namedChildren[0]),
              )];
          reexportsNamed.push(...nameCode, ", ");
          yield `import * as `;
          yield* nameCode;
          yield ` from `;
          yield* generatePath(node, path);
          yield `;\n`;
        }
        else {
          reexportsNamed.push(alias || [name.text, name.startIndex], ", ");
          yield `import { `;
          yield name;
          if (alias) {
            yield ` as `;
            yield alias;
          }
          yield ` } from `;
          yield* generatePath(node, path);
          yield `;\n`;
        }
        break;
      }
      case "identifier": {
        yield `import * as `;
        yield node;
        yield ` from `;
        yield* generatePath(node, node.text);
        yield `;\n`;
        break;
      }
      case "use_as_clause": {
        const original = node.namedChildren[0];
        yield* generateUseItem(original, base, alias);
        break;
      }
      case "use_wildcard": {
        const path = getPath(node.namedChildren[0]);
        reexportsAll.push(path);
        break;
      }
    }

    function getPath(path: SyntaxNode): string {
      return base ? `${base}/${printScopedIdentifier(path)}` : printScopedIdentifier(path);
    }

    function getSelfName(path: SyntaxNode): string {
      if (path.type === "identifier") {
        return path.text;
      }
      else if (path.type === "scoped_identifier") {
        return getSelfName(path.namedChildren[1]);
      }
      else if (path.type === "crate") {
        return "crate";
      }
      else {
        return "";
      }
    }
  }

  function generatePath(node: SyntaxNode, path: string): Generator<Code> {
    return wrapWith(
      node.startIndex,
      node.endIndex,
      codeFeatures.verification,
      `"`,
      path,
      `"`,
    );
  }
}

export function printScopedIdentifier(path: SyntaxNode): string {
  if (path.type === "identifier") {
    return `${path.text}`;
  }
  else if (path.type === "scoped_identifier") {
    return `${printScopedIdentifier(path.namedChildren[0])}/${path.namedChildren[1].text}`;
  }
  else if (path.type === "crate") {
    return `@`;
  }
  else {
    return "";
  }
}
