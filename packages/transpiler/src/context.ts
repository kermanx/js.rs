import { MatcherPrinter } from "./matcher";
import { Printer } from "./nodes";

export class Context {
  result: string[] = [];
  discriminants = new Map<string, number>();
  blockPostCbs: Array<Array<() => void>> = [[]];
  matchIdentifiers: string[] | null = null;
  matchDepth = 0;

  push(token: string | number) {
    if (typeof token === "number") {
      token = token.toString();
    }
    if (typeof token !== "string") {
      throw new Error("Expected string, got " + token);
    }
    this.result.push(token);
  }

  getDiscriminantId(name: string): string {
    let id = this.discriminants.get(name);
    if (!id) {
      id = this.discriminants.size;
      this.discriminants.set(name, id);
    }
    return `/*${name}*/ ${id}`;
  }

  blockPost(callback: () => void) {
    this.blockPostCbs[this.blockPostCbs.length - 1].push(callback);
  }

  toString(): string {
    return this.result.join("");
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
