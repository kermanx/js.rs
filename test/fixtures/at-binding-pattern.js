import * as _r from "@jsrs/runtime";
export function at_binding_pattern(x) {
  var a, v;
  return (function () {
    const _t0 = x;
    if (
      (a = _t0) &&
      (function () {
        const _t1 = _r.matches(_t0, Option.Some);
        return _t1 && (v = _t1[1]);
      })()
    ) {
      return v;
    } else {
      return 0;
    }
  })();
}
