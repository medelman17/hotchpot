import { combineReducers } from "@reduxjs/toolkit";
import {
  infraSlice,
  objectSlice,
  inputSlice,
  interfaceSlice,
  unionSlice,
  enumSlice,
  scalarSlice,
  fieldSlice,
} from "./slices";
import { Kind } from "graphql";
import { rootReducer as root } from "../reducers/context";

const rootReducer = combineReducers({
  root,
  infra: infraSlice.reducer,
  objects: objectSlice.reducer,
  inputs: inputSlice.reducer,
  interfaces: interfaceSlice.reducer,
  scalars: scalarSlice.reducer,
  enums: enumSlice.reducer,
  unions: unionSlice.reducer,
  fields: fieldSlice.reducer,
});

export type RootState = ReturnType<typeof rootReducer>;

export default rootReducer;

export const actions = {
  [Kind.OBJECT_TYPE_DEFINITION]: objectSlice.actions,
  [Kind.INPUT_OBJECT_TYPE_DEFINITION]: inputSlice.actions,
  [Kind.INTERFACE_TYPE_DEFINITION]: interfaceSlice.actions,
  [Kind.ENUM_TYPE_DEFINITION]: enumSlice.actions,
  [Kind.UNION_TYPE_DEFINITION]: unionSlice.actions,
  [Kind.SCALAR_TYPE_DEFINITION]: scalarSlice.actions,
  [Kind.FIELD_DEFINITION]: fieldSlice.actions,
};

/**
 * Gives us `dispatch(actions[type.kind].add(type))`
 */
