import { describe, expect, it } from 'vitest';
import { buildPortfolioOverviewPayload } from '../../src/utils/portfolio-overview';
import type { PortfolioSummaryRow } from '../../src/api/endpoints/metrics';

describe('portfolio overview payload', () => {
  it('builds requested top-level shape and flattens company rows', () => {
    const summary: PortfolioSummaryRow[] = [
      {
        id: 'row-1',
        investmentName: 'Acme',
        dashboardDetails: {
          ownership: '2.1',
          ownershipFD: '1.9',
          investedEquity: { local: '10', gp: '11' },
          investedDebt: { local: '1', gp: '2' },
          investedFunds: { local: '3', gp: '4' },
          totalOriginalCost: { local: '14', gp: '17' },
          irr: { local: '5', gp: '6' },
          multiple: { local: '1.2', gp: '1.3' },
          latestInvestmentRoundDate: [{ eventDate: '2024-01-01' }, { eventDate: '2025-03-02' }],
        },
        portfolioCompany: { id: 'pc-1', displayName: 'Acme GmbH' },
      },
      {
        id: null,
        investmentName: 'TOTAL',
        dashboardDetails: {
          irr: { gp: '8.2' },
          multiple: { gp: '1.9' },
        },
        portfolioCompany: null,
      },
    ];

    const payload = buildPortfolioOverviewPayload({
      fundId: 'fund-1',
      fundName: 'My Fund',
      cutOffDate: '2026-02-15',
      fundManagement: {
        fund: { id: 'fund-1', displayName: 'My Fund' },
        numberOfCashFlows: 0,
        numberOfNAVs: 0,
        balance: '0',
        tvpi: null,
        dpi: null,
        rvpi: null,
        netIrr: null,
      },
      summary,
    });

    expect(payload.fund).toEqual({ id: 'fund-1', name: 'My Fund' });
    expect(payload.cutOffDate).toBe('2026-02-15');
    expect(payload.performance.tvpi).toBe('1.9');
    expect(payload.performance.netIrr).toBe('8.2');
    expect(payload.performance.dpi).toBe('0');
    expect(payload.performance.rvpi).toBe('0');
    expect(payload.portfolioCompanies).toHaveLength(2);
    const firstCompany = payload.portfolioCompanies[0] as Record<string, unknown>;
    expect(payload.portfolioCompanies[0]).toMatchObject({
      id: 'row-1',
      investmentName: 'Acme',
      portfolioCompanyId: 'pc-1',
      portfolioCompanyName: 'Acme GmbH',
      investedEquity: '11',
      investedDebt: '2',
      investedFunds: '4',
      totalOriginalCost: '17',
      irr: '6',
      multiple: '1.3',
      latestInvestmentRoundDate: '2025-03-02',
    });
    expect('portfolioCompany' in firstCompany).toBe(false);
  });

  it('uses safe defaults when metrics are missing', () => {
    const payload = buildPortfolioOverviewPayload({
      fundId: 'fund-2',
      cutOffDate: '2026-02-15',
      fundManagement: {},
      summary: [],
    });

    expect(payload.fund).toEqual({ id: 'fund-2', name: 'fund-2' });
    expect(payload.cutOffDate).toBe('2026-02-15');
    expect(payload.performance).toEqual({
      numberOfCashFlows: 0,
      numberOfNAVs: 0,
      balance: '0',
      tvpi: '0',
      dpi: '0',
      rvpi: '0',
      netIrr: '0',
    });
    expect(payload.portfolioCompanies).toEqual([]);
  });

  it('does not emit nested gp/local objects when both are null', () => {
    const summary: PortfolioSummaryRow[] = [
      {
        id: 'row-null',
        investmentName: 'Meron Fund III',
        dashboardDetails: {
          irr: { local: null, gp: null },
          multiple: { local: null, gp: null },
          investedEquity: { local: '0', gp: '0' },
          investedDebt: { local: '0', gp: '0' },
          investedFunds: { local: '0', gp: '0' },
          totalOriginalCost: { local: '0', gp: '0' },
          latestInvestmentRoundDate: [],
        },
        portfolioCompany: null,
      },
    ];

    const payload = buildPortfolioOverviewPayload({
      fundId: 'fund-3',
      cutOffDate: '2026-02-15',
      fundManagement: {},
      summary,
    });

    expect(payload.portfolioCompanies).toHaveLength(1);
    expect(payload.portfolioCompanies[0]).toMatchObject({
      investmentName: 'Meron Fund III',
      irr: null,
      multiple: null,
      investedEquity: '0',
      investedDebt: '0',
      investedFunds: '0',
      totalOriginalCost: '0',
      latestInvestmentRoundDate: null,
    });
  });
});
