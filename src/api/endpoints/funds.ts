import type { AxiosInstance } from 'axios';
import { executeGraphQL } from '../graphql';

export interface Fund {
  id: string;
  displayName: string;
  [key: string]: unknown;
}

interface FundsResponse {
  funds: Fund[];
}

interface FundResponse {
  fund: Fund;
}

export async function listFunds(
  client: AxiosInstance,
  input?: Record<string, unknown>,
  verbose = false,
): Promise<Fund[]> {
  const query = `
    query Funds($input: FundsSearch) {
      funds(input: $input) {
        id
        displayName
      }
    }
  `;

  const data = await executeGraphQL<FundsResponse>(
    client,
    { query, variables: { input } },
    verbose,
  );
  return data.funds ?? [];
}

export async function getFund(client: AxiosInstance, id: string, verbose = false): Promise<Fund> {
  const query = `
    query Fund($input: FundSearch) {
      fund(input: $input) {
        id
        displayName
      }
    }
  `;

  const data = await executeGraphQL<FundResponse>(
    client,
    { query, variables: { input: { id } } },
    verbose,
  );
  return data.fund;
}
