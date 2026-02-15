import type { AxiosInstance } from 'axios';
import { listStakeholders } from '../api/endpoints/reports';
import { ensureSingleMatch, rankByQuery } from './search';

export async function searchStakeholders(
  client: AxiosInstance,
  companyId: string,
  query: string,
  verbose = false,
): Promise<Array<{ id: string; name: string; score: number }>> {
  const stakeholders = await listStakeholders(client, companyId, verbose);
  const ranked = rankByQuery(query, stakeholders, (item) => String(item.name ?? ''));
  return ranked.map((entry) => ({
    id: String(entry.item.id ?? ''),
    name: String(entry.item.name ?? ''),
    score: entry.score,
  }));
}

export async function resolveStakeholderId(
  client: AxiosInstance,
  companyId: string,
  query: string,
  selectFirst = false,
  verbose = false,
): Promise<string> {
  const stakeholders = await listStakeholders(client, companyId, verbose);
  const ranked = rankByQuery(query, stakeholders, (item) => String(item.name ?? ''));
  const selected = ensureSingleMatch(ranked, selectFirst);
  return String(selected.id ?? '');
}
