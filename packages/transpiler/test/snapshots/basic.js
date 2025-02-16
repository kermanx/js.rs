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
  return {
    a,
    b,
  };
};
A.prototype.add = function () {
  return this.a + this.b;
};
function swap(a, b) {
  var _do;
  _do = effect1();
  {
    var _do2;
    {
      if (a[_r.REF_TARGET] > b[_r.REF_TARGET]) {
        {
          _do2 = effect2();
        }
      } else {
        {
          return 1;
        }
      }
    }
  }
  var a = _do + _do2 + effect3();
  var tmp = a[_r.REF_TARGET];
  a[_r.REF_TARGET] = b[_r.REF_TARGET];
  b[_r.REF_TARGET] = tmp;
}
export function main() {
  var a = 1;
  var b = 2;
  swap(
    _r.ref(
      () => a,
      (v) => (a = v),
    ),
    _r.ref(
      () => b,
      (v) => (b = v),
    ),
  );
}
export function is_alpha(c) {
  {
    var _do3;
    _m0 = c;
    if (_m0 === "x") {
      {
        console.log('"x"');
        _do3 = true;
      }
    } else if ((_m0 >= "a" && _m0 <= "z") || (_m0 >= "A" && _m0 <= "Z")) {
      _do3 = true;
    } else {
      _do3 = false;
    }
  }
  return _do3;
}
var _m, _m0, _m1, _m2;
