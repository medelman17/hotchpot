import { Context } from "./Context";
import { Transformer } from "./Transformer";
import { FileSystem } from "./FileSystem";
import {
  FieldDefinitionNode,
  printSchema,
  Kind,
  buildASTSchema,
} from "graphql";
import {
  addStandardFieldsToObjectTypes,
  addQueryFieldsForObjects,
  addQueryFieldsForInterfaces,
  addMutationFieldsForObjects,
} from "./transformers";
import { writeFileSync } from "fs";

export class Builder {
  private fs: FileSystem = new FileSystem();
  private transformer: Transformer;
  private schema: string;
  private context: Context;

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
    this.context = this.transformer.run();
    const schema = buildASTSchema({
      kind: Kind.DOCUMENT,
      definitions: this.context.rollupSchemaDefinitions(),
    });

    writeFileSync("./transformed.graphql", printSchema(schema));
  };
}
