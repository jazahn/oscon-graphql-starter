import express from 'express'
import graphqlHTTP from 'express-graphql'
import { buildSchema } from 'graphql'
import { find, filter } from 'lodash';
import { makeExecutableSchema } from 'graphql-tools';
import http from 'http'

// init express app and http server
var app = express();
const server = http.createServer(app)

// Fake database ====
const agents = [
  { id: 1, firstName: 'Larry', middleInitial: 'L', lastName: 'Thomas'},
  { id: 2, firstName: 'Bill', middleInitial: 'R', lastName: 'Lewis' }
]

const authors = [
  { id: 1, firstName: 'Tom', middleInitial: 'W',lastName: 'Coleman', agent: find(agents,{id: 1})},
  { id: 2, firstName: 'Sashko', middleInitial: 'L', lastName: 'Stubailo', agent: find(agents,{id: 2})},
  { id: 3, firstName: 'Mikhail', middleInitial: 'R', lastName: 'Novikov', agent: find(agents, {id: 1}) },
];

const posts = [
  { id: 1, authorId: 1, title: 'Introduction to GraphQL',articleType: 'REVIEW' },
  { id: 2, authorId: 2, title: 'GraphQL Rocks', articleType:  'OPINION' },
  { id: 3, authorId: 2, title: 'Advanced GraphQL', articleType: 'TECHNICAL' },
  { id: 4, authorId: 3, title: 'Launchpad is Cool', articleType: 'OPINION' },
];

// ====

const typeDefs =
`
  interface Person {
    id: ID!
    firstName: String
    middleInitial: String
    lastName: String
  }

  enum PostType {
    NEWS
    SPORTS
    OPINION
    REVIEW
    ANALYSIS
    TECHNICAL
	}

  type Author implements Person {
    id: ID!
    firstName: String
    middleInitial: String
    lastName: String

    # Fields unique to the implemented type
    posts: [Post]
    # This is a derived field
    agent: Agent
  }

  type Agent implements Person {
    id: ID!
    firstName: String
    middleInitial: String
    lastName: String
    # Field unique to this implemented type
    represents: [Author]
  }

  type Post {
    id: Int!
    title: String
    author: Author
    articleType: PostType
  }

  type Query {
    posts: [Post]
    authors: [Author]
    agents: [Agent]
    people: [Person]
    author(id: Int!): Author
    agent(id: Int!): Agent
  }
`;

const resolvers = {
  Query: {
    posts: () => posts,
    authors: () => authors,
    agents: () => agents,
    people: () => authors.concat(agents),
    agent: (_, args) => find(agents,{ id: args.id }),
    author: (_, args) => find(authors, { id: args.id }),
  },
  Author: {
    posts: (author) => filter(posts, { authorId: author.id }),
  },
  Post: {
    author: (post) => find(authors, { id: post.authorId }),
  },
  Agent: {
    represents: (agent) => filter(authors, { agent: agent})
  },
		Person: {
      // This code differentiates between the two implementations of Person
      // It is required because objects returned from the "people" query
      //    must be defined types, not interface types
      __resolveType(data, context, info) {
  		  if (data.agent) {
          return 'Author'
        } else {
          return 'Agent'
        }
      }
  },
};

export const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

app.use('/graphql', graphqlHTTP({
  schema: schema,
  rootValue: global,
  graphiql: true,
}));

server.listen(4000);
console.log(
  'Express server listening on port %d in %s mode',
  server.address().port, app.settings.env
)
