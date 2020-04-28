import * as cdk from "@aws-cdk/core";
import { Function, AssetCode, Runtime } from "@aws-cdk/aws-lambda";

export type HotchFunctionProps = {
  name: string;
  code: string;
  env: { [index: string]: string };
  id: string;
  outputDir: string;
};

export class HotchFunction extends cdk.Construct {
  name: string;
  id: string;
  file: string;
  code: string;
  bundleLocation: Promise<string>;
  function: Function;
  private env: { [index: string]: string };

  constructor(scope, id, props) {
    super(scope, id);
    this.name = props.name;
    this.code = props.code;
    this.env = props.env;
    this.id = props.id;
    this.file = props.outputDir;

    this.function = this.create({ name: this.name });
    return this;
  }

  create = (args: { name: string }) => {
    return new Function(this, args.name, {
      code: new AssetCode(this.file),
      handler: "index.handler",
      runtime: Runtime.NODEJS_12_X,
      environment: {
        ...this.env,
      },
    });
  };
}
