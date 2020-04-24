export const SCHEMA_WITH_INTERFACES = ` 
interface Actor {
  id: ID!
}

type Person implements Actor {
  id: ID!
  firstName: String!
  lastName: String!
}

type Organization implements Actor {
  id: ID!
  name: String!
  people: [String]
  other: String
}
`;
