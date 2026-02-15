import type { Command } from 'commander';
import { getFund, listFunds } from '../api/endpoints/funds';
import { listPortfolioCompanies } from '../api/endpoints/companies';
import { registerFundSummarySubcommand } from './portfolio-summary';
import { searchFunds } from '../resolvers/fund';
import { createListEnvelope } from '../utils/pagination';
import { printData, printListEnvelope } from '../utils/output';
import { getCommandContext, handleCliError } from './common';

export function registerFundCommand(program: Command): void {
  const fund = program.command('fund').description('Fund commands');

  fund
    .command('list')
    .description('List funds')
    .addHelpText(
      'after',
      `
Examples:
  $ vestberry fund list
  $ vestberry fund list --format table
  $ vestberry fund list --no-compact`,
    )
    .action(async function action() {
      try {
        const { client, config } = getCommandContext(this);
        const rows = await listFunds(client, undefined, config.verbose);
        printListEnvelope(createListEnvelope(rows), config);
      } catch (error) {
        handleCliError(error, Boolean((this.optsWithGlobals() as { verbose?: boolean }).verbose));
      }
    });

  fund
    .command('get <id>')
    .option('--full', 'Return full fund details', false)
    .description('Get fund by ID')
    .addHelpText(
      'after',
      `
Examples:
  $ vestberry fund get abc123
  $ vestberry fund get abc123 --format json
  $ vestberry fund get abc123 --full`,
    )
    .action(async function action(id: string, options: { full?: boolean }) {
      try {
        const { client, config } = getCommandContext(this);
        const row = await getFund(client, id, config.verbose, Boolean(options.full));
        printData(row, config);
      } catch (error) {
        handleCliError(error, Boolean((this.optsWithGlobals() as { verbose?: boolean }).verbose));
      }
    });

  fund
    .command('get-portco-list <fundId>')
    .description('List portfolio companies for a fund')
    .addHelpText(
      'after',
      `
Examples:
  $ vestberry fund get-portco-list abc123
  $ vestberry fund get-portco-list abc123 --format table`,
    )
    .action(async function action(fundId: string) {
      try {
        const { client, config } = getCommandContext(this);
        const rows = await listPortfolioCompanies(client, fundId, config.verbose);
        printListEnvelope(createListEnvelope(rows), config);
      } catch (error) {
        handleCliError(error, Boolean((this.optsWithGlobals() as { verbose?: boolean }).verbose));
      }
    });

  fund
    .command('search')
    .description('Search funds by display name')
    .requiredOption('--query <text>', 'Search text')
    .addHelpText(
      'after',
      `
Examples:
  $ vestberry fund search --query "Growth Fund"
  $ vestberry fund search --query "Seed" --format table`,
    )
    .action(async function action(options: { query: string }) {
      try {
        const { client, config } = getCommandContext(this);
        const rows = await searchFunds(client, options.query, config.verbose);
        printListEnvelope(createListEnvelope(rows), config);
      } catch (error) {
        handleCliError(error, Boolean((this.optsWithGlobals() as { verbose?: boolean }).verbose));
      }
    });

  registerFundSummarySubcommand(fund);
}
