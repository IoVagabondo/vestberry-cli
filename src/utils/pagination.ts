import type { ListEnvelope, PaginationInfo } from '../api/types';

export function createListEnvelope<T>(data: T[], pagination?: PaginationInfo): ListEnvelope<T> {
  return {
    pagination: {
      mode: pagination?.mode ?? 'none',
      ...pagination,
      count: pagination?.count ?? data.length,
    },
    data,
  };
}

export async function collectAllOffset<T>(
  pageFn: (offset: number) => Promise<ListEnvelope<T>>,
  pageSize: number,
): Promise<ListEnvelope<T>> {
  const all: T[] = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const page = await pageFn(offset);
    all.push(...page.data);
    offset += pageSize;
    hasMore = page.data.length >= pageSize;
  }

  return createListEnvelope(all, {
    mode: 'offset',
    offset: 0,
    limit: all.length,
    count: all.length,
    hasNextPage: false,
  });
}

export function fromConnection<T>(
  connection:
    | {
        edges?: Array<{ node?: T | null } | null>;
        pageInfo?: { hasNextPage?: boolean; endCursor?: string | null };
      }
    | null
    | undefined,
): ListEnvelope<T> {
  const edges = connection?.edges ?? [];
  const data = edges
    .map((edge) => edge?.node)
    .filter((node): node is T => node !== null && node !== undefined);

  return createListEnvelope(data, {
    mode: 'connection',
    hasNextPage: connection?.pageInfo?.hasNextPage ?? false,
    endCursor: connection?.pageInfo?.endCursor ?? null,
    count: data.length,
  });
}
