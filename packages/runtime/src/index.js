const discriminantKey = Symbol("Discriminant");

export function enumMember(discriminant, data) {
  return {
    [discriminantKey]: discriminant,
    data,
  };
}

export function matches(value, discriminant) {
  return value?.[discriminantKey] === discriminant ? value.data : null;
}

export function demo(a) {
  // let A(B(x), C(y))=a else { panic!() }
  // stmt(x, y)
  _match: {
    if (_m = matches(a, 1 /* A */)) {
      let [_m1, _m2] = _m;
      if (!(_m = matches(_m1, 2 /* B */))) {
        let [x] = _m;
        if (!(_m = matches(_m2, 3 /* C */))) {
          let [y] = _m;
          stmt(x, y);
          break _match;
        }
      }
    }
    panic();
  }
}
