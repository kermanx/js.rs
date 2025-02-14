import { MatcherPrinter } from "./matcher";
import { Printer } from "./nodes";

export class Context {
  result: string[] = [];
  discriminants = new Map<string, number>();
  matcherQuotes = 0;
  labelId = 0;
  blockPostCbs: Array<Array<() => void>> = [[]];

  push(token: string | number) {
    if (typeof token === "number") {
      token = token.toString();
    }
    if (typeof token !== "string") {
      throw new Error("Expected string, got " + token);
    }
    this.result.push(token);
  }

  getDiscriminantId(name: string): number {
    const id = this.discriminants.size;
    if (!this.discriminants.has(name)) {
      this.discriminants.set(name, id);
    }
    return this.discriminants.get(name)!;
  }

  allocLabel(): number {
    return ++this.labelId;
  }

  freeLabel() {
    this.labelId--;
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
