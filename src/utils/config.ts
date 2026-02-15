import dotenv from 'dotenv';
import { CliError } from './errors';

dotenv.config({ quiet: true });

export interface GlobalOptions {
  apiKey?: string;
  format?: 'json' | 'table' | 'csv';
  compact?: boolean;
  verbose?: boolean;
  dryRun?: boolean;
}

export interface RuntimeConfig {
  apiKey: string;
  baseUrl: string;
  format: 'json' | 'table' | 'csv';
  compact: boolean;
  verbose: boolean;
  dryRun: boolean;
}

export function resolveRuntimeConfig(options: GlobalOptions): RuntimeConfig {
  const apiKey =
    options.apiKey ?? process.env.VESTBERRY_API_KEY ?? process.env.VESTBERRY_API_TOKEN ?? '';
  const baseUrl = process.env.VESTBERRY_API_BASE_URL || 'https://api.vestberry.com/graphql';

  if (!apiKey) {
    throw new CliError(
      'CONFIG_ERROR',
      'Missing API key. Set VESTBERRY_API_KEY (or legacy VESTBERRY_API_TOKEN) or pass --api-key.',
    );
  }

  return {
    apiKey,
    baseUrl,
    format: options.format ?? 'json',
    compact: options.compact ?? true,
    verbose: options.verbose ?? false,
    dryRun: options.dryRun ?? false,
  };
}
