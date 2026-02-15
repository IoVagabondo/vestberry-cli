import type { AxiosInstance } from 'axios';
import { executeGraphQL } from '../graphql';

interface AuthTestResponse {
  __typename: string;
}

export async function authTest(client: AxiosInstance, verbose = false): Promise<AuthTestResponse> {
  const query = `query AuthTest { __typename }`;
  return executeGraphQL<AuthTestResponse>(client, { query }, verbose);
}
