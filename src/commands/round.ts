import type { Command } from 'commander';
import { getRoundDetail, listRounds } from '../api/endpoints/reports';
import { searchRounds } from '../resolvers/round';
import { createListEnvelope } from '../utils/pagination';
import { printData, printListEnvelope } from '../utils/output';
import { getCommandContext, handleCliError } from './common';

export function registerRoundCommand(program: Command): void {
  const cmd = program.command('round').description('Financing round commands');

  cmd
    .command('list')
    .requiredOption('--company-id <id>', 'Portfolio company ID')
    .option('--until <date>', 'Cut-off date YYYY-MM-DD')
    .description('List financing rounds for a company')
    .addHelpText(
      'after',
      `
Examples:
  $ vestberry round list --company-id xyz789
  $ vestberry round list --company-id xyz789 --until 2024-12-31
  $ vestberry round list --company-id xyz789 --format table`,
    )
    .action(async function action(options: { companyId: string; until?: string }) {
      try {
        const { client, config } = getCommandContext(this);
        const rows = await listRounds(client, options.companyId, options.until, config.verbose);
        printListEnvelope(createListEnvelope(rows), config);
      } catch (error) {
        handleCliError(error, Boolean((this.optsWithGlobals() as { verbose?: boolean }).verbose));
      }
    });

  cmd
    .command('get <roundId>')
    .description('Get financing round detail by ID')
    .addHelpText(
      'after',
      `
Examples:
  $ vestberry round get round123`,
    )
    .action(async function action(roundId: string) {
      try {
        const { client, config } = getCommandContext(this);
        const row = await getRoundDetail(client, roundId, config.verbose);
        printData(row, config);
      } catch (error) {
        handleCliError(error, Boolean((this.optsWithGlobals() as { verbose?: boolean }).verbose));
      }
    });

  cmd
    .command('search')
    .requiredOption('--company-id <id>', 'Portfolio company ID')
    .requiredOption('--query <text>', 'Search query')
    .option('--until <date>', 'Cut-off date YYYY-MM-DD')
    .description('Search financing rounds by name')
    .addHelpText(
      'after',
      `
Examples:
  $ vestberry round search --company-id xyz789 --query "Series A"
  $ vestberry round search --company-id xyz789 --query "Seed" --until 2024-12-31`,
    )
    .action(async function action(options: { companyId: string; query: string; until?: string }) {
      try {
        const { client, config } = getCommandContext(this);
        const rows = await searchRounds(
          client,
          options.companyId,
          options.query,
          options.until,
          config.verbose,
        );
        printListEnvelope(createListEnvelope(rows), config);
      } catch (error) {
        handleCliError(error, Boolean((this.optsWithGlobals() as { verbose?: boolean }).verbose));
      }
    });
}
