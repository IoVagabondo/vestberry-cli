import type { AxiosInstance } from 'axios';
import { executeGraphQL } from '../graphql';

interface CountriesResponse {
  countries: Array<Record<string, unknown>>;
}

interface CurrenciesResponse {
  currencies: Array<Record<string, unknown>>;
}

interface FxRatesResponse {
  fxRates: Record<string, unknown>;
}

export async function listCountries(
  client: AxiosInstance,
  verbose = false,
): Promise<Array<Record<string, unknown>>> {
  const query = `
    query Countries {
      countries {
        id
        code
        displayName
      }
    }
  `;

  const data = await executeGraphQL<CountriesResponse>(client, { query }, verbose);
  return data.countries ?? [];
}

export async function listCurrencies(
  client: AxiosInstance,
  verbose = false,
): Promise<Array<Record<string, unknown>>> {
  const query = `
    query Currencies {
      currencies {
        id
        code
        symbol
      }
    }
  `;

  const data = await executeGraphQL<CurrenciesResponse>(client, { query }, verbose);
  return data.currencies ?? [];
}

export async function getFxRates(
  client: AxiosInstance,
  fundId: string,
  limit = 20,
  verbose = false,
): Promise<Record<string, unknown>> {
  const query = `
    query FxRates($input: FxRatesInput!) {
      fxRates(input: $input) {
        totalCount
        filteredCount
        hasNextPage
        currencyFrom { id code }
        selectedCurrencies { id code }
      }
    }
  `;

  const data = await executeGraphQL<FxRatesResponse>(
    client,
    { query, variables: { input: { fund: { id: fundId }, limit } } },
    verbose,
  );

  return data.fxRates ?? {};
}
