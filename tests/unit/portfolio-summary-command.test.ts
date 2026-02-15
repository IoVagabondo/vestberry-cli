import { Command } from 'commander';
import { describe, expect, it } from 'vitest';
import {
  applyPortfolioSummarySelect,
  buildPortfolioSummaryJsonPayload,
  flattenPortfolioSummaryAggregateRow,
  flattenPortfolioSummaryCompanyRow,
  hasPortfolioCompanyId,
  hasPortfolioSummaryId,
  isPortfolioSummaryTotalRow,
  parsePortfolioSummarySelect,
  registerFundSummarySubcommand,
} from '../../src/commands/portfolio-summary';

describe('fund get-summary command', () => {
  it('exposes full/select/export-json options on get-summary', () => {
    const fund = new Command('fund');
    registerFundSummarySubcommand(fund);

    const getCmd = fund.commands.find((cmd) => cmd.name() === 'get-summary');
    expect(getCmd).toBeDefined();

    const optionNames = (getCmd?.options ?? []).map((opt) => opt.long);
    expect(optionNames).toContain('--full');
    expect(optionNames).toContain('--select');
    expect(optionNames).toContain('--export-json');
  });

  it('filters out rows without id', () => {
    expect(hasPortfolioSummaryId({ id: 'abc123' })).toBe(true);
    expect(hasPortfolioSummaryId({ id: '  abc123  ' })).toBe(true);
    expect(hasPortfolioSummaryId({ id: null })).toBe(false);
    expect(hasPortfolioSummaryId({ id: '' })).toBe(false);
    expect(hasPortfolioSummaryId({ id: '   ' })).toBe(false);
    expect(hasPortfolioSummaryId({})).toBe(false);
  });

  it('keeps only rows with non-empty portfolioCompany.id', () => {
    expect(hasPortfolioCompanyId({ portfolioCompany: { id: 'pc-1' } })).toBe(true);
    expect(hasPortfolioCompanyId({ portfolioCompany: { id: '  pc-2  ' } })).toBe(true);
    expect(hasPortfolioCompanyId({ portfolioCompany: null })).toBe(false);
    expect(hasPortfolioCompanyId({ portfolioCompany: { id: null } })).toBe(false);
    expect(hasPortfolioCompanyId({ portfolioCompany: { id: '' } })).toBe(false);
    expect(hasPortfolioCompanyId({})).toBe(false);
  });

  it('detects the TOTAL aggregate row even without an id', () => {
    expect(isPortfolioSummaryTotalRow({ id: null, investmentName: 'TOTAL' })).toBe(true);
    expect(isPortfolioSummaryTotalRow({ investmentName: ' total ' })).toBe(true);
    expect(isPortfolioSummaryTotalRow({ id: 'abc123', investmentName: 'TOTAL' })).toBe(false);
    expect(isPortfolioSummaryTotalRow({ id: null, investmentName: 'Acme' })).toBe(false);
  });

  it('flattens portfolio company row for json/export payload', () => {
    const row = flattenPortfolioSummaryCompanyRow({
      id: 'r-1',
      investmentName: 'Acme',
      portfolioFund: { id: 'pf-1', displayName: 'Fund X' },
      portfolioCompany: {
        id: 'pc-1',
        companyId: 'redundant-company-id',
        displayName: 'Acme GmbH',
        taxId: 'T-1',
      },
      dashboardDetails: {
        ownership: '2.3',
        irr: { fund: '10', gp: '9', local: '8' },
      },
    });

    expect(row).toMatchObject({
      id: 'r-1',
      investmentName: 'Acme',
      portfolioCompanyId: 'pc-1',
      portfolioCompanyDisplayName: 'Acme GmbH',
      portfolioCompanyTaxId: 'T-1',
      ownership: '2.3',
      irr: { fund: '10', gp: '9', local: '8' },
    });
    expect('portfolioCompany' in row).toBe(false);
    expect('portfolioCompanyCompanyId' in row).toBe(false);
    expect('portfolioFund' in row).toBe(false);
    expect('dashboardDetails' in row).toBe(false);
  });

  it('flattens summary dashboard details for json/export payload', () => {
    const summary = flattenPortfolioSummaryAggregateRow({
      id: null,
      investmentName: 'TOTAL',
      portfolioCompany: null,
      portfolioFund: null,
      dashboardDetails: {
        ownership: null,
        ownershipFD: null,
        irr: { fund: '1.49', gp: '1.49', local: null },
        multiple: { fund: '1.04', gp: '1.04', local: null },
        latestInvestmentRoundDate: null,
      },
    }, 'fund-123');

    expect(summary).toMatchObject({
      id: 'fund-123',
      investmentName: 'TOTAL',
      irr: { fund: '1.49', gp: '1.49', local: null },
      multiple: { fund: '1.04', gp: '1.04', local: null },
    });
    expect('ownership' in summary).toBe(false);
    expect('ownershipFD' in summary).toBe(false);
    expect('latestInvestmentRoundDate' in summary).toBe(false);
    expect('portfolioCompany' in summary).toBe(false);
    expect('portfolioFund' in summary).toBe(false);
    expect('dashboardDetails' in summary).toBe(false);
  });

  it('renames data to portfolioCompanies in json/export payload', () => {
    const payload = buildPortfolioSummaryJsonPayload(
      {
        pagination: { mode: 'none', count: 1 },
        data: [
          {
            id: 'r-1',
            investmentName: 'Acme',
            portfolioCompany: { id: 'pc-1', displayName: 'Acme GmbH' },
            dashboardDetails: { ownership: '2.3' },
          },
        ],
      },
      'fund-123',
      { id: null, investmentName: 'TOTAL', dashboardDetails: { ownership: null } },
    );

    expect(payload).toHaveProperty('portfolioCompanies');
    expect(payload).not.toHaveProperty('data');
    expect(payload).toHaveProperty('summary');
    expect((payload.summary as Record<string, unknown>).id).toBe('fund-123');
  });

  it('parses unscoped and scoped --select fields', () => {
    const select = parsePortfolioSummarySelect(
      'id,portfolioCompanyDisplayName,irr,summary.multiple,portfolioCompanies.currentCost',
    );

    expect(select.includeCompanies).toBe(true);
    expect(select.includeSummary).toBe(true);
    expect(select.companyFields.has('id')).toBe(true);
    expect(select.companyFields.has('portfolioCompanyDisplayName')).toBe(true);
    expect(select.companyFields.has('irr')).toBe(true);
    expect(select.companyFields.has('currentCost')).toBe(true);
    expect(select.summaryFields.has('id')).toBe(true);
    expect(select.summaryFields.has('irr')).toBe(true);
    expect(select.summaryFields.has('multiple')).toBe(true);
  });

  it('rejects unknown --select fields', () => {
    expect(() => parsePortfolioSummarySelect('id,fooBar')).toThrow(/Unknown --select field/);
    expect(() => parsePortfolioSummarySelect('summary.ownership')).toThrow(
      /Unknown --select field/,
    );
  });

  it('projects payload by selected fields', () => {
    const payload = buildPortfolioSummaryJsonPayload(
      {
        pagination: { mode: 'none', count: 1 },
        data: [
          {
            id: 'r-1',
            investmentName: 'Acme',
            portfolioCompany: { id: 'pc-1', displayName: 'Acme GmbH' },
            dashboardDetails: {
              irr: { fund: '11' },
              multiple: { fund: '1.2' },
            },
          },
        ],
      },
      'fund-123',
      {
        id: null,
        investmentName: 'TOTAL',
        dashboardDetails: {
          irr: { fund: '1.49' },
          multiple: { fund: '1.04' },
        },
      },
    );

    const selectSpec = parsePortfolioSummarySelect(
      'portfolioCompanies.id,portfolioCompanies.irr,summary.id,summary.multiple',
    );
    const projected = applyPortfolioSummarySelect(payload, selectSpec);

    expect(projected).toMatchObject({
      pagination: { count: 1 },
      portfolioCompanies: [{ id: 'r-1', irr: { fund: '11' } }],
      summary: { id: 'fund-123', multiple: { fund: '1.04' } },
    });
    expect((projected.portfolioCompanies as Array<Record<string, unknown>>)[0]).not.toHaveProperty(
      'investmentName',
    );
  });
});
