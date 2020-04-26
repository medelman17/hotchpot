import {
  createSlice,
  createEntityAdapter,
  createAction,
  createSelector,
} from "@reduxjs/toolkit";
import {
  InputObjectTypeDefinitionNode,
  InterfaceTypeDefinitionNode,
  ObjectTypeDefinitionNode,
  ScalarTypeDefinitionNode,
  EnumTypeDefinitionNode,
  UnionTypeDefinitionNode,
  FieldDefinitionNode,
} from "graphql";

const inputAdapter = createEntityAdapter<InputObjectTypeDefinitionNode>({
  selectId: (input) => input.name.value,
});

export const inputSlice = createSlice({
  name: "inputs",
  initialState: inputAdapter.getInitialState(),
  reducers: {
    add: inputAdapter.addOne,
    put: inputAdapter.upsertOne,
    del: inputAdapter.removeOne,
  },
});

const interfaceAdapter = createEntityAdapter<InterfaceTypeDefinitionNode>({
  selectId: (input) => input.name.value,
});

export const interfaceSlice = createSlice({
  name: "interfaces",
  initialState: interfaceAdapter.getInitialState(),
  reducers: {
    add: interfaceAdapter.addOne,
    put: interfaceAdapter.upsertOne,
    del: interfaceAdapter.removeOne,
  },
});

/**
 * Individual 'slices' look like this
 */

const objectAdapter = createEntityAdapter<ObjectTypeDefinitionNode>({
  selectId: (input) => input.name.value,
});

export const objectSlice = createSlice({
  name: "objects",
  initialState: objectAdapter.getInitialState(),
  reducers: {
    add: objectAdapter.addOne,
    put: objectAdapter.upsertOne,
    del: objectAdapter.removeOne,
  },
});

const scalarAdapter = createEntityAdapter<ScalarTypeDefinitionNode>({
  selectId: (input) => input.name.value,
});

export const scalarSlice = createSlice({
  name: "scalars",
  initialState: scalarAdapter.getInitialState(),
  reducers: {
    add: scalarAdapter.addOne,
    put: scalarAdapter.upsertOne,
    del: scalarAdapter.removeOne,
  },
});

const enumAdapter = createEntityAdapter<EnumTypeDefinitionNode>({
  selectId: (input) => input.name.value,
});

export const enumSlice = createSlice({
  name: "enums",
  initialState: enumAdapter.getInitialState(),
  reducers: {
    add: enumAdapter.addOne,
    put: enumAdapter.upsertOne,
    del: enumAdapter.removeOne,
  },
});

const unionAdapter = createEntityAdapter<UnionTypeDefinitionNode>({
  selectId: (input) => input.name.value,
});

export const unionSlice = createSlice({
  name: "unions",
  initialState: unionAdapter.getInitialState(),
  reducers: {
    add: unionAdapter.addOne,
    put: unionAdapter.upsertOne,
    del: unionAdapter.removeOne,
  },
});

const fieldAdapter = createEntityAdapter<
  FieldDefinitionNode & {
    parent: InterfaceTypeDefinitionNode | ObjectTypeDefinitionNode;
  }
>({
  selectId: (input) => {
    // console.log(input);
    const { parent, name } = input;
    const parentName = parent.name.value;
    return `${parentName}#${name.value}`;
  },
});

export const fieldSlice = createSlice({
  name: "fields",
  initialState: fieldAdapter.getInitialState(),
  reducers: {
    add: {
      reducer: fieldAdapter.addOne,
      prepare(payload) {
        const { node, other } = payload;
        const [num, siblings, index, parent] = other;
        // console.log("Hi!", Object.keys(other[3]));
        return { payload: { ...node, parent: parent[0] } };
      },
    },
    put: fieldAdapter.upsertOne,
    del: fieldAdapter.removeOne,
  },
});

const fieldSelector = (state) => state.fields;

const objectSelector = (state) => state.objects;

const testSelector = createSelector(
  [objectSelector, fieldSelector],
  (object, field) => {}
);
