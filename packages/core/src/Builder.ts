import { Context } from "./Context";
import { Transformer } from "./Transformer";
import { FileSystem } from "./FileSystem";
import { InfrastructureManager } from "./Infrastructrure";
import * as cdk from "@aws-cdk/core";
import {
  addStandardFieldsToObjectTypes,
  addQueryFieldsForObjects,
  addQueryFieldsForInterfaces,
  addMutationFieldsForObjects,
  generatePlan,
} from "./transformers";

import { App } from "@aws-cdk/core";

export class Builder {
  private fs: FileSystem = new FileSystem();
  private transformer: Transformer;
  private schema: string;
  private context: Context;
  private builder: cdk.App = new App();

  constructor(protected config: { inputs: string[] }) {
    this.schema = this.init.schema();
    this.context = this.init.context();
    this.transformer = this.init.transformer();
  }

  init = {
    schema: () => {
      let schema = "";
      for (const path of this.config.inputs) {
        const files = FileSystem.read.dir(path);
        const bits = files
          .map((file) => {
            return FileSystem.read.file(FileSystem.path.resolve([path, file]));
          })
          .join("/n");
        schema = schema + bits;
      }
      return schema;
    },
    context: () => {
      return new Context(this.schema);
    },
    transformer: () => {
      return new Transformer(this.context);
    },
  };

  run = () => {
    this.transformer.schedule(addStandardFieldsToObjectTypes);
    this.transformer.schedule(addQueryFieldsForInterfaces);
    this.transformer.schedule(addQueryFieldsForObjects);
    this.transformer.schedule(addMutationFieldsForObjects);
    this.transformer.schedule(generatePlan);
    this.context = this.transformer.run();

    const stack = new InfrastructureManager(this.builder, "XertzInfra", {
      context: this.context,
      fs: this.fs,
    });
    const res = this.builder.synth();
  };
}
