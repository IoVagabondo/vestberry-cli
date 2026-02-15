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

export function registerPortfolioSummaryCommand(program: Command): void {
  const summary = program.command('portfolio-summary').description('Portfolio summary and metrics');

  summary
    .command('get <fundId>')
    .option('--full', 'Include extended sectors and seat aggregation details', false)
    .option('--export-json [path]', 'Export portfolio summary payload to JSON file')
    .addHelpText(
      'after',
      `
Examples:
  $ vestberry portfolio-summary get abc123
  $ vestberry portfolio-summary get abc123 --full
  $ vestberry portfolio-summary get abc123 --export-json
  $ vestberry portfolio-summary get abc123 --format table`,
    )
    .action(async function action(
      fundId: string,
      options: { full?: boolean; exportJson?: string | boolean },
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

        if (options.exportJson) {
          const defaultPath = buildDefaultJsonExportPath({
            type: 'portfolio-summary',
            idLabel: 'fund-id',
            id: fundId,
          });
          const requestedPath =
            typeof options.exportJson === 'string' ? options.exportJson : undefined;
          const filePath = await resolveJsonExportPath(requestedPath, defaultPath);
          await writeJsonExportFile(filePath, payload);
          process.stdout.write(`Saved portfolio summary JSON to ${filePath}\n`);
          return;
        }

        if (config.format === 'json') {
          printData(payload, config);
          return;
        }

        printListEnvelope(envelope, config);
      } catch (error) {
        handleCliError(error, Boolean((this.optsWithGlobals() as { verbose?: boolean }).verbose));
      }
    });
}
