import type { Command } from 'commander';
import { listPortfolioSummary } from '../api/endpoints/metrics';
import type { ListEnvelope } from '../api/types';
import { createListEnvelope } from '../utils/pagination';
import { printData, printListEnvelope } from '../utils/output';
import { getCommandContext, handleCliError } from './common';
import {
  buildDefaultJsonExportPath,
  resolveJsonExportPath,
  writeJsonExportFile,
} from '../utils/json-export';

const DASHBOARD_BASE_FIELDS = [
  'ownership',
  'ownershipFD',
  'investedEquity',
  'investedDebt',
  'investedFunds',
  'totalOriginalCost',
  'irr',
  'multiple',
] as const;

const DASHBOARD_FULL_FIELDS = [
  'investmentInstrument',
  'entryRound',
  'exits',
  'status',
  'totalFofInvestment',
  'latestInvestmentStage',
  'totalFollowOnInvestment',
  'totalInitialInvestment',
  'currentCost',
  'investedOther',
  'proceedsTotal',
  'proceeds',
  'debtRepayment',
  'cashRealized',
  'cashIncome',
  'currentShareValue',
  'companyValuation',
  'firstCheckMoIC',
  'totalReturn',
  'outstandingDebt',
  'totalCapitalGain',
  'entryInvestmentStage',
  'firstInvestmentEventDate',
  'totalCommitment',
  'fundedPortfolioFundCommitment',
  'fundedPortfolioCompanyCommitment',
  'unfundedPortfolioFundCommitment',
  'unfundedPortfolioCompanyCommitment',
  'latestFinancingRound',
  'totalAmountRaised',
] as const;

const PORTFOLIO_COMPANY_FLAT_FIELDS = [
  'portfolioCompanyId',
  'portfolioCompanyVatId',
  'portfolioCompanyTaxId',
  'portfolioCompanyFullLegalName',
  'portfolioCompanyStage',
  'portfolioCompanyDisplayName',
  'portfolioCompanyDomicileCountry',
  'portfolioCompanyOperatingCurrency',
  'portfolioCompanyLogo',
] as const;

const PORTFOLIO_SUMMARY_COMPANY_SELECTABLE_FIELDS = new Set<string>([
  'id',
  'investmentName',
  ...PORTFOLIO_COMPANY_FLAT_FIELDS,
  ...DASHBOARD_BASE_FIELDS,
  ...DASHBOARD_FULL_FIELDS,
  'seatsAggregated',
  'sectors',
]);

const PORTFOLIO_SUMMARY_SUMMARY_SELECTABLE_FIELDS = new Set<string>(
  ['id', 'investmentName', ...DASHBOARD_BASE_FIELDS, ...DASHBOARD_FULL_FIELDS].filter(
    (field) => field !== 'ownership' && field !== 'ownershipFD' && field !== 'latestInvestmentRoundDate',
  ),
);

interface PortfolioSummarySelectSpec {
  companyFields: Set<string>;
  summaryFields: Set<string>;
  includeCompanies: boolean;
  includeSummary: boolean;
}

export function hasPortfolioSummaryId(row: Record<string, unknown>): boolean {
  return typeof row.id === 'string' && row.id.trim().length > 0;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

export function hasPortfolioCompanyId(row: Record<string, unknown>): boolean {
  const company = row.portfolioCompany;
  if (!company || typeof company !== 'object' || Array.isArray(company)) {
    return false;
  }
  const id = (company as { id?: unknown }).id;
  return typeof id === 'string' && id.trim().length > 0;
}

export function isPortfolioSummaryTotalRow(row: Record<string, unknown>): boolean {
  if (hasPortfolioSummaryId(row)) {
    return false;
  }
  return String(row.investmentName ?? '')
    .trim()
    .toUpperCase() === 'TOTAL';
}

function prefixedCompanyFields(
  company: Record<string, unknown> | null,
): Record<string, unknown> {
  if (!company) {
    return {};
  }

  const output: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(company)) {
    if (key.length === 0) {
      continue;
    }
    if (key === 'companyId') {
      continue;
    }
    output[`portfolioCompany${key.charAt(0).toUpperCase()}${key.slice(1)}`] = value;
  }
  return output;
}

export function flattenPortfolioSummaryCompanyRow(
  row: Record<string, unknown>,
): Record<string, unknown> {
  const portfolioCompany = asRecord(row.portfolioCompany);
  const dashboardDetails = asRecord(row.dashboardDetails);
  const rest = { ...row };
  delete rest.portfolioCompany;
  delete rest.portfolioFund;
  delete rest.dashboardDetails;
  return {
    ...rest,
    ...prefixedCompanyFields(portfolioCompany),
    ...(dashboardDetails ?? {}),
  };
}

export function flattenPortfolioSummaryAggregateRow(
  row: Record<string, unknown>,
  fundId: string,
): Record<string, unknown> {
  const dashboardDetails = asRecord(row.dashboardDetails) ?? {};
  const { investmentName } = row;
  const summary: Record<string, unknown> = {
    id: fundId,
    investmentName: investmentName ?? 'TOTAL',
  };

  for (const [key, value] of Object.entries(dashboardDetails)) {
    if (key === 'ownership' || key === 'ownershipFD' || key === 'latestInvestmentRoundDate') {
      continue;
    }
    summary[key] = value;
  }

  return summary;
}

function maybeSummary(
  row: Record<string, unknown> | undefined,
  fundId: string,
): Record<string, unknown> | undefined {
  if (!row) {
    return undefined;
  }

  return {
    ...flattenPortfolioSummaryAggregateRow(row, fundId),
  };
}

export function buildPortfolioSummaryJsonPayload(
  envelope: ListEnvelope<Record<string, unknown>>,
  fundId: string,
  totalRow?: Record<string, unknown>,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    pagination: envelope.pagination,
    portfolioCompanies: envelope.data.map(flattenPortfolioSummaryCompanyRow),
  };
  const summary = maybeSummary(totalRow, fundId);
  if (summary) {
    payload.summary = summary;
  }
  return payload;
}

function pickFields(
  source: Record<string, unknown>,
  selectedFields: Set<string>,
): Record<string, unknown> {
  const projected: Record<string, unknown> = {};
  for (const field of selectedFields) {
    if (field in source) {
      projected[field] = source[field];
    }
  }
  return projected;
}

function parseSelectToken(token: string): { scope: 'company' | 'summary' | 'any'; field: string } {
  if (token.startsWith('portfolioCompanies.')) {
    return { scope: 'company', field: token.slice('portfolioCompanies.'.length) };
  }
  if (token.startsWith('summary.')) {
    return { scope: 'summary', field: token.slice('summary.'.length) };
  }
  return { scope: 'any', field: token };
}

export function parsePortfolioSummarySelect(select: string): PortfolioSummarySelectSpec {
  const tokens = select
    .split(',')
    .map((token) => token.trim())
    .filter((token) => token.length > 0);

  if (tokens.length === 0) {
    throw new Error(
      'Invalid --select value. Provide a comma-separated list of fields, e.g. "id,investmentName,irr".',
    );
  }

  const companyFields = new Set<string>();
  const summaryFields = new Set<string>();
  const unknownFields: string[] = [];

  for (const token of tokens) {
    const { scope, field } = parseSelectToken(token);
    if (field.length === 0) {
      unknownFields.push(token);
      continue;
    }

    if (scope === 'company') {
      if (!PORTFOLIO_SUMMARY_COMPANY_SELECTABLE_FIELDS.has(field)) {
        unknownFields.push(token);
        continue;
      }
      companyFields.add(field);
      continue;
    }

    if (scope === 'summary') {
      if (!PORTFOLIO_SUMMARY_SUMMARY_SELECTABLE_FIELDS.has(field)) {
        unknownFields.push(token);
        continue;
      }
      summaryFields.add(field);
      continue;
    }

    const inCompany = PORTFOLIO_SUMMARY_COMPANY_SELECTABLE_FIELDS.has(field);
    const inSummary = PORTFOLIO_SUMMARY_SUMMARY_SELECTABLE_FIELDS.has(field);
    if (!inCompany && !inSummary) {
      unknownFields.push(token);
      continue;
    }
    if (inCompany) {
      companyFields.add(field);
    }
    if (inSummary) {
      summaryFields.add(field);
    }
  }

  if (unknownFields.length > 0) {
    throw new Error(`Unknown --select field(s): ${unknownFields.join(', ')}`);
  }

  return {
    companyFields,
    summaryFields,
    includeCompanies: companyFields.size > 0,
    includeSummary: summaryFields.size > 0,
  };
}

export function applyPortfolioSummarySelect(
  payload: Record<string, unknown>,
  selectSpec: PortfolioSummarySelectSpec,
): Record<string, unknown> {
  const pagination = asRecord(payload.pagination) ?? {};
  const companiesRaw = Array.isArray(payload.portfolioCompanies)
    ? payload.portfolioCompanies.filter(
        (row): row is Record<string, unknown> =>
          Boolean(row) && typeof row === 'object' && !Array.isArray(row),
      )
    : [];
  const summaryRaw = asRecord(payload.summary);

  const portfolioCompanies = selectSpec.includeCompanies
    ? companiesRaw
        .map((row) => pickFields(row, selectSpec.companyFields))
        .filter((row) => Object.keys(row).length > 0)
    : [];

  const projected: Record<string, unknown> = {
    pagination: {
      ...pagination,
      count: portfolioCompanies.length,
    },
    portfolioCompanies,
  };

  if (selectSpec.includeSummary && summaryRaw) {
    projected.summary = pickFields(summaryRaw, selectSpec.summaryFields);
  }

  return projected;
}

export function registerFundSummarySubcommand(fund: Command): void {
  fund
    .command('get-summary <fundId>')
    .description('Get fund summary and metrics')
    .option('--full', 'Include extended sectors and seat aggregation details', false)
    .option(
      '--select <fields>',
      'Comma-separated field projection. Use optional prefixes: portfolioCompanies.<field>, summary.<field>',
    )
    .option('--export-json [path]', 'Export portfolio summary payload to JSON file')
    .addHelpText(
      'after',
      `
Examples:
  $ vestberry fund get-summary abc123
  $ vestberry fund get-summary abc123 --full
  $ vestberry fund get-summary abc123 --select id,investmentName,irr
  $ vestberry fund get-summary abc123 --select portfolioCompanies.id,portfolioCompanies.irr,summary.irr
  $ vestberry fund get-summary abc123 --export-json
  $ vestberry fund get-summary abc123 --format table`,
    )
    .action(async function action(
      fundId: string,
      options: { full?: boolean; select?: string; exportJson?: string | boolean },
    ) {
      try {
        const { client, config } = getCommandContext(this);
        const rows = await listPortfolioSummary(
          client,
          {
            fundId,
            detailed: true,
            full: Boolean(options.full),
            includeLatestInvestmentRoundDate: false,
          },
          config.verbose,
        );
        const normalizedRows = rows
          .map((row) => ({ ...row }) as Record<string, unknown>)
          .filter((row) => !isPortfolioSummaryTotalRow(row));
        const totalRow = rows
          .map((row) => ({ ...row }) as Record<string, unknown>)
          .find(isPortfolioSummaryTotalRow);
        const dataRows = normalizedRows.filter(
          (row) => hasPortfolioSummaryId(row) && hasPortfolioCompanyId(row),
        );
        const envelope = createListEnvelope(dataRows);
        const payload = buildPortfolioSummaryJsonPayload(envelope, fundId, totalRow);
        const selectSpec = options.select
          ? parsePortfolioSummarySelect(options.select)
          : undefined;
        const projectedPayload = selectSpec
          ? applyPortfolioSummarySelect(payload, selectSpec)
          : payload;

        if (options.exportJson) {
          const defaultPath = buildDefaultJsonExportPath({
            type: 'fund-get-summary',
            idLabel: 'fund-id',
            id: fundId,
          });
          const requestedPath =
            typeof options.exportJson === 'string' ? options.exportJson : undefined;
          const filePath = await resolveJsonExportPath(requestedPath, defaultPath);
          await writeJsonExportFile(filePath, projectedPayload);
          process.stdout.write(`Saved fund summary JSON to ${filePath}\n`);
          return;
        }

        if (config.format === 'json') {
          printData(projectedPayload, config);
          return;
        }

        if (selectSpec) {
          const rows = Array.isArray(projectedPayload.portfolioCompanies)
            ? (projectedPayload.portfolioCompanies as Array<Record<string, unknown>>)
            : [];
          printListEnvelope(createListEnvelope(rows), config);
          return;
        }

        printListEnvelope(envelope, config);
      } catch (error) {
        handleCliError(error, Boolean((this.optsWithGlobals() as { verbose?: boolean }).verbose));
      }
    });
}
