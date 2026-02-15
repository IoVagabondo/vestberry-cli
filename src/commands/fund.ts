import type { Command } from 'commander';
import { getFund, listFunds } from '../api/endpoints/funds';
import { searchFunds } from '../resolvers/fund';
import { createListEnvelope } from '../utils/pagination';
import { printData, printListEnvelope } from '../utils/output';
import { getCommandContext, handleCliError } from './common';

export function registerFundCommand(program: Command): void {
  const fund = program.command('fund').description('Fund commands');

  fund
    .command('list')
    .description('List funds')
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
    .description('Get fund by ID')
    .action(async function action(id: string) {
      try {
        const { client, config } = getCommandContext(this);
        const row = await getFund(client, id, config.verbose);
        printData(row, config);
      } catch (error) {
        handleCliError(error, Boolean((this.optsWithGlobals() as { verbose?: boolean }).verbose));
      }
    });

  fund
    .command('search')
    .description('Search funds by display name')
    .requiredOption('--query <text>', 'Search text')
    .action(async function action(options: { query: string }) {
      try {
        const { client, config } = getCommandContext(this);
        const rows = await searchFunds(client, options.query, config.verbose);
        printListEnvelope(createListEnvelope(rows), config);
      } catch (error) {
        handleCliError(error, Boolean((this.optsWithGlobals() as { verbose?: boolean }).verbose));
      }
    });
}
