import type { Segment } from "./sourcemap";
import type { Options } from "./types";

export type Code = Generator<Segment, void, void>;

export class Transpiler {
  constructor(options: Options = {}) {
    this.options = options;
  }

  options: Options;
  discriminants = new Map<string, number>();
  blockPostCbs: Array<Array<(this: this) => Code>> = [[]];
  matchIdentifiers: string[] = [];
  reexportsNamed: string[] = [];
  reexportsAll: string[] = [];
  _matchDepth = 0;
  maxMatchDepth = 0;
  insideLValue: boolean[] = [false];

  get isInsideLValue() {
    return this.insideLValue.at(-1);
  }

  get matchDepth() {
    return this._matchDepth;
  }

  set matchDepth(value: number) {
    this._matchDepth = value;
    this.maxMatchDepth = Math.max(this.maxMatchDepth, value);
  }

  getDiscriminantId(name: string): string {
    let id = this.discriminants.get(name);
    if (!id) {
      id = this.discriminants.size;
      this.discriminants.set(name, id);
    }
    return `/*${name}*/ ${id}`;
  }

  blockPost(callback: (this: this) => Code) {
    this.blockPostCbs.at(-1)!.push(callback);
  }
}

export function defineTranspilerComponent<T extends Record<string, (this: Transpiler, ...args: any[]) => any>>(part: T): T {
  Object.assign(Transpiler.prototype, part);
  return part;
}
