#!/usr/bin/env node
import { Command } from 'commander';
import { registerAuthCommand } from './commands/auth';
import { registerRawCommand } from './commands/raw';
import { registerFundCommand } from './commands/fund';
import { registerPortfolioCompanyCommand } from './commands/portfolio-company';
import { registerInvestmentCommand } from './commands/investment';
import { registerRoundCommand } from './commands/round';
import { registerCaptableEventCommand } from './commands/captable-event';
import { registerStakeholderCommand } from './commands/stakeholder';
import { registerKpiCommand } from './commands/kpi';
import { registerNoteCommand } from './commands/note';
import { registerMetaCommand } from './commands/meta';
import { registerSchemaCommand } from './commands/schema';
import { registerIntentCommands } from './commands/intent';
import { registerPortcoCommand } from './commands/portco';

export function buildProgram(): Command {
  const program = new Command();

  program
    .name('vestberry')
    .description('Production-grade GraphQL CLI for Vestberry')
    .version('1.0.0')
    .option('--api-key <key>', 'Override API key (env fallback: VESTBERRY_API_KEY)')
    .option('--format <format>', 'Output format: json|table|csv', 'json')
    .option('--compact', 'Compact output mode', true)
    .option('--no-compact', 'Disable compact output mode')
    .option('--verbose', 'Verbose API and error output', false)
    .option('--dry-run', 'Global dry-run for mutation operations', false);

  registerAuthCommand(program);
  registerRawCommand(program);
  registerFundCommand(program);
  registerPortfolioCompanyCommand(program);
  registerInvestmentCommand(program);
  registerRoundCommand(program);
  registerCaptableEventCommand(program);
  registerStakeholderCommand(program);
  registerKpiCommand(program);
  registerNoteCommand(program);
  registerMetaCommand(program);
  registerSchemaCommand(program);
  registerPortcoCommand(program);
  registerIntentCommands(program);

  return program;
}

if (require.main === module) {
  buildProgram()
    .parseAsync(process.argv)
    .catch((error: unknown) => {
      process.stderr.write(`${(error as Error).message}\n`);
      process.exit(1);
    });
}
