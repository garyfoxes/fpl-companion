import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client';

const apiUrl = import.meta.env.VITE_GRAPHQL_URL || 'http://localhost:4000/graphql';

export const apolloClient = new ApolloClient({
  link: new HttpLink({ uri: apiUrl }),
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          players: {
            merge(_existing, incoming) {
              return incoming;
            }
          },
          fixtures: {
            merge(_existing, incoming) {
              return incoming;
            }
          }
        }
      }
    }
  })
});
