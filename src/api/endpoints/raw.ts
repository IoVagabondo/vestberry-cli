import type { AxiosInstance } from 'axios';
import { executeGraphQL } from '../graphql';

export async function runRawGraphQL(
  client: AxiosInstance,
  query: string,
  variables: Record<string, unknown> | undefined,
  operationName: string | undefined,
  verbose = false,
): Promise<unknown> {
  return executeGraphQL(
    client,
    {
      query,
      ...(variables !== undefined ? { variables } : {}),
      ...(operationName !== undefined ? { operationName } : {}),
    },
    verbose,
  );
}

export async function runRawHttp(
  client: AxiosInstance,
  method: string,
  path: string,
  data?: unknown,
  params?: Record<string, unknown>,
): Promise<unknown> {
  const response = await client.request({
    method,
    url: path,
    data,
    params,
  });

  return response.data;
}
