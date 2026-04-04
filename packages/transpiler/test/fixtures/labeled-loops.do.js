import * as _r from "@jsrs/runtime";
export function labeled_loops() {
  var i = 0;
  while (true) {
    i = i + 1;
    if (i < 2) {
      {
        continue;
      }
    }
    break;
  }
  return i;
}
