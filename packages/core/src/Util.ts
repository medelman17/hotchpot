import {
  buildASTSchema,
  printSchema,
  Kind,
  DefinitionNode,
  GraphQLSchema,
} from "graphql";

export class Util {
  static buildSchemaFromAST(definitions: DefinitionNode[]) {
    const ast = {
      kind: Kind.DOCUMENT,
      definitions,
    };
    return buildASTSchema(ast);
  }

  static printSchema(schema: GraphQLSchema) {
    return printSchema(schema);
  }
}
