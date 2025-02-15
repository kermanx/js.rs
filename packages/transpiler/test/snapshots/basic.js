function add(a, b) {
  a + b;
}

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
