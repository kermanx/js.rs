//pub fn tuple() {
export function tuple() {
//  let t = (1, 2, 3);
  const t = [1, 2, 3];
//  let (a, b, c) = t;
  const [a, b, c] = t;

//  let x = t.0 + t.1;
  const x = t[0] + t[1];

//  match t {
//    (1, a, _) => log(a),
//    _ => log("other"),
//  };
  (() => { const __jsrs_match = t; if (__JSRS_any(__jsrs_match)) return log(a); if (true) return log("other"); return undefined as any; })()(undefined as any);
//}
}

