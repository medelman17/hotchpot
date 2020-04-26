import { createStore, combineReducers } from "redux";
import { configureStore, applyMiddleware } from "@reduxjs/toolkit";
import {
  TypeDefinitionNode,
  Kind,
  parse,
  DocumentNode,
  ObjectTypeDefinitionNode,
  NameNode,
  NamedTypeNode,
  NonNullTypeNode,
  ListTypeNode,
  InputValueDefinitionNode,
  InputObjectTypeDefinitionNode,
  FieldDefinitionNode,
  buildASTSchema,
  printSchema,
  visit,
} from "graphql";
import rootReducer, { actions } from "./state";
import { SharedContext } from "./ContextShared";
import {
  BuildObjectProps,
  BuildArgumentProps,
  BuildInputProps,
  BuildFieldProps,
} from "./types";
import { DEFAULT_SCHEMA_DEFINITION } from "./fixtures";

export class Context {
  private reducers = [{ root: rootReducer }];
  public store = configureStore({
    reducer: rootReducer,
    middleware: [],
  });
  private sdl: string;
  private inputDocument: DocumentNode;
  public metadata = new SharedContext();

  constructor(sdl: string) {
    this.sdl = sdl;
    this.inputDocument = parse(this.sdl);
    this.init.definitions();
    this.init.queryType();
    this.init.mutationType();
    this.init.schemaType();
  }

  init = {
    queryType: () => {
      if (!this.query) {
        this.dispatch(
          actions[Kind.OBJECT_TYPE_DEFINITION].add(
            Context.Build.Object("Query")
          )
        );
        this.dispatch({
          type: "ADD",
          kind: Kind.OBJECT_TYPE_DEFINITION,
          payload: Context.Build.Object("Query"),
        });
      }
    },
    mutationType: () => {
      if (!this.mutation) {
        this.dispatch(
          actions[Kind.OBJECT_TYPE_DEFINITION].add(
            Context.Build.Object("Mutation")
          )
        );
        this.dispatch({
          type: "ADD",
          kind: Kind.OBJECT_TYPE_DEFINITION,
          payload: Context.Build.Object("Mutation"),
        });
      }
    },
    schemaType: () => {
      //@ts-ignore
      const { schema } = this.store.getState();
      if (schema === null) {
        this.store.dispatch({
          type: "ADD",
          kind: Kind.SCHEMA_DEFINITION,
          payload: DEFAULT_SCHEMA_DEFINITION,
        });
      }
    },
    definitions: () => {
      for (const definition of this.inputDocument.definitions) {
        const d = visit(definition, {
          enter: (node) => {
            const { loc, ...rest } = node;
            // Todo: what to do with loc? Hmm.
            return { ...rest };
          },
          leave: (node, ...rest) => {
            if (node.kind === Kind.FIELD_DEFINITION) {
              this.dispatch(actions[node.kind].add({ node, other: rest }));
            }
          },
        });

        actions[definition.kind] &&
          this.dispatch(actions[definition.kind].add(d));

        this.dispatch({
          type: "ADD",
          kind: definition.kind,
          payload: d,
        });
      }
    },
  };

  add = {
    type: (type: TypeDefinitionNode) => {
      this.dispatch(actions[type.kind].add(type as any));
      this.dispatch({ type: "ADD", kind: type.kind, payload: type });
    },
    field: {
      toType: (typeName: string, fields: FieldDefinitionNode[]) => {
        const type = this.getType(typeName);
        if (
          type.kind === "ScalarTypeDefinition" ||
          type.kind === "EnumTypeDefinition" ||
          type.kind === "UnionTypeDefinition"
        ) {
          throw new Error(`Cannot add fields to ${type.kind} type ${name}`);
        } else {
          this.put.type(
            Context.Build.Object(typeName, {
              ...type,
              fields: type.fields ? [...type.fields, ...fields] : fields,
            })
          );
        }
      },
    },
  };

  put = {
    type: (type: TypeDefinitionNode) => {
      this.dispatch(actions[type.kind].put(type as any));
      this.dispatch({ type: "PUT", kind: type.kind, payload: type });
    },
  };

  getType(name: string) {
    //@ts-ignore
    const { index, schema, ...rest } = this.state;
    const [node] = index.filter((item) => item.name === name);
    if (!node) {
      throw new Error(`Cannot get type ${name} because it does not exist`);
    }
    //@ts-ignore
    return rest[node.kind].filter((item) => item.name.value === name)[0];
  }

  rollupSchemaDefinitions() {
    //@ts-ignore
    const { objects, scalars, interfaces, inputs, enums, unions } = this.state;
    return [].concat(objects, scalars, interfaces, inputs, enums, unions);
  }

  makeSchema = () => {
    return printSchema(
      buildASTSchema({
        kind: Kind.DOCUMENT,
        definitions: this.rollupSchemaDefinitions(),
      })
    );
  };

  get dispatch() {
    return this.store.dispatch;
  }

  get definitions() {
    return this.rollupSchemaDefinitions();
  }

  get state() {
    return this.store.getState().root;
  }

  get query() {
    //@ts-ignore
    const { objects } = this.store.getState().root;
    let [query] = objects.filter((o) => o.name.value === "Query");
    return query;
  }

  get mutation() {
    //@ts-ignore
    const { objects } = this.store.getState().root;
    let [mutation] = objects.filter((o) => o.name.value === "Mutation");
    return mutation;
  }

  get objects() {
    //@ts-ignore
    return this.state.objects.filter(
      (o) => !["Query", "Mutation", "Subscription"].includes(o.name.value)
    );
  }

  get interfaces() {
    //@ts-ignore
    return this.state.interfaces;
  }

  get schema() {
    //@ts-ignore
    return this.state.schema;
  }

  get inputs() {
    //@ts-ignore
    return this.state.inputs;
  }

  static Build = {
    Name: (value: string): NameNode => {
      return {
        kind: Kind.NAME,
        value,
      };
    },
    NonNullable: (type: NamedTypeNode | ListTypeNode): NonNullTypeNode => {
      return {
        kind: Kind.NON_NULL_TYPE,
        type,
      };
    },
    List: (type: NamedTypeNode | NonNullTypeNode): ListTypeNode => {
      return {
        kind: Kind.LIST_TYPE,
        type,
      };
    },
    Named: (name: string): NamedTypeNode => {
      return {
        kind: Kind.NAMED_TYPE,
        name: Context.Build.Name(name),
      };
    },
    Object: (
      name: string,
      props?: BuildObjectProps
    ): ObjectTypeDefinitionNode => {
      return {
        kind: Kind.OBJECT_TYPE_DEFINITION,
        name: Context.Build.Name(name),
        ...props,
      };
    },
    Field: (name: string, props: BuildFieldProps) => {
      return {
        kind: Kind.FIELD_DEFINITION,
        name: Context.Build.Name(name),
        ...props,
      };
    },
    Argument: (
      name: string,
      props: BuildArgumentProps
    ): InputValueDefinitionNode => {
      return {
        kind: Kind.INPUT_VALUE_DEFINITION,
        type: props.type,
        name: Context.Build.Name(name),
      };
    },
    Input: (
      name: string,
      props: BuildInputProps
    ): InputObjectTypeDefinitionNode => {
      return {
        kind: Kind.INPUT_OBJECT_TYPE_DEFINITION,
        fields: props.fields,
        name: Context.Build.Name(name),
      };
    },
  };
}
