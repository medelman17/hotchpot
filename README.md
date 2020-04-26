# Xertz

Xertz is a proof of concept. Right now, it's fairly limited. It can take some SDL and turn it into a production-grade, cloud-native, serverless, fluent, graphql api. But, other than that, not much. But it's early days.

## Why?

The confluence of two events, really. One, I've been working a lot with AppSync and the AWS Amplify-ecosystem lately. Two, I read a book. Only the latter event is interesting, here.

The book is [The DynamoDB Book](https://www.dynamodbbook.com/), by DynamoDB Mad-Scientist, [Alex DeBrie](https://twitter.com/alexbdebrie). The book is excellent. Suffice it to say: we would not be here without the book. Buy it if you want to learn how to index things in an infinitely-scalable file drawer.

A lot of the book deals with strategic indexing--i.e., how to define/structure the primary and sort keys for your 'table'. Done right... one only needs a single table, which is the holy grail. For many reasons. None of which I will go into, here. Every non-graphql-developing dynamo dev knows this, I'm sure. So, you'll have to trust me.

That said, I'm not a NoSQL expert (is that a double negative or nah?) by any means. But, if you ask me, **a lot** of it comes down to predictable prefixing. There's some tough bits to deal with, for sure. But, given a predictable prefixing scheme, it seemed to me that a lot of use-cases could be solved programatically.

Enter GraphQL: with its now, ever-so-sexy, strong-typing. Rawr. Could we use that type system to (1) auto-generate optimized index/key-structures for many use cases and (2), if so, how far could we push it.

Xertz is a POC re: (1)

## How Xertz Works

You give Xertz a basic schema in GraphQL's Schema Definition Language (SDL). Like this:

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

And then Xertz transforms your schema into a fluent GraphQL API backed by a single-table DynamoDB data source.

...break time (sorry)
