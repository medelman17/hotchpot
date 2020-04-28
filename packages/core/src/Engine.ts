import { Context } from "./Context";
import { Transformer } from "./Transformer";
import { FunctionTransformer } from "./FunctionTransformer";
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
import {
  EngineConfig,
  EngineAWSConfig,
  EngineGraphQLConfig,
  EngineProjectConfig,
  EngineFunctionsConfig,
} from "./types";

import { Util } from "./Util";

import { App } from "@aws-cdk/core";

export class Engine {
  project: EngineProjectConfig;
  graphql: EngineGraphQLConfig;
  aws: EngineAWSConfig;
  functions: EngineFunctionsConfig;

  private fs: FileSystem = new FileSystem(this.config);

  private transformer: Transformer;
  private schema: string;
  private context: Context;
  private builder: cdk.App = new App();

  constructor(protected config: EngineConfig) {
    this.project = config.project;
    this.graphql = config.graphql;
    this.functions = config.functions;
    this.aws = config.aws;
    this.schema = this.fs.loadSchema();
    this.context = new Context(this.schema);

    this.transformer = new Transformer(this.context);
  }

  run = async () => {
    this.transformer.schedule(addStandardFieldsToObjectTypes);
    this.transformer.schedule(addQueryFieldsForInterfaces);
    this.transformer.schedule(addQueryFieldsForObjects);
    this.transformer.schedule(addMutationFieldsForObjects);
    this.transformer.schedule(generatePlan);
    await new FunctionTransformer(this.config, this.context).run();

    this.context = this.transformer.run();

    const stack = new InfrastructureManager(
      this.builder,
      `${this.project.name}Hotchpot`,
      {
        context: this.context,
        fs: this.fs,
        project: this.project,
        reporter: (arg: any) => {},
      }
    );

    const definitions = this.context.rollupSchemaDefinitions();
    const schema = Util.buildSchemaFromAST(definitions);
    const sdl = Util.printSchema(schema);

    FileSystem.write.file(
      FileSystem.path.join([this.project.pot, "schema", "hotchpot.graphql"]),
      sdl
    );
    FileSystem.write.file(
      FileSystem.path.join([this.project.pot, "schema", "hotchpot.schema.js"]),
      `module.exports = \`${sdl}\``
    );

    // FileSystem.bundle("./functions/index.js", "./.pot/functions/index.js");

    return {
      synth: () => this.builder.synth(),
    };
  };
}
