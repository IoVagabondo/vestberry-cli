import type { Command } from 'commander';
import { createApiClient } from '../api/client';
import { resolveRuntimeConfig, type RuntimeConfig } from '../utils/config';
import { CliError, toCliError } from '../utils/errors';
import { printData } from '../utils/output';

export interface CommandContext {
  config: RuntimeConfig;
  client: ReturnType<typeof createApiClient>;
}

export function getCommandContext(command: Command): CommandContext {
  const options = command.optsWithGlobals() as {
    apiKey?: string;
    format?: 'json' | 'table' | 'csv';
    compact?: boolean;
    verbose?: boolean;
    dryRun?: boolean;
  };

  const config = resolveRuntimeConfig(options);
  const client = createApiClient(config.baseUrl, config.apiKey);

  return { config, client };
}

export function handleCliError(error: unknown, verbose = false): never {
  const cliError = toCliError(error);
  const payload: {
    error: {
      code: string;
      message: string;
      details?: unknown;
    };
  } = {
    error: {
      code: cliError.code,
      message: cliError.message,
    },
  };

  if (verbose && cliError.details !== undefined) {
    payload.error.details = cliError.details;
  }

  process.stderr.write(`${JSON.stringify(payload, null, 2)}\n`);
  process.exit(1);
}

export function ensureMutationAllowed(
  options: { apply?: boolean; dryRun?: boolean },
  globalDryRun: boolean,
): {
  apply: boolean;
  effectiveDryRun: boolean;
} {
  const apply = options.apply ?? false;
  const effectiveDryRun = (options.dryRun ?? globalDryRun) || !apply;

  if (effectiveDryRun) {
    return { apply: false, effectiveDryRun: true };
  }

  if (!apply) {
    throw new CliError('DRY_RUN', 'Mutation blocked. Pass --apply to execute write operation.');
  }

  return { apply: true, effectiveDryRun: false };
}

export function printSuccess(data: unknown, command: Command): void {
  const { config } = getCommandContext(command);
  printData(data, config);
}
