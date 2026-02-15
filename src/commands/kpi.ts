import type { Command } from 'commander';
import {
  getKpiDefinitions,
  getKpiOverview,
  getKpiReports,
  getKpiValues,
} from '../api/endpoints/metrics';
import { collectAllOffset, createListEnvelope } from '../utils/pagination';
import { printListEnvelope } from '../utils/output';
import { getCommandContext, handleCliError } from './common';

export function registerKpiCommand(program: Command): void {
  const cmd = program.command('kpi').description('KPI and report commands');

  cmd
    .command('overview')
    .requiredOption('--fund-id <id>', 'Fund ID')
    .description('Get KPI overview for fund')
    .addHelpText(
      'after',
      `
Examples:
  $ vestberry kpi overview --fund-id abc123
  $ vestberry kpi overview --fund-id abc123 --format table`,
    )
    .action(async function action(options: { fundId: string }) {
      try {
        const { client, config } = getCommandContext(this);
        const rows = await getKpiOverview(client, options.fundId, config.verbose);
        printListEnvelope(createListEnvelope(rows), config);
      } catch (error) {
        handleCliError(error, Boolean((this.optsWithGlobals() as { verbose?: boolean }).verbose));
      }
    });

  cmd
    .command('definitions')
    .requiredOption('--company-id <id>', 'Portfolio company ID')
    .description('Get KPI definitions for company')
    .addHelpText(
      'after',
      `
Examples:
  $ vestberry kpi definitions --company-id xyz789
  $ vestberry kpi definitions --company-id xyz789 --format table`,
    )
    .action(async function action(options: { companyId: string }) {
      try {
        const { client, config } = getCommandContext(this);
        const rows = await getKpiDefinitions(client, options.companyId, config.verbose);
        printListEnvelope(createListEnvelope(rows), config);
      } catch (error) {
        handleCliError(error, Boolean((this.optsWithGlobals() as { verbose?: boolean }).verbose));
      }
    });

  cmd
    .command('reports')
    .requiredOption('--company-id <id>', 'Portfolio company ID')
    .option('--limit <n>', 'Limit', '20')
    .option('--offset <n>', 'Offset', '0')
    .option('--all', 'Auto-page all rows', false)
    .description('List KPI reports for company')
    .addHelpText(
      'after',
      `
Examples:
  $ vestberry kpi reports --company-id xyz789
  $ vestberry kpi reports --company-id xyz789 --limit 50
  $ vestberry kpi reports --company-id xyz789 --all
  $ vestberry kpi reports --company-id xyz789 --offset 20 --limit 10`,
    )
    .action(async function action(options: {
      companyId: string;
      limit: string;
      offset: string;
      all?: boolean;
    }) {
      try {
        const { client, config } = getCommandContext(this);
        const limit = Number(options.limit);
        const offset = Number(options.offset);

        if (options.all) {
          const envelope = await collectAllOffset(async (pageOffset) => {
            const pageRows = await getKpiReports(
              client,
              options.companyId,
              limit,
              pageOffset,
              config.verbose,
            );
            return createListEnvelope(pageRows, {
              mode: 'offset',
              limit,
              offset: pageOffset,
              count: pageRows.length,
              hasNextPage: pageRows.length >= limit,
            });
          }, limit);
          printListEnvelope(envelope, config);
          return;
        }

        const rows = await getKpiReports(client, options.companyId, limit, offset, config.verbose);
        printListEnvelope(
          createListEnvelope(rows, {
            mode: 'offset',
            limit,
            offset,
            count: rows.length,
            hasNextPage: rows.length >= limit,
          }),
          config,
        );
      } catch (error) {
        handleCliError(error, Boolean((this.optsWithGlobals() as { verbose?: boolean }).verbose));
      }
    });

  cmd
    .command('values')
    .requiredOption('--company-id <id>', 'Portfolio company ID')
    .option('--include-empty', 'Include empty KPIs', false)
    .option('--include-draft', 'Include draft values', false)
    .description('List KPI values for company')
    .addHelpText(
      'after',
      `
Examples:
  $ vestberry kpi values --company-id xyz789
  $ vestberry kpi values --company-id xyz789 --include-empty
  $ vestberry kpi values --company-id xyz789 --include-draft --format table`,
    )
    .action(async function action(options: {
      companyId: string;
      includeEmpty?: boolean;
      includeDraft?: boolean;
    }) {
      try {
        const { client, config } = getCommandContext(this);
        const rows = await getKpiValues(
          client,
          options.companyId,
          Boolean(options.includeEmpty),
          Boolean(options.includeDraft),
          config.verbose,
        );
        printListEnvelope(createListEnvelope(rows), config);
      } catch (error) {
        handleCliError(error, Boolean((this.optsWithGlobals() as { verbose?: boolean }).verbose));
      }
    });
}
