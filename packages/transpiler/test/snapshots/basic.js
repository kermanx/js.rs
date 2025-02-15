import * as _h from "@jsrs/helpers";
export function add(a, b) {
  return a + b;
}
export function Option() {}
Option.Some = _h.variant(/*Some*/ 0);
Option.None = _h.unitVariant(/*None*/ 1);

export function match_test(a) {
  _m0 = a;
  if (
    (_m1 = _h.matches(_m0, /*A*/ 2)) &&
    (_m2 = _h.matches(_m1[1], /*B*/ 3)) &&
    (x = _m2[1]) &&
    (_m2 = _h.matches(_m1[2], /*C*/ 4)) &&
    (y = _m2[1])
  ) {
    var x, y;
    return Option.Some(x + y);
  } else {
    return Option.None;
  }
}
export function A() {}
A.new = function (a, b) {
  return { a, b };
};
A.prototype.add = function () {
  return this["a"] + this["b"];
};

function swap(a, b) {
  var tmp = a.v;
  a.v = b.v;
  b.v = tmp;
}
export function main() {
  var a = 1;
  var b = 2;
  swap(
    _h.refMut(
      () => a,
      (v) => (a = v),
    ),
    _h.refMut(
      () => b,
      (v) => (b = v),
    ),
  );
}
var _m0, _m1, _m2;
