import * as _r from "@jsrs/runtime";
export function Option() {}
Option.Some = _r.variant(0);
Option.None = _r.unitVariant(1);
export function while_let_loop() {
  var x = Option.Some(2);
  var acc = 0;
  while (true) {
    const _t0 = x;
    {
      var _do;
      const _t1 = _r.matches(_t0, Option.Some);
      _do = _t1 && (v = _t1[1]);
    }
    if (!_do) break;
    var v;
    acc = acc + v;
    x = Option.None;
  }
  return acc;
}
