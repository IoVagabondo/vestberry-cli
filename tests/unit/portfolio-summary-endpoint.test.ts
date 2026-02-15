import type { AxiosInstance } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { listPortfolioSummary } from '../../src/api/endpoints/metrics';
import { executeGraphQL } from '../../src/api/graphql';

vi.mock('../../src/api/graphql', () => ({
  executeGraphQL: vi.fn(),
}));

describe('portfolio summary endpoint', () => {
  beforeEach(() => {
    vi.mocked(executeGraphQL).mockReset();
    vi.mocked(executeGraphQL).mockResolvedValue({
      portfolioSummary: [],
    });
  });

  it('uses richer base query fields by default', async () => {
    await listPortfolioSummary({} as AxiosInstance, { fundId: 'fund-1' });

    const call = vi.mocked(executeGraphQL).mock.calls[0];
    expect(call).toBeDefined();
    const request = call?.[1] as { query: string; variables: Record<string, unknown> };
    expect(request.query).toContain('portfolioCompany');
    expect(request.query).toContain('stage');
    expect(request.query).toContain('portfolioFund');
    expect(request.query).toContain('dashboardDetails');
    expect(request.query).not.toContain('seatsAggregated');
    expect(request.query).not.toContain('sectors');
  });

  it('uses full query when full flag is set', async () => {
    await listPortfolioSummary({} as AxiosInstance, { fundId: 'fund-1', full: true });

    const call = vi.mocked(executeGraphQL).mock.calls[0];
    expect(call).toBeDefined();
    const request = call?.[1] as { query: string; variables: Record<string, unknown> };
    expect(request.query).toContain('seatsAggregated');
    expect(request.query).toContain('sectors');
  });
});
