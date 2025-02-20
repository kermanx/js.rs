import type { Diagnostic } from "@volar/language-server/node";
import { createConnection, createServer, createTypeScriptProject, loadTsdkByPath } from "@volar/language-server/node";
import { create as createTypeScriptServices } from "volar-service-typescript";
import { URI } from "vscode-uri";
import { createJsrsLanguagePlugin } from "./languagePlugin";
import { JsrsVirtualCode } from "./virtualCode";

const connection = createConnection();
const server = createServer(connection);

connection.listen();

connection.onInitialize((params) => {
  const tsdk = loadTsdkByPath(params.initializationOptions.typescript.tsdk, params.locale);
  return server.initialize(
    params,
    createTypeScriptProject(tsdk.typescript, tsdk.diagnosticMessages, async () => ({
      languagePlugins: [
        await createJsrsLanguagePlugin(params),
      ],
    })),
    [
      ...createTypeScriptServices(tsdk.typescript),
      {
        capabilities: {
          codeLensProvider: {
            resolveProvider: true,
          },
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
              const virtualCode = context.language.scripts.get(decoded[0])?.generated?.embeddedCodes.get(decoded[1]);
              if (!(virtualCode instanceof JsrsVirtualCode)) {
                return;
              }
              const errors: Diagnostic[] = [];
              return errors;
            },
          };
        },
      },
    ],
  );
});

connection.onInitialized(() => {
  server.fileWatcher.watchFiles([
    "**/*.ts",
    "**/*.jsrs",
  ]);
  server.initialized();
});

connection.onShutdown(server.shutdown);
