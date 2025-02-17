import * as _r from "@jsrs/runtime";
export function add(a, b) {
  return a + b;
}
export function Option() {}
Option.Some = _r.variant(/*Some*/ 0);
Option.None = _r.unitVariant(/*None*/ 1);

export function match_test(a) {
  _m0 = _r.destructure(a);
  if (
    (_m1 = _r.matches(_m0, /*A*/ 2)) &&
    (_m2 = _r.matches(_m1[1], /*B*/ 3)) &&
    (x = _m2[1]) &&
    (_m2 = _r.matches(_m1[2], /*C*/ 4)) &&
    (y = _m2[1])
  ) {
    var x, y;
    _m0 = a;
    if ((_m1 = _r.matches(_m0, /*D*/ 5)) && (z = _m1[1])) {
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
export function A() {}
A.new = function (a, b) {
  return { a, b };
};
A.prototype.add = function () {
  return this.a + this.b;
};

function swap(a, b) {
  var a =
    effect1() +
    do {
      {
        if (a[_r.REF_TARGET] > b[_r.REF_TARGET]) {
          {
            effect2();
          }
        } else {
          return 1;
        }
      }
    } +
    effect3();
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
  return do {
    _m0 = c;
    if (_m0 === "x") {
      {
        console.log('"x"');
        true;
      }
    } else if ((_m0 >= "a" && _m0 <= "z") || (_m0 >= "A" && _m0 <= "Z")) {
      true;
    } else {
      false;
    }
  };
}
export function array() {
  var arr = [1, 2, 3];
  var arr2 = [1, 3];
  var x = arr[0] + arr2[1];
  var s = _r.range(1, 3 + 1);
  var y = _r.index(arr, s);
  _m0 = arr;
  if (
    _m0.length >= 4 &&
    (_m1 = _m0) &&
    _m1[0] === 1 &&
    (a = _m1[1]) &&
    (b = _m1.at(-2)) &&
    true
  ) {
    var a, b;
    log(a, b);
  } else {
    log('"other"');
  }
}
export function tuple() {
  var t = [1, 2, 3];
  var [a, b, c] = _r.destructure(t);
  var x = t[0] + t[1];
  _m0 = t;
  if (_m0.length === 3 && (_m1 = _m0) && _m1[0] === 1 && (a = _m1[1]) && true) {
    var a;
    log(a);
  } else {
    log('"other"');
  }
}
export function structs(x) {
  var { a, b: c } = _r.destructure(x);
}
export function closures(x) {
  var s = (a, b) => {
    return a + b;
  };
  var t = (x) => this.value + 1;
}
var _m, _m0, _m1, _m2;
