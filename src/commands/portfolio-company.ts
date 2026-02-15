import type { Command } from 'commander';
import { getPortfolioCompany } from '../api/endpoints/companies';
import { searchCompanies } from '../resolvers/company';
import { createListEnvelope } from '../utils/pagination';
import { printData, printListEnvelope } from '../utils/output';
import { getCommandContext, handleCliError } from './common';

export function registerPortfolioCompanyCommand(program: Command): void {
  const cmd = program.command('portfolio-company').description('Portfolio company commands');

  cmd
    .command('get <companyId>')
    .requiredOption('--fund-id <id>', 'Fund ID')
    .description('Get portfolio company by ID in fund context')
    .addHelpText(
      'after',
      `
Examples:
  $ vestberry portfolio-company get xyz789 --fund-id abc123`,
    )
    .action(async function action(companyId: string, options: { fundId: string }) {
      try {
        const { client, config } = getCommandContext(this);
        const row = await getPortfolioCompany(client, options.fundId, companyId, config.verbose);
        printData(row, config);
      } catch (error) {
        handleCliError(error, Boolean((this.optsWithGlobals() as { verbose?: boolean }).verbose));
      }
    });

  cmd
    .command('search')
    .requiredOption('--fund-id <id>', 'Fund ID')
    .requiredOption('--query <text>', 'Search text')
    .description('Search portfolio companies within a fund')
    .addHelpText(
      'after',
      `
Examples:
  $ vestberry portfolio-company search --fund-id abc123 --query "Tech Corp"
  $ vestberry portfolio-company search --fund-id abc123 --query "AI" --format table`,
    )
    .action(async function action(options: { fundId: string; query: string }) {
      try {
        const { client, config } = getCommandContext(this);
        const rows = await searchCompanies(client, options.fundId, options.query, config.verbose);
        printListEnvelope(createListEnvelope(rows), config);
      } catch (error) {
        handleCliError(error, Boolean((this.optsWithGlobals() as { verbose?: boolean }).verbose));
      }
    });
}
