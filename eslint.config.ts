import { antfu } from "@antfu/eslint-config";

export default antfu({
  typescript: true,
  stylistic: {
    semi: true,
    quotes: "double",
  },
  ignores: ["**/fixtures/**", "**/snapshots/**"],
  rules: {
    "ts/no-unsafe-declaration-merging": "off",
    "style/yield-star-spacing": "off",
    "ts/ban-ts-comment": "off",
    "no-console": "off",
  },
});
