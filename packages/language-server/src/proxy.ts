// Based on https://github.com/vuejs/language-tools/blob/master/packages/typescript-plugin/lib/common.ts

import type * as ts from "typescript";

const windowsPathReg = /\\/g;

export function proxyLanguageService(
  languageService: ts.LanguageService,
) {
  languageService.getCompletionsAtPosition = getCompletionsAtPosition(languageService.getCompletionsAtPosition);
  languageService.getCompletionEntryDetails = getCompletionEntryDetails(languageService.getCompletionEntryDetails);
  languageService.getCodeFixesAtPosition = getCodeFixesAtPosition(languageService.getCodeFixesAtPosition);
}

function getCompletionsAtPosition(getCompletionsAtPosition: ts.LanguageService["getCompletionsAtPosition"]): ts.LanguageService["getCompletionsAtPosition"] {
  return (filePath, position, options, formattingSettings) => {
    const fileName = filePath.replace(windowsPathReg, "/");
    const result = getCompletionsAtPosition(fileName, position, options, formattingSettings);
    if (result) {
      // filter __JSRS_
      result.entries = result.entries.filter(
        entry => !entry.name.includes("__JSRS_")
          && !entry.labelDetails?.description?.includes("__JSRS_"),
      );
    }
    return result;
  };
}

function getCompletionEntryDetails(getCompletionEntryDetails: ts.LanguageService["getCompletionEntryDetails"]): ts.LanguageService["getCompletionEntryDetails"] {
  return (filename, ...args) => {
    const details = getCompletionEntryDetails(filename, ...args);
    // modify import statement
    if (filename.endsWith(".jsrs")) {
      for (const codeAction of details?.codeActions ?? []) {
        for (const change of codeAction.changes) {
          for (const textChange of change.textChanges) {
            textChange.newText = textChange.newText.replace(
              /\bimport (.*) from (['"].*['"])/,
              (_, name, source) => `import!(${name} from ${source})`,
            );
          }
        }
      }
    }
    return details;
  };
}

function getCodeFixesAtPosition(getCodeFixesAtPosition: ts.LanguageService["getCodeFixesAtPosition"]): ts.LanguageService["getCodeFixesAtPosition"] {
  return (...args) => {
    let result = getCodeFixesAtPosition(...args);
    // filter __JSRS_
    result = result.filter(entry => !entry.description.includes("__JSRS_"));
    return result;
  };
}
