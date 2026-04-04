import * as _r from "@jsrs/runtime";
function swap(a, b) {
  var _do;
  _do = effect1();
  {
    var _do2;
    {
      if (_r.deref(a) > _r.deref(b)) {
        {
          _do2 = effect2();
        }
      } else {
        return 1;
      }
    }
  }
  var a = _do + _do2 + effect3();
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
