import * as _r from "@jsrs/runtime";
export function Option() {}
Option.Some = _r.variant(0);
Option.None = _r.unitVariant(1);
export function match_test(a) {
  const _t0 = _r.destruct(a);
  if (
    do {
      const _t1 = _r.matches(_t0, A);
      _t1 &&
        do {
          const _t2 = _r.matches(_t1[1], B);
          _t2 && (x = _t2[1]);
        } &&
        do {
          const _t3 = _r.matches(_t1[2], C);
          _t3 && (y = _t3[1]);
        };
    }
  ) {
    var x, y;
    const _t4 = a;
    if (
      do {
        const _t5 = _r.matches(_t4, D);
        _t5 && (z = _t5[1]);
      }
    ) {
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
