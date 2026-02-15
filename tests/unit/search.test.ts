import { describe, expect, it } from 'vitest';
import { rankByQuery } from '../../src/resolvers/search';

describe('search ranking', () => {
  const rows = [
    { id: '1', name: 'Sample Growth Fund' },
    { id: '2', name: 'Venture Fund' },
    { id: '3', name: 'Core Venture Portfolio' },
  ];

  it('prefers exact matches', () => {
    const ranked = rankByQuery('Sample Growth Fund', rows, (x) => x.name);
    expect(ranked[0]?.item.id).toBe('1');
  });

  it('returns prefix matches before contains', () => {
    const ranked = rankByQuery('venture', rows, (x) => x.name);
    expect(ranked.length).toBeGreaterThan(1);
    expect(ranked[0]?.item.id).toBe('2');
  });
});
