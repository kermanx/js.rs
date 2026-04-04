import * as _r from "@jsrs/runtime";
export function Option() {}
Option.Some = _r.variant(0);
Option.None = _r.unitVariant(1);
export function pattern_guard(x) {
  {
    var _do2;
    const _t0 = x;
    {
      var _do;
      const _t1 = _r.matches(_t0, Option.Some);
      _do = _t1 && (v = _t1[1]);
    }
    if (_do && v > 1) {
      var v;
      _do2 = v;
    } else {
      _do2 = 0;
    }
  }
  return _do2;
}
