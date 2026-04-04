import type { Segment } from "./sourcemap";
import type { Options } from "./types";

export type Code = Generator<Segment, void, void>;

export class Transpiler {
  constructor(options: Options = {}) {
    this.options = options;
  }

  options: Options;
  blockPostCbs: Array<Array<(this: this) => Code>> = [[]];
  matchIdentifiers: string[] = [];
  reexportsNamed: string[] = [];
  reexportsAll: string[] = [];
  tempVarId = 0;
  maxMatchDepth = 0;
  insideLValue: boolean[] = [false];

  get isInsideLValue() {
    return this.insideLValue.at(-1);
  }

  blockPost(callback: (this: this) => Code) {
    this.blockPostCbs.at(-1)!.push(callback);
  }

  newTempVar(_forExpr?: unknown) {
    return `_t${this.tempVarId++}`;
  }
}

export function defineTranspilerComponent<T extends Record<string, (this: Transpiler, ...args: any[]) => any>>(part: T): T {
  Object.assign(Transpiler.prototype, part);
  return part;
}
