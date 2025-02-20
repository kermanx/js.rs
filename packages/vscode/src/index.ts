import * as serverProtocol from "@volar/language-server/protocol";
import { activateAutoInsertion, createLabsInfo, getTsdk } from "@volar/vscode";
import { defineExtension, onDeactivate } from "reactive-vscode";
import * as vscode from "vscode";
import * as lsp from "vscode-languageclient/node";

let client: lsp.BaseLanguageClient;

export const { activate, deactivate } = defineExtension(async (context) => {
  const serverModule = vscode.Uri.joinPath(context.extensionUri, "dist", "server.cjs");
  const runOptions = { execArgv: <string[]>[] };
  const debugOptions = { execArgv: ["--nolazy", `--inspect=${6009}`] };
  const serverOptions: lsp.ServerOptions = {
    run: {
      module: serverModule.fsPath,
      transport: lsp.TransportKind.ipc,
      options: runOptions,
    },
    debug: {
      module: serverModule.fsPath,
      transport: lsp.TransportKind.ipc,
      options: debugOptions,
    },
  };
  const clientOptions: lsp.LanguageClientOptions = {
    documentSelector: [{
      language: "jsrs",
    }],
    initializationOptions: {
      typescript: {
        tsdk: (await getTsdk(context))!.tsdk,
      },
    },
  };
  client = new lsp.LanguageClient(
    "jsrs",
    "jsrs",
    serverOptions,
    clientOptions,
  );
  await client.start();

  onDeactivate(() => {
    client?.stop();
  });

  // support for auto close tag
  activateAutoInsertion("jsrs", client);

  // support for https://marketplace.visualstudio.com/items?itemName=johnsoncodehk.volarjs-labs
  // ref: https://twitter.com/johnsoncodehk/status/1656126976774791168
  const labsInfo = createLabsInfo(serverProtocol);
  labsInfo.addLanguageClient(client);
  return labsInfo.extensionExports;
});
