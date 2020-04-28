import pkg from "../package.json";
import typescript from "@wessberg/rollup-plugin-ts";
import commonjs from "rollup-plugin-commonjs";
import resolve from "rollup-plugin-node-resolve";
import json from "rollup-plugin-json";
import { ScriptTarget } from "typescript";

export default {
  plugins: [
    json(),
    resolve(),
    typescript(),
    commonjs({ include: /node_modules/ }),
  ],
};

export const lambda = {
  plugins: [
    json(),
    resolve(),
    typescript({
      tsconfig: {
        target: ScriptTarget.ES2015,
      },
    }),
    commonjs({ include: /node_modules/ }),
  ],
};
