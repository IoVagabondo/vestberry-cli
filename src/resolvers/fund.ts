import type { AxiosInstance } from 'axios';
import { listFunds } from '../api/endpoints/funds';
import { rankByQuery, ensureSingleMatch } from './search';

export async function searchFunds(
  client: AxiosInstance,
  query: string,
  verbose = false,
): Promise<Array<{ id: string; displayName: string; score: number }>> {
  const funds = await listFunds(client, undefined, verbose);
  const ranked = rankByQuery(query, funds, (item) => item.displayName || '');
  return ranked.map((entry) => ({
    id: entry.item.id,
    displayName: entry.item.displayName,
    score: entry.score,
  }));
}

export async function resolveFundId(
  client: AxiosInstance,
  query: string,
  selectFirst = false,
  verbose = false,
): Promise<string> {
  const funds = await listFunds(client, undefined, verbose);
  const ranked = rankByQuery(query, funds, (item) => item.displayName || '');
  const selected = ensureSingleMatch(ranked, selectFirst);
  return selected.id;
}
