import { z } from 'zod';

export const GraphQLErrorSchema = z
  .object({
    message: z.string(),
    path: z.array(z.union([z.string(), z.number()])).optional(),
    extensions: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough();

export const GraphQLResponseSchema = z
  .object({
    data: z.unknown().optional(),
    errors: z.array(GraphQLErrorSchema).optional(),
  })
  .passthrough();

export type GraphQLError = z.infer<typeof GraphQLErrorSchema>;
export type GraphQLResponse = z.infer<typeof GraphQLResponseSchema>;

export interface PaginationInfo {
  limit?: number;
  offset?: number;
  count?: number;
  hasNextPage?: boolean;
  endCursor?: string | null;
  mode?: 'offset' | 'connection' | 'none';
}

export interface ListEnvelope<T> {
  pagination: PaginationInfo;
  data: T[];
}

export interface SearchResult<T> {
  score: number;
  item: T;
}
