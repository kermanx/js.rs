import * as _r from "@jsrs/runtime";
export function at_binding_pattern(x) {
  {
    var _do, _do3;
    const _t0 = x;
    _do = a = _t0;
    {
      var _do2;
      const _t1 = _r.matches(_t0, Option.Some);
      _do2 = _t1 && (v = _t1[1]);
    }
    if (_do && _do2) {
      var a, v;
      _do3 = v;
    } else {
      _do3 = 0;
    }
  }
  return _do3;
}
