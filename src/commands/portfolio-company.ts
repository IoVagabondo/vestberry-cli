import type { Command } from 'commander';
import { getPortfolioCompany, listPortfolioCompanies } from '../api/endpoints/companies';
import { searchCompanies } from '../resolvers/company';
import { createListEnvelope } from '../utils/pagination';
import { printData, printListEnvelope } from '../utils/output';
import { getCommandContext, handleCliError } from './common';

export function registerPortfolioCompanyCommand(program: Command): void {
  const cmd = program.command('portfolio-company').description('Portfolio company commands');

  cmd
    .command('list')
    .requiredOption('--fund-id <id>', 'Fund ID')
    .option('--all', 'Return all available rows', false)
    .description('List portfolio companies for a fund')
    .action(async function action(options: { fundId: string; all?: boolean }) {
      try {
        const { client, config } = getCommandContext(this);
        const rows = await listPortfolioCompanies(client, options.fundId, config.verbose);
        printListEnvelope(createListEnvelope(rows), config);
      } catch (error) {
        handleCliError(error, Boolean((this.optsWithGlobals() as { verbose?: boolean }).verbose));
      }
    });

  cmd
    .command('get <companyId>')
    .requiredOption('--fund-id <id>', 'Fund ID')
    .description('Get portfolio company by ID in fund context')
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
