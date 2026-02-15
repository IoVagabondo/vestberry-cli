import type { Command } from 'commander';
import { listStakeholders } from '../api/endpoints/reports';
import { searchStakeholders } from '../resolvers/stakeholder';
import { createListEnvelope } from '../utils/pagination';
import { printListEnvelope } from '../utils/output';
import { getCommandContext, handleCliError } from './common';

export function registerStakeholderCommand(program: Command): void {
  const cmd = program.command('stakeholder').description('Stakeholder commands');

  cmd
    .command('list')
    .requiredOption('--company-id <id>', 'Portfolio company ID')
    .option('--all', 'Return all available rows', false)
    .description('List stakeholders')
    .action(async function action(options: { companyId: string; all?: boolean }) {
      try {
        const { client, config } = getCommandContext(this);
        const rows = await listStakeholders(client, options.companyId, config.verbose);
        printListEnvelope(createListEnvelope(rows), config);
      } catch (error) {
        handleCliError(error, Boolean((this.optsWithGlobals() as { verbose?: boolean }).verbose));
      }
    });

  cmd
    .command('search')
    .requiredOption('--company-id <id>', 'Portfolio company ID')
    .requiredOption('--query <text>', 'Search query')
    .description('Search stakeholders by name')
    .action(async function action(options: { companyId: string; query: string }) {
      try {
        const { client, config } = getCommandContext(this);
        const rows = await searchStakeholders(
          client,
          options.companyId,
          options.query,
          config.verbose,
        );
        printListEnvelope(createListEnvelope(rows), config);
      } catch (error) {
        handleCliError(error, Boolean((this.optsWithGlobals() as { verbose?: boolean }).verbose));
      }
    });
}
