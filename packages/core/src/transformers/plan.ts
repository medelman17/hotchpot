import { Context } from "../Context";
import { actions } from "../state/slices/infra";
import { FieldDefinitionNode, Kind, TypeNode } from "graphql";
import { InfraJob } from "../state/slices/infra";

export function generatePlan(context: Context) {
  handleQuery(context);
  handleMutation(context);

  return context;
}

function handleQuery(context: Context) {
  const query = context.query;
  const { fields } = query;
  for (const f of fields) {
    const opType = getOpType(f) as keyof OpsMap;
    const returnTypeName = getReturnType(f.type);
    const returnType = context.getType(returnTypeName);
    const isInterface = returnType.kind === Kind.INTERFACE_TYPE_DEFINITION;

    const job = isInterface
      ? createInterfaceJob({
          op: opType,
          returnType: returnTypeName,
          fieldName: f.name.value,
          typeName: "Query",
        })
      : createObjectJob({
          op: opType,
          returnType: returnTypeName,
          returnTypeInterface: returnType.interfaces[0].name.value,
          fieldName: f.name.value,
          typeName: "Query",
        });

    context.store.dispatch(actions.add(job));
  }
}

function handleMutation(context: Context) {
  const mutation = context.mutation;
  const { fields } = mutation;
  for (const f of fields) {
    const opType = getOpType(f) as keyof OpsMap;
    const returnTypeName = getReturnType(f.type);
    const returnType = context.getType(returnTypeName);
    const isInterface = returnType.kind === Kind.INTERFACE_TYPE_DEFINITION;

    const job = isInterface
      ? createInterfaceJob({
          op: opType,
          returnType: returnTypeName,
          fieldName: f.name.value,
          typeName: "Mutation",
        })
      : createObjectJob({
          op: opType,
          returnType: returnTypeName,
          returnTypeInterface: returnType.interfaces[0].name.value,
          fieldName: f.name.value,
          typeName: "Mutation",
        });

    context.store.dispatch(actions.add(job));
  }
}

function createInterfaceJob(args: {
  op: keyof OpsMap;
  returnType: string;
  fieldName: string;
  typeName: string;
}): InfraJob {
  return {
    id: `${args.op}#${args.fieldName}#${args.returnType}`,
    op: args.op,
    isInterface: true,
    isObject: false,
    isQuery: args.typeName === "Query",
    isMutation: args.typeName === "Mutation",
    isList: args.op === "LIST",
    pk: `Interface#${args.returnType}`,
    fieldName: args.fieldName,
    returnType: args.returnType,
  };
}

function createObjectJob(args: {
  op: keyof OpsMap;
  returnType: string;
  fieldName: string;
  returnTypeInterface: string;
  typeName: string;
}) {
  return {
    id: `${args.op}#${args.fieldName}#${args.returnType}`,
    op: args.op,
    isInterface: false,
    isObject: true,
    isQuery: args.typeName === "Query",
    isMutation: args.typeName === "Mutation",
    isList: args.op === "LIST",
    pk: `Interface#${args.returnTypeInterface}`,
    sk: `${args.returnType}#$util.autoId()`,
    fieldName: args.fieldName,
    returnType: args.returnType,
    returnTypeInterface: args.returnTypeInterface,
  };
}

function getReturnType(type: TypeNode) {
  // console.log(type);
  if (type.kind === Kind.NAMED_TYPE) {
    return type.name.value;
  }
  return getReturnType(type.type);
}

const OpsMap = {
  LIST: "LIST",
  GET: "GET",
  DELETE: "DELETE",
  UPDATE: "UPDATE",
  CREATE: "CREATE",
};

export type OpsMap = typeof OpsMap;

function getOpType(field: FieldDefinitionNode) {
  const {
    name: { value: name },
  } = field;

  // This is going to be gross for now.

  if (name.startsWith("get")) {
    return OpsMap.GET;
  } else if (name.startsWith("list")) {
    return OpsMap.LIST;
  } else if (name.startsWith("create")) {
    return OpsMap.CREATE;
  } else if (name.startsWith("delete")) {
    return OpsMap.DELETE;
  } else if (name.startsWith("update")) {
    return OpsMap.UPDATE;
  }
}
