import * as _r from "@jsrs/runtime";
export function Option() {}
Option.Some = _r.variant(0);
Option.None = _r.unitVariant(1);
export function pattern_guard(x) {
  var v;
  return (function () {
    const _t0 = x;
    if (
      (function () {
        const _t1 = _r.matches(_t0, Option.Some);
        return _t1 && (v = _t1[1]);
      })() &&
      v > 1
    ) {
      return v;
    } else {
      return 0;
    }
  })();
}
