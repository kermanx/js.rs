import * as _r from "@jsrs/runtime";
export function Option() {}
Option.Some = _r.variant(0);
Option.None = _r.unitVariant(1);
export function match_test(a) {
  const _t0 = _r.destruct(a);
  {
    var _do3;
    const _t1 = _r.matches(_t0, A);
    {
      var _do;
      const _t2 = _r.matches(_t1[1], B);
      _do = _t2 && (x = _t2[1]);
    }
    {
      var _do2;
      const _t3 = _r.matches(_t1[2], C);
      _do3 = _do2 = _t3 && (y = _t3[1]);
    }
  }
  if (_do3) {
    var x, y;
    const _t4 = a;
    {
      var _do4;
      const _t5 = _r.matches(_t4, D);
      _do4 = _t5 && (z = _t5[1]);
    }
    if (_do4) {
      var z;
      {
        return Option.Some(z);
      }
    }
    return Option.Some(x + y);
  } else {
    return Option.None;
  }
}
