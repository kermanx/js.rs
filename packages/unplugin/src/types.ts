import type { FilterPattern } from "unplugin-utils";

export interface Options {
  include?: FilterPattern;
  exclude?: FilterPattern;
  transpilerOptions: Options;
}
