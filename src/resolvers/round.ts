import type { AxiosInstance } from 'axios';
import { listRounds } from '../api/endpoints/reports';
import { ensureSingleMatch, rankByQuery } from './search';

export async function searchRounds(
  client: AxiosInstance,
  companyId: string,
  query: string,
  until?: string,
  verbose = false,
): Promise<Array<{ id: string; name: string; eventDate?: string; score: number }>> {
  const rounds = await listRounds(client, companyId, until, verbose);
  const ranked = rankByQuery(query, rounds, (item) => String(item.name ?? ''));
  return ranked.map((entry) => ({
    id: String(entry.item.id ?? ''),
    name: String(entry.item.name ?? ''),
    ...((entry.item.eventDate as string | undefined) !== undefined
      ? { eventDate: entry.item.eventDate as string }
      : {}),
    score: entry.score,
  }));
}

export async function resolveRoundId(
  client: AxiosInstance,
  companyId: string,
  query: string,
  until?: string,
  selectFirst = false,
  verbose = false,
): Promise<string> {
  const rounds = await listRounds(client, companyId, until, verbose);
  const ranked = rankByQuery(query, rounds, (item) => String(item.name ?? ''));
  const selected = ensureSingleMatch(ranked, selectFirst);
  return String(selected.id ?? '');
}
