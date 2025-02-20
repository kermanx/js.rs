import type { LanguagePlugin } from "@volar/language-core";
import type { InitializeParams } from "@volar/language-service";
import type { TypeScriptExtraServiceScript } from "@volar/typescript";
import type ts from "typescript";
import type { URI } from "vscode-uri";
import { forEachEmbeddedCode } from "@volar/language-core";
import { JsrsVirtualCode } from "./virtualCode";

export async function createJsrsLanguagePlugin(_params: InitializeParams): Promise<LanguagePlugin<URI>> {
  return {
    getLanguageId(uri) {
      if (uri.path.endsWith(".jsrs")) {
        return "jsrs";
      }
    },
    createVirtualCode(uri, languageId, snapshot) {
      if (languageId === "jsrs") {
        return new JsrsVirtualCode(snapshot);
      }
    },
    updateVirtualCode(uri, virtualCode, newSnapshot, _ctx) {
      if (virtualCode instanceof JsrsVirtualCode) {
        virtualCode.update(newSnapshot);
        return virtualCode;
      }
    },
    typescript: {
      extraFileExtensions: [{ extension: "jsrs", isMixedContent: true, scriptKind: 7 satisfies ts.ScriptKind.Deferred }],
      getServiceScript() {
        return void 0;
      },
      getExtraServiceScripts(fileName, root) {
        const scripts: TypeScriptExtraServiceScript[] = [];
        for (const code of forEachEmbeddedCode(root)) {
          if (code.languageId === "javascript") {
            scripts.push({
              fileName: `${fileName}.${code.id}.js`,
              code,
              extension: ".js",
              scriptKind: 1 satisfies ts.ScriptKind.JS,
            });
          }
          else if (code.languageId === "typescript") {
            scripts.push({
              fileName: `${fileName}.${code.id}.ts`,
              code,
              extension: ".ts",
              scriptKind: 3 satisfies ts.ScriptKind.TS,
            });
          }
        }
        return scripts;
      },
    },
  };
}
