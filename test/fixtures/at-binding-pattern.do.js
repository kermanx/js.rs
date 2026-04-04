import * as _r from "@jsrs/runtime";
export function at_binding_pattern(x) {
  return do {
    const _t0 = x;
    if (
      (a = _t0) &&
      do {
        const _t1 = _r.matches(_t0, Option.Some);
        _t1 && (v = _t1[1]);
      }
    ) {
      var a, v;
      v;
    } else {
      0;
    }
  };
}
