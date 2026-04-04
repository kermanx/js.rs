declare global {
  const __JSRS_rangeSymbol: unique symbol;
  interface __JSRS_Range { [__JSRS_rangeSymbol]: true }

  function __JSRS_index<T, K extends number | __JSRS_Range>(array: T[], index: K): K extends __JSRS_Range ? number[] : number;
  function __JSRS_range(start: number, end: number): __JSRS_Range;
}

export {};
