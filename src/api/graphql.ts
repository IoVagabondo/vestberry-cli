import type { AxiosInstance } from 'axios';
import { GraphQLResponseSchema } from './types';
import { CliError } from '../utils/errors';
import { requestWithRetry } from './client';

export interface GraphQLRequest {
  query: string;
  variables?: Record<string, unknown>;
  operationName?: string;
}

export async function executeGraphQL<TData = unknown>(
  client: AxiosInstance,
  request: GraphQLRequest,
  verbose = false,
): Promise<TData> {
  try {
    const response = await requestWithRetry(() => client.post('', request));
    const parsed = GraphQLResponseSchema.parse(response.data);

    if (parsed.errors && parsed.errors.length > 0) {
      const message = parsed.errors.map((err) => err.message).join('; ');
      throw new CliError('GRAPHQL_ERROR', message, verbose ? parsed.errors : undefined);
    }

    return parsed.data as TData;
  } catch (error: any) {
    if (error instanceof CliError) {
      throw error;
    }

    if (error?.response) {
      const status = error.response.status;
      const message = `HTTP ${status}: ${error.response.statusText || 'Request failed'}`;
      throw new CliError('HTTP_ERROR', message, verbose ? error.response.data : undefined);
    }

    if (error?.request) {
      throw new CliError(
        'NETWORK_ERROR',
        'Network error while contacting Vestberry API',
        verbose ? error : undefined,
      );
    }

    throw new CliError(
      'HTTP_ERROR',
      error?.message || 'Unknown API error',
      verbose ? error : undefined,
    );
  }
}
