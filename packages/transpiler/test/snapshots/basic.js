import * as _r from "@jsrs/runtime";
export function add(a, b) {
  return a + b;
}
export function Option() {}
Option.Some = _r.variant(/*Some*/ 0);
Option.None = _r.unitVariant(/*None*/ 1);

export function match_test(a) {
  _m0 = a;
  if (
    (_m1 = _r.matches(_m0, /*A*/ 2)) &&
    (_m2 = _r.matches(_m1[1], /*B*/ 3)) &&
    (x = _m2[1]) &&
    (_m2 = _r.matches(_m1[2], /*C*/ 4)) &&
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
    _r.refMut(
      () => a,
      (v) => (a = v),
    ),
    _r.refMut(
      () => b,
      (v) => (b = v),
    ),
  );
}
var _m0, _m1, _m2;
