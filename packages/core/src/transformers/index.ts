import {
  parse,
  concatAST,
  buildASTSchema,
  visit,
  DocumentNode,
  InterfaceTypeDefinitionNode,
  ObjectTypeDefinitionNode,
  Kind,
  FieldDefinitionNode,
  printSchema,
  TypeNode,
  ArgumentNode,
  InputValueDefinitionNode,
  NameNode,
  ListTypeNode,
  NamedTypeNode,
  NonNullTypeNode,
  InputObjectTypeDefinitionNode,
  TypeKind,
} from "graphql";
import pluralize from "pluralize";

import { Context } from "../Context";

export function addStandardFieldsToObjectTypes(context: Context) {
  const objects = context.objects;

  for (const obj of objects) {
    let fieldsToAdd: FieldDefinitionNode[] = [];
    const userFields = obj.fields?.map((f) => f.name.value) ?? [];
    if (!userFields.includes("id")) {
      fieldsToAdd.push(
        Context.Build.Field("id", {
          type: Context.Build.Named("ID"),
        })
      );
    }
    if (!userFields.includes("createdAt")) {
      fieldsToAdd.push(
        Context.Build.Field("createdAt", {
          type: Context.Build.Named("String"),
        })
      );
    }
    if (!userFields.includes("updatedAt")) {
      fieldsToAdd.push(
        Context.Build.Field("updatedAt", {
          type: Context.Build.Named("String"),
        })
      );
    }
    fieldsToAdd.forEach((field) => {
      context.add.field.toType(obj.name.value, [field]);
    });
  }
  return context;
}

export function addQueryFieldsForObjects(context: Context) {
  const objects = context.objects;
  for (const i of objects) {
    const { field: get, input: getInput } = buildGetQueryFieldForType(i);
    const { field: list } = buildListQueryFieldForType(i);
    context.add.type(getInput);
    context.add.field.toType("Query", [get, list]);
  }
  return context;
}

function buildGetQueryFieldForType(
  type: ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode
): { field: FieldDefinitionNode; input: InputObjectTypeDefinitionNode } {
  const name = type.name.value;
  const fieldName = `get${name}`;
  const inputName = capitalize(`${fieldName}WhereUniqueInput`);

  const field = Context.Build.Field(fieldName, {
    type: Context.Build.Named(name),
    arguments: [
      Context.Build.Argument("where", {
        type: Context.Build.NonNullable(Context.Build.Named(inputName)),
      }),
    ],
  });

  const input = Context.Build.Input(inputName, {
    fields: [
      Context.Build.Argument("id", {
        type: Context.Build.NonNullable(Context.Build.Named("ID")),
      }),
    ],
  });

  return { field, input };
}

function buildListQueryFieldForType(
  type: ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode
): { field: FieldDefinitionNode; input?: InputObjectTypeDefinitionNode } {
  const name = type.name.value;
  const fieldName = `list${pluralize(name)}`;
  const inputName = capitalize(`${fieldName}WhereInput`);

  const field = Context.Build.Field(fieldName, {
    type: Context.Build.Named(name),
    arguments: [
      Context.Build.Argument("limit", {
        type: Context.Build.Named("Int"),
      }),
      Context.Build.Argument("after", {
        type: Context.Build.Named("String"),
      }),
    ],
  });

  return { field };
}

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function addQueryFieldsForInterfaces(context: Context) {
  const interfaces = context.interfaces;
  for (const i of interfaces) {
    const { field: get, input: getInput } = buildGetQueryFieldForType(i);
    const { field: list } = buildListQueryFieldForType(i);
    context.add.type(getInput);
    context.add.field.toType("Query", [get, list]);
  }
  return context;
}

function buildCreateMutationFieldForType(type: ObjectTypeDefinitionNode) {
  const name = type.name.value;
  const fieldName = `create${name}`;
  const inputName = `Create${name}Input`;

  const field = Context.Build.Field(fieldName, {
    type: Context.Build.Named(name),
    arguments: [
      Context.Build.Argument("input", {
        type: Context.Build.NonNullable(Context.Build.Named(inputName)),
      }),
    ],
  });

  const input = Context.Build.Input(inputName, {
    fields: [
      ...type.fields
        ?.filter(
          (node) => !["id", "createdAt", "updatedAt"].includes(node.name.value)
        )
        .map((node) => {
          return Context.Build.Argument(node.name.value, {
            type: node.type,
          });
        }),
    ],
  });

  return { field, input };
}

function buildDeleteMutationFieldForType(
  type: ObjectTypeDefinitionNode
): { field: FieldDefinitionNode; input: InputObjectTypeDefinitionNode } {
  const name = type.name.value;
  const fieldName = `delete${name}`;
  const inputName = `Delete${name}WhereInput`;

  const field = Context.Build.Field(fieldName, {
    type: Context.Build.Named(name),
    arguments: [
      Context.Build.Argument("where", {
        type: Context.Build.NonNullable(Context.Build.Named(inputName)),
      }),
    ],
  });

  const where = Context.Build.Input(inputName, {
    fields: [
      Context.Build.Argument("id", {
        type: Context.Build.NonNullable(Context.Build.Named("ID")),
      }),
    ],
  });

  return { field, input: where };
}

function buildUpdateMutationFieldForType(
  type: ObjectTypeDefinitionNode
): { field: FieldDefinitionNode; input: InputObjectTypeDefinitionNode[] } {
  const name = type.name.value;
  const fieldName = `update${name}`;
  const inputName = `Update${name}Input`;
  const whereInputName = `Update${name}WhereUniqueInput`;

  const field = Context.Build.Field(fieldName, {
    type: Context.Build.Named(name),
    arguments: [
      Context.Build.Argument("where", {
        type: Context.Build.NonNullable(Context.Build.Named(whereInputName)),
      }),
      Context.Build.Argument("input", {
        type: Context.Build.NonNullable(Context.Build.Named(inputName)),
      }),
    ],
  });

  const where = Context.Build.Input(whereInputName, {
    fields: [
      Context.Build.Argument("id", {
        type: Context.Build.NonNullable(Context.Build.Named("ID")),
      }),
    ],
  });

  const update = Context.Build.Input(inputName, {
    fields: [
      ...type.fields
        ?.filter(
          (node) => !["id", "createdAt", "updatedAt"].includes(node.name.value)
        )
        .map((node) => {
          return Context.Build.Argument(node.name.value, {
            type: node.type,
          });
        }),
    ],
  });

  return { field, input: [where, update] };
}

export function addMutationFieldsForObjects(context: Context) {
  const objects = context.objects;
  for (const i of objects) {
    const {
      field: create,
      input: createInput,
    } = buildCreateMutationFieldForType(i);
    const {
      field: update,
      input: [updateInput, updateWhereInput],
    } = buildUpdateMutationFieldForType(i);

    const {
      field: deleteField,
      input: deleteInput,
    } = buildDeleteMutationFieldForType(i);

    context.add.type(deleteInput);
    context.add.type(createInput);
    context.add.type(updateInput);
    context.add.type(updateWhereInput);
    context.add.field.toType("Mutation", [create, update, deleteField]);
  }
  return context;
}
