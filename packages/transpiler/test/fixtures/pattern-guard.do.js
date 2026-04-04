import * as _r from "@jsrs/runtime";
export function Option() {}
Option.Some = _r.variant(0);
Option.None = _r.unitVariant(1);
export function pattern_guard(x) {
  return do {
    const _t0 = x;
    if (
      do {
        const _t1 = _r.matches(_t0, Option.Some);
        _t1 && (v = _t1[1]);
      } &&
      v > 1
    ) {
      var v;
      v;
    } else {
      0;
    }
  };
}
