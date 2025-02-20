import type { LanguageServicePlugin } from "@volar/language-service";
import { create as createJsrsPlugin } from "./plugins/jsrs";

export function getLanguageServicePlugins() {
  const plugins: LanguageServicePlugin[] = [
    createJsrsPlugin(),
  ];

  return plugins;
}
