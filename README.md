# Hotchpot

Hotchpot is a proof of concept. Frankly, it probabky won't work. Even if it does,right now, it's fairly limited. It can take some SDL and turn it into a production-grade(-ish), cloud-native, serverless, fluent, graphql api. But, other than that, not much. But it's early days.

**Note: You must have an AWS account (with sufficient permissions) and the AWS CLI installed on your box to continue.**

First, install the `hotchpot` CLI.

```
npm i -g hotchpot
```

Then, in your favorite directory, create a new `hotch` project:

```
hotch init MyProject
```

Now, change directories into your new project and immediately deploy your AWS appsync backend:

```
hotch deploy
```

`Hotchpot` will take a look at the SDL defined in your project's `./graphql` directory and automatically generate a fluent api and the resolvers needed to make that baby slap. Then, `hotchpot` will deploy that baby to the cloud, using a single-table DynamoDB-backed datastore.

After you deploy, feel free to play around with your new API at `http://localhost:4000` which runs a GraphQL Playground that proxyies your requests to AWS.

## Major Limitations

- All types must explicitly implement an interface.
- Zero support for connections. This is coming. But not now.
- Probably many others

## Why Build This?

The confluence of two events, really. One, I've been working a lot with AppSync and the AWS Amplify-ecosystem lately. Two, I read a book. Only the latter event is interesting, here.

The book is [The DynamoDB Book](https://www.dynamodbbook.com/), by DynamoDB Mad-Scientist, [Alex DeBrie](https://twitter.com/alexbdebrie). The book is excellent. Suffice it to say: we would not be here without the book. Buy it if you want to learn how to index things in an infinitely-scalable file drawer.

A lot of the book deals with strategic indexing--i.e., how to define/structure the primary and sort keys for your 'table'. Done right... one only needs a single table, which is the holy grail. For many reasons. None of which I will go into, here. Every non-graphql-developing dynamo dev knows this, I'm sure. So, you'll have to trust me.

That said, I'm not a NoSQL expert (is that a double negative or nah?) by any means. But, if you ask me, **a lot** of it comes down to predictable prefixing. There's some tough bits to deal with, for sure. But, given a predictable prefixing scheme, it seemed to me that a lot of use-cases could be solved programatically.

Enter GraphQL: with its now, ever-so-sexy, strong-typing. Rawr. Could we use that type system to (1) auto-generate optimized index/key-structures for many use cases and (2), if so, how far could we push it.

Hotchpot is a POC re: (1)

## How Hotchpot Works

You give Hotchpot a basic schema in GraphQL's Schema Definition Language (SDL). Like this:

```graphql
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
```

And then Hotchpot transforms your schema into a fluent GraphQL API backed by a single-table DynamoDB data source. Like this:

```graphql
type Person implements Actor {
  id: ID!
  firstName: String!
  lastName: String!
  createdAt: String
  updatedAt: String
}

type Organization implements Actor {
  id: ID!
  name: String!
  people: [String]
  other: String
  createdAt: String
  updatedAt: String
}

type Query {
  getActor(where: GetActorWhereUniqueInput!): Actor
  listActors(limit: Int, after: String): [Actor]
  getPerson(where: GetPersonWhereUniqueInput!): Person
  listPeople(limit: Int, after: String): [Person]
  getOrganization(where: GetOrganizationWhereUniqueInput!): Organization
  listOrganizations(limit: Int, after: String): [Organization]
}

type Mutation {
  createPerson(input: CreatePersonInput!): Person
  updatePerson(
    where: UpdatePersonWhereUniqueInput!
    input: UpdatePersonInput!
  ): Person
  deletePerson(where: DeletePersonWhereInput!): Person
  createOrganization(input: CreateOrganizationInput!): Organization
  updateOrganization(
    where: UpdateOrganizationWhereUniqueInput!
    input: UpdateOrganizationInput!
  ): Organization
  deleteOrganization(where: DeleteOrganizationWhereInput!): Organization
}

interface Actor {
  id: ID!
}

input GetActorWhereUniqueInput {
  id: ID!
}

input GetPersonWhereUniqueInput {
  id: ID!
}

input GetOrganizationWhereUniqueInput {
  id: ID!
}

input DeletePersonWhereInput {
  id: ID!
}

input CreatePersonInput {
  firstName: String!
  lastName: String!
}

input UpdatePersonWhereUniqueInput {
  id: ID!
}

input UpdatePersonInput {
  firstName: String!
  lastName: String!
}

input DeleteOrganizationWhereInput {
  id: ID!
}

input CreateOrganizationInput {
  name: String!
  people: [String]
  other: String
}

input UpdateOrganizationWhereUniqueInput {
  id: ID!
}

input UpdateOrganizationInput {
  name: String!
  people: [String]
  other: String
}
```

...break time (sorry)
