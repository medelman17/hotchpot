import { Context } from "./Context";
import { Transformer } from "./Transformer";
import { FileSystem } from "./FileSystem";
import { InfrastructureManager } from "./Infrastructrure";
import { buildASTSchema, printSchema, Kind } from "graphql";
import { writeFileSync } from "fs";
import * as cdk from "@aws-cdk/core";
import {
  addStandardFieldsToObjectTypes,
  addQueryFieldsForObjects,
  addQueryFieldsForInterfaces,
  addMutationFieldsForObjects,
  generatePlan,
} from "./transformers";

import { App } from "@aws-cdk/core";

export type BuilderConfig = {
  project: { name: string };
  paths: { input: string[] };
  filters: { input: string[] };
  aws: { profile?: string };
};

export class Builder {
  project: { name: string };
  paths: { input: string[] };
  outputs: { [index: string]: any } = {};

  private fs: FileSystem = new FileSystem();
  private transformer: Transformer;
  private schema: string;
  private context: Context;
  private builder: cdk.App = new App();

  constructor(protected config: BuilderConfig) {
    this.project = config.project;
    this.paths = config.paths;
    this.schema = this.init.schema();
    this.context = this.init.context();
    this.transformer = this.init.transformer();
  }

  init = {
    schema: () => {
      let schema = "";
      for (const path of this.paths.input) {
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

  reportOutput = (arg: any) => {
    // console.log(arg);
    this.outputs = { ...this.outputs };
  };

  run = () => {
    this.transformer.schedule(addStandardFieldsToObjectTypes);
    this.transformer.schedule(addQueryFieldsForInterfaces);
    this.transformer.schedule(addQueryFieldsForObjects);
    this.transformer.schedule(addMutationFieldsForObjects);
    this.transformer.schedule(generatePlan);
    this.context = this.transformer.run();

    const stack = new InfrastructureManager(
      this.builder,
      `${this.project.name}Hotchpot`,
      {
        context: this.context,
        fs: this.fs,
        project: this.project,
        reporter: this.reportOutput,
      }
    );

    const definitions = this.context.rollupSchemaDefinitions();
    const schema = buildASTSchema({ kind: Kind.DOCUMENT, definitions });
    const stringSchema = printSchema(schema);
    writeFileSync("hotchpot.graphql", stringSchema);
    writeFileSync("hotchpot.js", `module.exports = \`${stringSchema}\``);

    return {
      synth: () => this.builder.synth(),
      ...this.outputs,
    };
  };
}
