import type { SyntaxNode } from "tree-sitter";
import type { Code } from "./transpiler";
import { defineTranspilerComponent } from "./transpiler";

type T = typeof _T;
declare module "./transpiler" {
  interface Transpiler extends T {}
}

const _T = defineTranspilerComponent({
  * Type(type: SyntaxNode): Code {
    switch (type.type) {
      case "type_identifier":
      case "primitive_type":
      case "identifier":
        yield type;
        break;
      case "generic_type":
        yield* this.Type(type.childForFieldName("type")!);
        break;
      case "scoped_type_identifier":
        yield type.text.replaceAll("::", ".");
        break;
      case "tuple_type":
        yield "[";
        for (const child of type.namedChildren) {
          yield* this.Type(child);
          yield ",";
        }
        yield "]";
        break;
      default:
        yield type.text;
    }
  },
});
