function add(a, b) {
  return a + b;
}
class Option {}
function match_test(x) {
  _m0 = a;
  if (
    (_m1 =
      matches(_m0, /*A*/ 0) &&
      (_m2 = matches(_m1[1], /*B*/ 1) && (x = _m2[1])) &&
      (_m2 = matches(_m1[2], /*C*/ 2) && (y = _m2[1])))
  ) {
    var x, y;
    return x + y;
  } else {
    return 0;
  }
}
class A {}
impl(A, {
  new(a, b) {
    return { a, b };
  },
  add() {
    return this["a"] + this["b"];
  },
});
function swap(a, b) {
  var tmp = a.v;
  a.v = b.v;
  b.v = tmp;
}
function main() {
  var a = 1;
  var b = 2;
  swap(
    refMut(
      () => a,
      (v) => (a = v),
    ),
    refMut(
      () => b,
      (v) => (b = v),
    ),
  );
}
