import type { Diagnostic } from "@volar/language-server/node";
import type { LanguageServicePlugin } from "@volar/language-service";
import type Parser from "tree-sitter";
import { URI } from "vscode-uri";
import { JsrsVirtualCode } from "../../virtualCode";

export function create(): LanguageServicePlugin {
  return {
    capabilities: {
      diagnosticProvider: {
        interFileDependencies: true,
        workspaceDiagnostics: true,
      },
    },
    create(context) {
      return {
        provideDiagnostics(document) {
          const decoded = context.decodeEmbeddedDocumentUri(URI.parse(document.uri));
          if (!decoded) {
            return;
          }
          const sourceScript = context.language.scripts.get(decoded[0]);
          if (!sourceScript?.generated) {
            return;
          }

          const root = sourceScript.generated.root;
          if (!(root instanceof JsrsVirtualCode)) {
            return;
          }
          const errors: Diagnostic[] = [];

          for (const node of collectErrorNode(root.tree.rootNode)) {
            errors.push({
              source: "jsrs",
              range: {
                start: document.positionAt(node.startIndex),
                end: document.positionAt(node.endIndex),
              },
              message: "Parsing error",
              severity: 1,
            });
          }

          return errors;
        },
      };
    },
  };
}

function* collectErrorNode(node: Parser.SyntaxNode): Generator<Parser.SyntaxNode> {
  if (node.isError) {
    yield node;
  }
  for (const child of node.children) {
    yield* collectErrorNode(child);
  }
}
