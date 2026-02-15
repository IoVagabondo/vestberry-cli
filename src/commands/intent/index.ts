import type { Command } from 'commander';
import { getFundManagement, listPortfolioSummary } from '../../api/endpoints/metrics';
import { listPortfolioCompanies } from '../../api/endpoints/companies';
import {
  getRoundDetail,
  listCaptableEvents,
  listRounds,
  listStakeholders,
} from '../../api/endpoints/reports';
import { listInvestments } from '../../api/endpoints/metrics';
import { resolveFundId } from '../../resolvers/fund';
import { resolveCompanyId } from '../../resolvers/company';
import { getFund } from '../../api/endpoints/funds';
import { createListEnvelope } from '../../utils/pagination';
import { printData, printListEnvelope } from '../../utils/output';
import { getCommandContext, handleCliError } from '../common';
import { parseTextInput } from '../../utils/parse-json';
import {
  buildDefaultJsonExportPath,
  resolveJsonExportPath,
  writeJsonExportFile,
} from '../../utils/json-export';
import { buildPortfolioOverviewPayload } from '../../utils/portfolio-overview';

function ensureDependencies(deps: Record<string, unknown>): void {
  for (const [name, value] of Object.entries(deps)) {
    if (typeof value !== 'function') {
      throw new Error(`Dependency missing: ${name}`);
    }
  }
}

function lastQuarterRange(now = new Date()): { start: string; end: string } {
  const quarter = Math.floor(now.getUTCMonth() / 3);
  const lastQuarter = (quarter + 3) % 4;
  const year = quarter === 0 ? now.getUTCFullYear() - 1 : now.getUTCFullYear();
  const startMonth = lastQuarter * 3;
  const start = new Date(Date.UTC(year, startMonth, 1));
  const end = new Date(Date.UTC(year, startMonth + 3, 0));

  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

function resolveCutOffDate(input?: string): string {
  if (!input) {
    return new Date().toISOString().slice(0, 10);
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(input)) {
    throw new Error('Invalid --cut-off-date format. Expected YYYY-MM-DD.');
  }

  const parsed = new Date(`${input}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error('Invalid --cut-off-date value. Expected a valid calendar date.');
  }
  const normalized = parsed.toISOString().slice(0, 10);
  if (normalized !== input) {
    throw new Error('Invalid --cut-off-date value. Expected a valid calendar date.');
  }

  return input;
}

export function registerIntentCommands(program: Command): void {
  const portfolio = program.command('portfolio').description('Portfolio intent commands');

  portfolio
    .command('overview')
    .requiredOption('--fund-id <id>', 'Fund ID')
    .option('--cut-off-date <date>', 'Cut-off date YYYY-MM-DD (default: today UTC)')
    .option('--export-json [path]', 'Export overview payload to JSON file')
    .description('Compose fund management + portfolio summary metrics')
    .addHelpText(
      'after',
      `
Examples:
  $ vestberry portfolio overview --fund-id abc123
  $ vestberry portfolio overview --fund-id abc123 --cut-off-date 2025-12-31
  $ vestberry portfolio overview --fund-id abc123 --format table
  $ vestberry portfolio overview --fund-id abc123 --export-json`,
    )
    .action(async function action(options: {
      fundId: string;
      cutOffDate?: string;
      exportJson?: string | boolean;
    }) {
      try {
        ensureDependencies({ getFundManagement, listPortfolioSummary, getFund });
        const { client, config } = getCommandContext(this);
        const cutOffDate = resolveCutOffDate(options.cutOffDate);
        const [fundManagement, summary, fund] = await Promise.all([
          getFundManagement(client, options.fundId, cutOffDate, config.verbose),
          listPortfolioSummary(
            client,
            { fundId: options.fundId, until: cutOffDate, detailed: true },
            config.verbose,
          ),
          getFund(client, options.fundId, config.verbose),
        ]);

        const payload = buildPortfolioOverviewPayload({
          fundId: options.fundId,
          fundName: fund.displayName,
          cutOffDate,
          fundManagement,
          summary,
        });
        if (options.exportJson) {
          const defaultPath = buildDefaultJsonExportPath({
            type: 'portfolio-overview',
            idLabel: 'fund-id',
            id: options.fundId,
          });
          const requestedPath =
            typeof options.exportJson === 'string' ? options.exportJson : undefined;
          const filePath = await resolveJsonExportPath(requestedPath, defaultPath);
          await writeJsonExportFile(filePath, payload);
          process.stdout.write(`Saved portfolio overview JSON to ${filePath}\n`);
          return;
        }

        printData(payload, config);
      } catch (error) {
        handleCliError(error, Boolean((this.optsWithGlobals() as { verbose?: boolean }).verbose));
      }
    });

  portfolio
    .command('companies')
    .requiredOption('--fund-id <id>', 'Fund ID')
    .description('List portfolio companies for fund')
    .addHelpText(
      'after',
      `
Examples:
  $ vestberry portfolio companies --fund-id abc123
  $ vestberry portfolio companies --fund-id abc123 --format table`,
    )
    .action(async function action(options: { fundId: string }) {
      try {
        ensureDependencies({ listPortfolioCompanies });
        const { client, config } = getCommandContext(this);
        const companies = await listPortfolioCompanies(client, options.fundId, config.verbose);
        printListEnvelope(createListEnvelope(companies), config);
      } catch (error) {
        handleCliError(error, Boolean((this.optsWithGlobals() as { verbose?: boolean }).verbose));
      }
    });

  program
    .command('company')
    .description('Company intent commands')
    .command('dossier')
    .requiredOption('--company-id <id>', 'Portfolio company ID')
    .option('--fund-id <id>', 'Fund ID (optional if unique from investments)')
    .option('--full', 'Include full fan-out details', false)
    .description('Compose company profile with summary, rounds, cap table and stakeholders')
    .addHelpText(
      'after',
      `
Examples:
  $ vestberry company dossier --company-id xyz789 --fund-id abc123
  $ vestberry company dossier --company-id xyz789 --full
  $ vestberry company dossier --company-id xyz789 --fund-id abc123 --full --format json`,
    )
    .action(async function action(options: { companyId: string; fundId?: string; full?: boolean }) {
      try {
        ensureDependencies({
          listPortfolioSummary,
          listRounds,
          listCaptableEvents,
          listStakeholders,
        });
        const { client, config } = getCommandContext(this);

        let fundId = options.fundId;
        if (!fundId) {
          const investments = await listInvestments(client, config.verbose);
          const matches = investments.filter(
            (row) =>
              (row.portfolioCompany as { id?: string } | null)?.id === options.companyId &&
              Boolean((row.fund as { id?: string } | null)?.id),
          );

          const uniqueFundIds = [
            ...new Set(matches.map((row) => (row.fund as { id?: string })?.id)),
          ].filter((id): id is string => Boolean(id));

          if (uniqueFundIds.length !== 1) {
            throw new Error('Unable to infer unique fund for company. Pass --fund-id explicitly.');
          }

          [fundId] = uniqueFundIds;
        }
        const resolvedFundId = fundId as string;

        const until = new Date().toISOString().slice(0, 10);
        const [summary, rounds, captable, stakeholders] = await Promise.all([
          listPortfolioSummary(
            client,
            { fundId: resolvedFundId, companyId: options.companyId, until, detailed: true },
            config.verbose,
          ),
          listRounds(client, options.companyId, until, config.verbose),
          listCaptableEvents(client, options.companyId, config.verbose),
          listStakeholders(client, options.companyId, config.verbose),
        ]);

        let roundDetails: Array<Record<string, unknown>> = [];
        if (options.full) {
          roundDetails = await Promise.all(
            rounds
              .map((r) => String(r.id ?? ''))
              .filter((id) => id.length > 0)
              .map((id) => getRoundDetail(client, id, config.verbose)),
          );
        }

        printData(
          {
            fundId: resolvedFundId,
            companyId: options.companyId,
            until,
            summary,
            rounds,
            captable,
            stakeholders,
            roundDetails,
          },
          config,
        );
      } catch (error) {
        handleCliError(error, Boolean((this.optsWithGlobals() as { verbose?: boolean }).verbose));
      }
    });

  const rounds = program.command('rounds').description('Rounds intent commands');

  rounds
    .command('last-quarter')
    .requiredOption('--fund-id <id>', 'Fund ID')
    .description('List financing rounds in last quarter for fund companies')
    .addHelpText(
      'after',
      `
Examples:
  $ vestberry rounds last-quarter --fund-id abc123
  $ vestberry rounds last-quarter --fund-id abc123 --format table`,
    )
    .action(async function action(options: { fundId: string }) {
      try {
        ensureDependencies({ listPortfolioCompanies, listRounds });
        const { client, config } = getCommandContext(this);
        const window = lastQuarterRange();
        const companies = await listPortfolioCompanies(client, options.fundId, config.verbose);
        const roundsByCompany = await Promise.all(
          companies.map(async (company) => ({
            company,
            rounds: await listRounds(client, company.id, window.end, config.verbose),
          })),
        );

        const results = roundsByCompany.flatMap(({ company, rounds: companyRounds }) =>
          companyRounds
            .filter((round) => {
              const date = String(round.eventDate ?? '');
              return date >= window.start && date <= window.end;
            })
            .map((round) => ({
              companyId: company.id,
              companyName: company.displayName,
              ...round,
            })),
        );

        printData({ window, count: results.length, rounds: results }, config);
      } catch (error) {
        handleCliError(error, Boolean((this.optsWithGlobals() as { verbose?: boolean }).verbose));
      }
    });

  const invested = program.command('invested').description('Investment intent commands');

  invested
    .command('total')
    .requiredOption('--company <name>', 'Company name')
    .requiredOption('--fund <name>', 'Fund name')
    .option('--select-first', 'Select top search match when ambiguous', false)
    .description('Compute total invested amount in company')
    .addHelpText(
      'after',
      `
Examples:
  $ vestberry invested total --company "Tech Corp" --fund "Growth Fund"
  $ vestberry invested total --company "AI Startup" --fund "Seed Fund" --select-first
  $ vestberry invested total --company "Company" --fund "Fund" --format json`,
    )
    .action(async function action(options: {
      company: string;
      fund: string;
      selectFirst?: boolean;
    }) {
      try {
        ensureDependencies({ resolveFundId, resolveCompanyId, listPortfolioSummary });
        const { client, config } = getCommandContext(this);
        const fundId = await resolveFundId(
          client,
          options.fund,
          Boolean(options.selectFirst),
          config.verbose,
        );
        const companyId = await resolveCompanyId(
          client,
          fundId,
          options.company,
          Boolean(options.selectFirst),
          config.verbose,
        );

        const until = new Date().toISOString().slice(0, 10);
        const summary = await listPortfolioSummary(
          client,
          { fundId, companyId, until, detailed: true },
          config.verbose,
        );

        const primary = summary.find((row) => row.portfolioCompany?.id === companyId) ?? summary[0];

        printData(
          {
            fundId,
            companyId,
            until,
            totalOriginalCost: primary?.dashboardDetails?.['totalOriginalCost'] ?? null,
            investedEquity: primary?.dashboardDetails?.['investedEquity'] ?? null,
            investedDebt: primary?.dashboardDetails?.['investedDebt'] ?? null,
            investedFunds: primary?.dashboardDetails?.['investedFunds'] ?? null,
            source: primary,
          },
          config,
        );
      } catch (error) {
        handleCliError(error, Boolean((this.optsWithGlobals() as { verbose?: boolean }).verbose));
      }
    });

  const ingest = program.command('ingest').description('Ingestion intent commands');

  ingest
    .command('legal-docs')
    .requiredOption('--file <path|@file>', 'Path to legal docs text/summary')
    .option('--apply', 'Execute writes (not implemented yet)', false)
    .description('Build staged dry-run ingestion plan for legal docs')
    .addHelpText(
      'after',
      `
Examples:
  $ vestberry ingest legal-docs --file @legal-summary.txt
  $ vestberry ingest legal-docs --file @docs.json`,
    )
    .action(async function action(options: { file: string; apply?: boolean }) {
      try {
        const { config } = getCommandContext(this);
        const content = await parseTextInput(
          options.file.startsWith('@') ? options.file : `@${options.file}`,
        );
        if (options.apply) {
          throw new Error(
            'Write execution for legal-docs is not implemented yet. Use dry-run planning only.',
          );
        }
        printData(
          {
            dryRun: true,
            stages: ['extract', 'validate', 'diff', 'apply', 'verify'],
            extractedPreview: content.slice(0, 1000),
            note: 'This command currently generates a plan only. Apply phase is deferred.',
          },
          config,
        );
      } catch (error) {
        handleCliError(error, Boolean((this.optsWithGlobals() as { verbose?: boolean }).verbose));
      }
    });
}
