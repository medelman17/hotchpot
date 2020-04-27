import {
  TypeSystemDefinitionNode,
  ObjectTypeDefinitionNode,
  FieldDefinitionNode,
  InputObjectTypeDefinitionNode,
  SchemaDefinitionNode,
  ObjectTypeExtensionNode,
  NamedTypeNode,
  DocumentNode,
  Kind,
  parse,
  EnumTypeDefinitionNode,
  TypeDefinitionNode,
  DefinitionNode,
  OperationTypeDefinitionNode,
  ScalarTypeDefinitionNode,
  InterfaceTypeDefinitionNode,
  UnionTypeDefinitionNode,
  buildASTSchema,
  DirectiveNode,
  TypeNode,
  InputValueDefinitionNode,
  StringValueNode,
  NonNullTypeNode,
  ListTypeNode,
} from "graphql";

type IndexKind =
  | "objects"
  | "interfaces"
  | "scalars"
  | "inputs"
  | "enums"
  | "unions";

export type ContextRootState = {
  objects: ObjectTypeDefinitionNode[];
  scalars: ScalarTypeDefinitionNode[];
  interfaces: InterfaceTypeDefinitionNode[];
  inputs: InputObjectTypeDefinitionNode[];
  enums: EnumTypeDefinitionNode[];
  unions: UnionTypeDefinitionNode[];
  schema: SchemaDefinitionNode | null;
  index: {
    name: string;
    kind: IndexKind;
  }[];
};

export type DefinitionKinds =
  | typeof Kind.OBJECT_TYPE_DEFINITION
  | typeof Kind.INPUT_OBJECT_TYPE_DEFINITION
  | typeof Kind.ENUM_TYPE_DEFINITION
  | typeof Kind.UNION_TYPE_DEFINITION
  | typeof Kind.SCALAR_TYPE_DEFINITION
  | typeof Kind.INTERFACE_TYPE_DEFINITION
  | any;

export type BuildObjectProps = {
  fields?: FieldDefinitionNode[];
  interfaces?: NamedTypeNode[];
  directives?: DirectiveNode[];
};

export type BuildArgumentProps = {
  type: TypeNode;
};

export type BuildInputProps = {
  fields?: InputValueDefinitionNode[];
};

export type BuildFieldProps = {
  type: TypeNode;
  arguments?: InputValueDefinitionNode[];
  description?: StringValueNode;
  directives?: DirectiveNode[];
};
