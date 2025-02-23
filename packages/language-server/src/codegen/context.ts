import type { Code } from "../types";

class CodegenContext {
  needCaptureReturn = 0;
  returnType: (Code[] | null)[] = [];
  exportingTypes = new Set<string>();
}

// TODO: Make this not singleton
export const context = new CodegenContext();

export function refreshCodegenContext() {
  Object.assign(context, new CodegenContext());
}
