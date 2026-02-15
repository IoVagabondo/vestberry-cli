import fs from 'node:fs/promises';
import path from 'node:path';
import type { AxiosInstance } from 'axios';
import { executeGraphQL } from './graphql';

const INTROSPECTION_QUERY = `
  query IntrospectionQuery {
    __schema {
      queryType { name }
      mutationType { name }
      types {
        kind
        name
        description
        fields(includeDeprecated: true) {
          name
          description
          args {
            name
            description
            type {
              kind
              name
              ofType { kind name ofType { kind name } }
            }
          }
          type {
            kind
            name
            ofType { kind name ofType { kind name } }
          }
        }
        inputFields {
          name
          description
          type {
            kind
            name
            ofType { kind name ofType { kind name } }
          }
        }
        enumValues(includeDeprecated: true) {
          name
          description
        }
      }
    }
  }
`;

export async function pullSchema(client: AxiosInstance, verbose = false): Promise<string> {
  const schema = await executeGraphQL(client, { query: INTROSPECTION_QUERY }, verbose);
  const outDir = path.join(process.cwd(), '.cache');
  const outFile = path.join(outDir, 'vestberry-schema.json');
  await fs.mkdir(outDir, { recursive: true });
  await fs.writeFile(outFile, JSON.stringify(schema, null, 2), 'utf-8');
  return outFile;
}
