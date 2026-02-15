import type { Command } from 'commander';
import { listPortfolioSummary } from '../api/endpoints/metrics';
import { createListEnvelope } from '../utils/pagination';
import { printListEnvelope } from '../utils/output';
import { getCommandContext, handleCliError } from './common';

export function registerPortfolioSummaryCommand(program: Command): void {
  program
    .command('portfolio-summary')
    .description('Portfolio summary and metrics')
    .command('list')
    .requiredOption('--fund-id <id>', 'Fund ID')
    .option('--company-id <id>', 'Portfolio company ID filter')
    .option('--until <date>', 'Cut-off date YYYY-MM-DD')
    .option('--detailed', 'Include detailed summary rows', false)
    .addHelpText(
      'after',
      `
Examples:
  $ vestberry portfolio-summary list --fund-id abc123
  $ vestberry portfolio-summary list --fund-id abc123 --until 2024-12-31
  $ vestberry portfolio-summary list --fund-id abc123 --company-id xyz789 --detailed
  $ vestberry portfolio-summary list --fund-id abc123 --detailed --format table`,
    )
    .action(async function action(options: {
      fundId: string;
      companyId?: string;
      until?: string;
      detailed?: boolean;
    }) {
      try {
        const { client, config } = getCommandContext(this);
        const rows = await listPortfolioSummary(
          client,
          {
            fundId: options.fundId,
            ...(options.companyId !== undefined ? { companyId: options.companyId } : {}),
            ...(options.until !== undefined ? { until: options.until } : {}),
            ...(options.detailed !== undefined ? { detailed: options.detailed } : {}),
          },
          config.verbose,
        );
        const normalizedRows = rows.map((row) => ({ ...row })) as Array<Record<string, unknown>>;
        printListEnvelope(createListEnvelope(normalizedRows), config);
      } catch (error) {
        handleCliError(error, Boolean((this.optsWithGlobals() as { verbose?: boolean }).verbose));
      }
    });
}
