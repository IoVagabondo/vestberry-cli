import type { AxiosInstance } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getPortfolioCompanyLedgerDashboardDetails } from '../../src/api/endpoints/portco-dashboard';
import { executeGraphQL } from '../../src/api/graphql';

vi.mock('../../src/api/graphql', () => ({
  executeGraphQL: vi.fn(),
}));

describe('portco dashboard endpoint', () => {
  beforeEach(() => {
    vi.mocked(executeGraphQL).mockReset();
    vi.mocked(executeGraphQL).mockResolvedValue({
      ledgerDashboardDetails: { ownership: '12.5' },
    });
  });

  it('queries ledger dashboard details in fund and portfolio company context', async () => {
    const row = await getPortfolioCompanyLedgerDashboardDetails(
      {} as AxiosInstance,
      { fundId: 'fund-1', portfolioCompanyId: 'portco-1' },
      true,
    );

    expect(row).toEqual({ ownership: '12.5' });

    const call = vi.mocked(executeGraphQL).mock.calls[0];
    expect(call).toBeDefined();
    const request = call?.[1] as {
      operationName: string;
      query: string;
      variables: Record<string, unknown>;
    };

    expect(request.operationName).toBe('portfolioCompanyLedgerDashboardDetails');
    expect(request.variables).toEqual({
      input: {
        funds: [{ id: 'fund-1' }],
        portfolioCompany: { id: 'portco-1' },
      },
    });
    expect(request.query).toContain('query portfolioCompanyLedgerDashboardDetails');
    expect(request.query).toContain('ledgerDashboardDetails');
    expect(request.query).toContain('valuationMethodology');
    expect(request.query).toContain('fxCapitalGain');
    expect(call?.[2]).toBe(true);
  });
});
