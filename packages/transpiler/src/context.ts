import { MatcherPrinter } from "./matcher";
import { Printer } from "./nodes";

export type Code = Generator<string, void, void>;

export class Context {
  discriminants = new Map<string, number>();
  blockPostCbs: Array<Array<(this: this) => Code>> = [[]];
  matchIdentifiers: string[] | null = null;
  _matchDepth = 0;
  maxMatchDepth = 0;

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
  Object.getOwnPropertyDescriptors(Printer.prototype)
);
Object.defineProperties(
  Context.prototype,
  Object.getOwnPropertyDescriptors(MatcherPrinter.prototype)
);
