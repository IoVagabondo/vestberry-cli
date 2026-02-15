import type { Command } from 'commander';
import { listInvestments } from '../api/endpoints/metrics';
import { rankByQuery } from '../resolvers/search';
import { createListEnvelope } from '../utils/pagination';
import { printListEnvelope } from '../utils/output';
import { getCommandContext, handleCliError } from './common';

export function registerInvestmentCommand(program: Command): void {
  const cmd = program.command('investment').description('Investment commands');

  cmd
    .command('list')
    .description('List investments')
    .addHelpText(
      'after',
      `
Examples:
  $ vestberry investment list
  $ vestberry investment list --format table`,
    )
    .action(async function action() {
      try {
        const { client, config } = getCommandContext(this);
        const rows = await listInvestments(client, config.verbose);
        printListEnvelope(createListEnvelope(rows), config);
      } catch (error) {
        handleCliError(error, Boolean((this.optsWithGlobals() as { verbose?: boolean }).verbose));
      }
    });

  cmd
    .command('search')
    .requiredOption('--query <text>', 'Search query')
    .description('Search investments by company or fund name')
    .addHelpText(
      'after',
      `
Examples:
  $ vestberry investment search --query "Tech Corp"
  $ vestberry investment search --query "Growth Fund" --format table`,
    )
    .action(async function action(options: { query: string }) {
      try {
        const { client, config } = getCommandContext(this);
        const rows = await listInvestments(client, config.verbose);
        const ranked = rankByQuery(options.query, rows, (item) =>
          String(
            (item.portfolioCompany as { displayName?: string } | null)?.displayName ??
              (item.portfolioFund as { displayName?: string } | null)?.displayName ??
              '',
          ),
        );

        const result = ranked.map((entry) => ({ score: entry.score, ...entry.item }));
        printListEnvelope(createListEnvelope(result), config);
      } catch (error) {
        handleCliError(error, Boolean((this.optsWithGlobals() as { verbose?: boolean }).verbose));
      }
    });
}
