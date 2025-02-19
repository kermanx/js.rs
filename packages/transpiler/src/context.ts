import type { Segment } from "./sourcemap";
import type { Options } from "./types";
import { MatcherPrinter } from "./matcher";
import { Printer } from "./nodes";

export type Code = Generator<Segment, void, void>;

export class Context {
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
    return this.insideLValue[this.insideLValue.length - 1];
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
    this.blockPostCbs[this.blockPostCbs.length - 1].push(callback);
  }

  as_printer(): Printer {
    return this as any as Printer;
  }

  as_matcher_printer(): MatcherPrinter {
    return this as any as MatcherPrinter;
  }
}

Object.defineProperties(
  Context.prototype,
  Object.getOwnPropertyDescriptors(Printer.prototype),
);
Object.defineProperties(
  Context.prototype,
  Object.getOwnPropertyDescriptors(MatcherPrinter.prototype),
);
