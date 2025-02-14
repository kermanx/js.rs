function add(a, b) {
  a + b;
}

function match_test(x) {
  _match1: {
    const _m0 = a;
    if ((_m = matches(_m0, 0))) {
      let [_m1, _m2] = _m0;
      if ((_m = matches(_m1, 1))) {
        let [_m1] = _m1;
        var x = _m1;
        if ((_m = matches(_m2, 2))) {
          let [_m1] = _m2;
          var y = _m1;
          return x + y;
          break _match1;
        }
      }
    }
    {
      return 0;
    }
  }
}
