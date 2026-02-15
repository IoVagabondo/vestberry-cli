import type { Command } from 'commander';
import { authTest } from '../api/endpoints/auth';
import { getCommandContext, handleCliError } from './common';
import { printData } from '../utils/output';

export function registerAuthCommand(program: Command): void {
  const auth = program.command('auth').description('Authentication commands');

  auth
    .command('test')
    .description('Verify token and connectivity')
    .addHelpText(
      'after',
      `
Examples:
  $ vestberry auth test
  $ vestberry auth test --verbose`,
    )
    .action(async function action() {
      try {
        const { client, config } = getCommandContext(this);
        const data = await authTest(client, config.verbose);
        printData({ ok: true, ...data }, config);
      } catch (error) {
        handleCliError(error, Boolean((this.optsWithGlobals() as { verbose?: boolean }).verbose));
      }
    });
}
