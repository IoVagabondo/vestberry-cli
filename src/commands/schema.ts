import type { Command } from 'commander';
import { pullSchema } from '../api/introspection';
import { getCommandContext, handleCliError } from './common';
import { printData } from '../utils/output';

export function registerSchemaCommand(program: Command): void {
  const schema = program.command('schema').description('Schema discovery commands');

  schema
    .command('pull')
    .description('Fetch GraphQL introspection schema and store in .cache')
    .action(async function action() {
      try {
        const { client, config } = getCommandContext(this);
        const file = await pullSchema(client, config.verbose);
        printData({ ok: true, file }, config);
      } catch (error) {
        handleCliError(error, Boolean((this.optsWithGlobals() as { verbose?: boolean }).verbose));
      }
    });
}
