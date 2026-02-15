import type { AxiosInstance } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getFund, listFunds } from '../../src/api/endpoints/funds';
import { executeGraphQL } from '../../src/api/graphql';

vi.mock('../../src/api/graphql', () => ({
  executeGraphQL: vi.fn(),
}));

describe('funds endpoint', () => {
  beforeEach(() => {
    vi.mocked(executeGraphQL).mockReset();
    vi.mocked(executeGraphQL).mockResolvedValue({
      fund: { id: 'fund-1', displayName: 'Fund 1' },
    });
  });

  it('uses enriched default query for fund get', async () => {
    await getFund({} as AxiosInstance, 'fund-1');

    const call = vi.mocked(executeGraphQL).mock.calls[0];
    expect(call).toBeDefined();
    const request = call?.[1] as { query: string; variables: Record<string, unknown> };

    expect(request.variables).toEqual({ input: { id: 'fund-1' } });
    expect(request.query).toContain('fullLegalName');
    expect(request.query).not.toContain('fundManagement');
    expect(request.query).not.toContain('portfolioInvestments');
    expect(request.query).not.toContain('employees');
  });

  it('uses full query when full flag is set', async () => {
    await getFund({} as AxiosInstance, 'fund-1', false, true);

    const call = vi.mocked(executeGraphQL).mock.calls[0];
    expect(call).toBeDefined();
    const request = call?.[1] as { query: string; variables: Record<string, unknown> };

    expect(request.variables).toEqual({ input: { id: 'fund-1' } });
    expect(request.query).toContain('portfolioInvestments');
    expect(request.query).toContain('employees');
    expect(request.query).toContain('portfolioSummary');
    expect(request.query).not.toContain('fundManagement');
  });

  it('uses getFundNames shape for funds list', async () => {
    vi.mocked(executeGraphQL).mockResolvedValueOnce({
      funds: [{ id: 'fund-1', displayName: 'Fund 1', vintageYear: 2024, order: 12 }],
    });

    const rows = await listFunds({} as AxiosInstance, {});
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      id: 'fund-1',
      displayName: 'Fund 1',
      vintageYear: 2024,
      order: 12,
    });

    const call = vi.mocked(executeGraphQL).mock.calls[0];
    expect(call).toBeDefined();
    const request = call?.[1] as { query: string; variables: Record<string, unknown> };
    expect(request.query).toContain('query getFundNames');
    expect(request.query).toContain('vintageYear');
    expect(request.query).toContain('order');
  });
});
