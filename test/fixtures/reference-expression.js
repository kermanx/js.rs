import * as _r from "@jsrs/runtime";
function swap(a, b) {
  var tmp = _r.deref(a);
  a[_r.REF_TARGET] = _r.deref(b);
  b[_r.REF_TARGET] = tmp;
}
export function main() {
  var a = 1;
  var b = 2;
  swap(
    _r.ref(a, (v) => (a = v)),
    _r.ref(b, (v) => (b = v)),
  );
}
