import type { Code } from "../types";

class CodegenContext {
  needCaptureReturn = 0;
  returnType: (Code[] | null)[] = [];
}

// TODO: Make this not singleton
export const context = new CodegenContext();
