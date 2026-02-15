import type { Command } from 'commander';
import { getFxRates, listCountries, listCurrencies } from '../api/endpoints/meta';
import { createListEnvelope } from '../utils/pagination';
import { printData, printListEnvelope } from '../utils/output';
import { getCommandContext, handleCliError } from './common';

export function registerMetaCommand(program: Command): void {
  const cmd = program.command('meta').description('Metadata commands');

  cmd
    .command('countries')
    .description('List countries')
    .action(async function action() {
      try {
        const { client, config } = getCommandContext(this);
        const rows = await listCountries(client, config.verbose);
        printListEnvelope(createListEnvelope(rows), config);
      } catch (error) {
        handleCliError(error, Boolean((this.optsWithGlobals() as { verbose?: boolean }).verbose));
      }
    });

  cmd
    .command('currencies')
    .description('List currencies')
    .action(async function action() {
      try {
        const { client, config } = getCommandContext(this);
        const rows = await listCurrencies(client, config.verbose);
        printListEnvelope(createListEnvelope(rows), config);
      } catch (error) {
        handleCliError(error, Boolean((this.optsWithGlobals() as { verbose?: boolean }).verbose));
      }
    });

  cmd
    .command('fx-rates')
    .requiredOption('--fund-id <id>', 'Fund ID')
    .option('--limit <n>', 'Limit', '20')
    .description('Get FX rates summary for fund')
    .action(async function action(options: { fundId: string; limit: string }) {
      try {
        const { client, config } = getCommandContext(this);
        const row = await getFxRates(client, options.fundId, Number(options.limit), config.verbose);
        printData(row, config);
      } catch (error) {
        handleCliError(error, Boolean((this.optsWithGlobals() as { verbose?: boolean }).verbose));
      }
    });
}
