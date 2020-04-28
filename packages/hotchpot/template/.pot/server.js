const {
  makeRemoteExecutableSchema,
  introspectSchema,
} = require("graphql-tools");
const { setContext } = require("apollo-link-context");
const { HttpLink } = require("apollo-link-http");
const { ApolloServer } = require("apollo-server");
const { readFileSync } = require("fs");
const fetch = require("cross-fetch");

const config = JSON.parse(
  readFileSync("./.pot/hotchpot.stacks.json", { encoding: "utf-8" })
);

const [name] = Object.keys(config);
const apiKey = config[name].GraphQLApiKey;
const apiUrl = config[name].GraphQLApiURL;

const http = new HttpLink({ uri: apiUrl, fetch });

const link = setContext((request, previousContext) => ({
  headers: {
    "x-api-key": apiKey,
  },
})).concat(http);

async function getSchema() {
  try {
    schema = await introspectSchema(link);
    return makeRemoteExecutableSchema({
      schema,
      link,
    });
  } catch (err) {
    console.log("err", err);
  }
}

getSchema().then((schema) => {
  const server = new ApolloServer({ schema });
  server.listen().then(({ url }) => {
    console.log(`GraphQL Playground ready at ${url}`);
  });
});
