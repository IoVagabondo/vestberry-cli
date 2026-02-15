import type { AxiosInstance } from 'axios';
import { listPortfolioCompanies } from '../api/endpoints/companies';
import { ensureSingleMatch, rankByQuery } from './search';

export async function searchCompanies(
  client: AxiosInstance,
  fundId: string,
  query: string,
  verbose = false,
): Promise<Array<{ id: string; displayName: string; score: number }>> {
  const companies = await listPortfolioCompanies(client, fundId, verbose);
  const ranked = rankByQuery(query, companies, (item) => item.displayName || '');
  return ranked.map((entry) => ({
    id: entry.item.id,
    displayName: entry.item.displayName,
    score: entry.score,
  }));
}

export async function resolveCompanyId(
  client: AxiosInstance,
  fundId: string,
  query: string,
  selectFirst = false,
  verbose = false,
): Promise<string> {
  const companies = await listPortfolioCompanies(client, fundId, verbose);
  const ranked = rankByQuery(query, companies, (item) => item.displayName || '');
  const selected = ensureSingleMatch(ranked, selectFirst);
  return selected.id;
}
