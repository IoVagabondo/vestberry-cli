import type { Command } from 'commander';
import { getPortfolioCompanyLedgerDashboardDetails } from '../api/endpoints/portco-dashboard';
import { printData } from '../utils/output';
import { getCommandContext, handleCliError } from './common';

export function registerPortcoCommand(program: Command): void {
  const portco = program.command('portco').description('Portfolio company ledger commands');

  portco
    .command('dashboard <fundId> <portcoId>')
    .description('Get ledger dashboard details for a portfolio company in fund context')
    .addHelpText(
      'after',
      `
Examples:
  $ vestberry portco dashboard <fund-id> <portco-id>`,
    )
    .action(async function action(fundId: string, portcoId: string) {
      try {
        const { client, config } = getCommandContext(this);
        const row = await getPortfolioCompanyLedgerDashboardDetails(
          client,
          { fundId, portfolioCompanyId: portcoId },
          config.verbose,
        );
        printData(row, config);
      } catch (error) {
        handleCliError(error, Boolean((this.optsWithGlobals() as { verbose?: boolean }).verbose));
      }
    });
}
