import type { Command } from 'commander';
import { listCaptableEvents } from '../api/endpoints/reports';
import { createListEnvelope } from '../utils/pagination';
import { printListEnvelope } from '../utils/output';
import { getCommandContext, handleCliError } from './common';

export function registerCaptableEventCommand(program: Command): void {
  program
    .command('captable-event')
    .description('Cap table event commands')
    .command('list')
    .requiredOption('--company-id <id>', 'Portfolio company ID')
    .option('--all', 'Return all available rows', false)
    .description('List cap table events for a company')
    .action(async function action(options: { companyId: string; all?: boolean }) {
      try {
        const { client, config } = getCommandContext(this);
        const rows = await listCaptableEvents(client, options.companyId, config.verbose);
        printListEnvelope(createListEnvelope(rows), config);
      } catch (error) {
        handleCliError(error, Boolean((this.optsWithGlobals() as { verbose?: boolean }).verbose));
      }
    });
}
