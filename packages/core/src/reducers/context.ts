import { createAction } from "@reduxjs/toolkit";
import { DefinitionNode, Kind } from "graphql";
import { ContextRootState, DefinitionKinds } from "../types";

const initialState: ContextRootState = {
  objects: [],
  scalars: [],
  interfaces: [],
  inputs: [],
  enums: [],
  unions: [],
  schema: null,
  index: [],
};

export function rootReducer(
  state: ContextRootState = initialState,
  action: any
): ContextRootState {
  switch (action.type) {
    case "ADD":
      return addActionReducer(state, action);
    case "PUT":
      return putActionReducer(state, action);
    default:
      return state;
  }
}

export function addActionReducer(
  state: ContextRootState,
  action
): ContextRootState {
  const { index } = state;
  switch (action.kind) {
    case Kind.OBJECT_TYPE_DEFINITION:
      return {
        ...state,
        objects: [...state.objects, action.payload],
        index: indexReducer(state.index, {
          type: action.type,
          kind: "objects",
          name: action.payload.name.value,
        }),
      };
    case Kind.SCALAR_TYPE_DEFINITION:
      return {
        ...state,
        scalars: [...state.scalars, action.payload],
        index: indexReducer(state.index, {
          type: action.type,
          kind: "scalars",
          name: action.payload.name.value,
        }),
      };
    case Kind.INTERFACE_TYPE_DEFINITION:
      return {
        ...state,
        interfaces: [...state.interfaces, action.payload],
        index: indexReducer(state.index, {
          type: action.type,
          kind: "interfaces",
          name: action.payload.name.value,
        }),
      };
    case Kind.INPUT_OBJECT_TYPE_DEFINITION:
      return {
        ...state,
        inputs: [...state.inputs, action.payload],
        index: indexReducer(state.index, {
          type: action.type,
          kind: "inputs",
          name: action.payload.name.value,
        }),
      };
    case Kind.ENUM_TYPE_DEFINITION:
      return {
        ...state,
        enums: [...state.enums, action.payload],
        index: indexReducer(state.index, {
          type: action.type,
          kind: "enums",
          name: action.payload.name.value,
        }),
      };
    case Kind.UNION_TYPE_DEFINITION:
      return {
        ...state,
        unions: [...state.unions, action.payload],
        index: indexReducer(state.index, {
          type: action.type,
          kind: "unions",
          name: action.payload.name.value,
        }),
      };
    case Kind.SCHEMA_DEFINITION:
      return { ...state, schema: action.payload };
    default:
      return state;
  }
}

export function putActionReducer(
  state: ContextRootState,
  action
): ContextRootState {
  const { index } = state;

  const [node] = index.filter(
    (item) => item.name === action.payload.name.value
  );

  if (!node) {
    throw new Error("Can't find node to put");
  }

  const { kind } = node;

  return {
    ...state,
    [kind]: [
      //@ts-ignore
      ...state[kind].filter(
        (item: any) => item.name.value !== action.payload.name.value
      ),
      action.payload,
    ],
  };
}

export function indexReducer(
  state: ContextRootState["index"],
  action
): ContextRootState["index"] {
  switch (action.type) {
    case "ADD":
      return [...state, { name: action.name, kind: action.kind }];
    default:
      return state;
  }
}

const add = createAction<{
  kind: DefinitionKinds;
  payload: DefinitionNode;
}>("ADD");

export const actions = { add };
