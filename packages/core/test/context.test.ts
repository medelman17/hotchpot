import { Context } from "../src/Context";
import { SCHEMA_WITH_INTERFACES } from "../fixtures";

const context = new Context(SCHEMA_WITH_INTERFACES);

it("populates document definitions on init", () => {
  const definitions = context.definitions;
  expect(definitions.length).toBeGreaterThan(0);
});

it("finds or adds Query type on init", () => {
  const query = context.query;
  expect(query).toBeDefined();
  expect(query).not.toBe(null);
});

it("finds or adds Mutation type on init", () => {
  const mutation = context.mutation;
  expect(mutation).toBeDefined();
  expect(mutation).not.toBe(null);
});

it("finds or adds default Schema definition on init", () => {
  const schema = context.schema;
  expect(schema).toBeDefined();
  expect(schema).not.toBe(null);
});

it("builds and adds object types to the schema", () => {
  const c = new Context(SCHEMA_WITH_INTERFACES);
  const newObject = Context.Build.Object("test", {});
  c.add.type(newObject);
  const objects = c.objects.filter((obj) => obj.name.value === "test");
  expect(objects.length).toBe(1);
});

it("builds and adds input types to the schema", () => {
  const c = new Context(SCHEMA_WITH_INTERFACES);
  const input = Context.Build.Input("test", {});
  c.add.type(input);
  const inputs = c.inputs.filter((obj) => obj.name.value === "test");
  expect(inputs.length).toBe(1);
});

it("modifies existing schema types", () => {
  const c = new Context(SCHEMA_WITH_INTERFACES);
  const [oldUserObject] = c.objects.filter((o) => o.name.value === "Person");
  c.put.type(Context.Build.Object("Person"));
  const [newUserObject] = c.objects.filter((o) => o.name.value === "Person");
  expect(oldUserObject.loc).toBeDefined();
  expect(newUserObject.loc).not.toBeDefined();
});

it("returns interfaces when asked", () => {
  const interfaces = context.interfaces;
  expect(interfaces.length).toBe(1);
});

it("builds list and nonnullable types correctly", () => {
  const listType = Context.Build.List(
    Context.Build.NonNullable(Context.Build.Named("String"))
  );
  expect(listType).toBeDefined();
});

it("adds fields to types", () => {
  const newField = Context.Build.Field("test", {
    type: Context.Build.Named("String"),
  });
  context.add.field.toType("Query", [newField]);
  const query = context.getType("Query");
  expect(query.fields).toBeDefined();
  expect(query.fields.length).toBe(1);
});
