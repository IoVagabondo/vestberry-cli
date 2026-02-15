import { describe, expect, it } from 'vitest';
import { createListEnvelope, fromConnection } from '../../src/utils/pagination';

describe('pagination utilities', () => {
  it('creates list envelope with count', () => {
    const envelope = createListEnvelope([{ id: 1 }]);
    expect(envelope.pagination.count).toBe(1);
    expect(envelope.data[0]).toEqual({ id: 1 });
  });

  it('extracts relay connection', () => {
    const envelope = fromConnection({
      edges: [{ node: { id: 'a' } }, { node: { id: 'b' } }],
      pageInfo: { hasNextPage: true, endCursor: 'cursor-1' },
    });

    expect(envelope.data).toHaveLength(2);
    expect(envelope.pagination.hasNextPage).toBe(true);
    expect(envelope.pagination.endCursor).toBe('cursor-1');
  });
});
