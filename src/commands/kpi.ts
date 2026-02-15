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
