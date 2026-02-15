import type { Command } from 'commander';
import { listPortfolioSummary } from '../api/endpoints/metrics';
import { createListEnvelope } from '../utils/pagination';
import { printListEnvelope } from '../utils/output';
import { getCommandContext, handleCliError } from './common';
import {
  buildDefaultJsonExportPath,
  resolveJsonExportPath,
  writeJsonExportFile,
} from '../utils/json-export';

export function hasPortfolioSummaryId(row: Record<string, unknown>): boolean {
  return typeof row.id === 'string' && row.id.trim().length > 0;
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
          },
          config.verbose,
        );
        const normalizedRows = rows
          .map((row) => ({ ...row }) as Record<string, unknown>)
          .filter(hasPortfolioSummaryId);
        const envelope = createListEnvelope(normalizedRows);

        if (options.exportJson) {
          const defaultPath = buildDefaultJsonExportPath({
            type: 'portfolio-summary',
            idLabel: 'fund-id',
            id: fundId,
          });
          const requestedPath =
            typeof options.exportJson === 'string' ? options.exportJson : undefined;
          const filePath = await resolveJsonExportPath(requestedPath, defaultPath);
          await writeJsonExportFile(filePath, envelope);
          process.stdout.write(`Saved portfolio summary JSON to ${filePath}\n`);
          return;
        }

        printListEnvelope(envelope, config);
      } catch (error) {
        handleCliError(error, Boolean((this.optsWithGlobals() as { verbose?: boolean }).verbose));
      }
    });
}
