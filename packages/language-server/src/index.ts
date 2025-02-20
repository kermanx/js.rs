import { createConnection, createServer, createTypeScriptProject, loadTsdkByPath } from "@volar/language-server/node";
import { create as createTypeScriptServices } from "volar-service-typescript";
import { createJsrsLanguagePlugin } from "./languagePlugin";
import { getLanguageServicePlugins } from "./service";

export { JsrsVirtualCode } from "./virtualCode";

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
      ...getLanguageServicePlugins(),
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
