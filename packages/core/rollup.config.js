import pkg from "./package.json";
import common from "../../rollup.config.js";

const config = {
  input: "src/index.ts",
  output: [
    { file: pkg.main, format: "cjs", exports: "named", sourcemap: true },
    { file: pkg.module, format: "esm", exports: "named", sourcemap: true },
  ],
};

export default Object.assign({}, common, config);
