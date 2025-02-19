import type { FilterPattern } from "unplugin-utils";
import type { Options as TranspilerOptions } from "@jsrs/transpiler";

export interface Options {
  include?: FilterPattern;
  exclude?: FilterPattern;
  transpilerOptions: Options;
}
