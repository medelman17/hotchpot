import pkg from "./package.json";
import common from "../../rollup.config.js";

const config = {
  input: "src/index.ts",
  output: [
    { file: pkg.main, format: "cjs", exports: "named", sourcemap: true },
    { file: pkg.module, format: "esm", exports: "named", sourcemap: true },
  ],
  external: [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.peerDependencies || {}),
    "aws-sdk",
    "@aws-cdk/core",
    "@aws-cdk/aws-appsync",
    "@aws-cdk/aws-lambnda",
    "@aws-cdk/aws-dynamodb",
    "@aws-cdk/aws-iam",
    "@aws-cdk/aws-lambda-event-sources",
    "rollup",
    "@wessberg/rollup-plugin-ts",
    "rollup-plugin-commonjs",
    "rollup-plugin-node-resolve",
    "rollup-plugin-json",
  ],
};

export default Object.assign({}, common, config);
