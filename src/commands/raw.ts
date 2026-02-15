import type { Command } from 'commander';
import { runRawGraphQL, runRawHttp } from '../api/endpoints/raw';
import { getCommandContext, handleCliError } from './common';
import { parseJsonInput, parseTextInput } from '../utils/parse-json';
import { printData } from '../utils/output';

export function registerRawCommand(program: Command): void {
  const raw = program.command('raw').description('Raw API commands');

  raw
    .command('gql')
    .description('Execute raw GraphQL query')
    .requiredOption('--query <gql|@file>', 'GraphQL query string or @file')
    .option('--variables <json|@file>', 'Variables JSON or @file')
    .option('--operation <name>', 'Operation name')
    .action(async function action(options: {
      query: string;
      variables?: string;
      operation?: string;
    }) {
      try {
        const { client, config } = getCommandContext(this);
        const query = await parseTextInput(options.query);
        const variables = await parseJsonInput<Record<string, unknown>>(options.variables);
        const data = await runRawGraphQL(
          client,
          query,
          variables,
          options.operation,
          config.verbose,
        );
        printData(data, config);
      } catch (error) {
        handleCliError(error, Boolean((this.optsWithGlobals() as { verbose?: boolean }).verbose));
      }
    });

  raw
    .command('http <method> <path>')
    .description('Execute raw HTTP request against API base URL')
    .option('--data <json|@file>', 'Request body JSON')
    .option('--query <json|@file>', 'Query params JSON')
    .action(async function action(
      method: string,
      path: string,
      options: { data?: string; query?: string },
    ) {
      try {
        const { client, config } = getCommandContext(this);
        const data = await parseJsonInput(options.data);
        const params = await parseJsonInput<Record<string, unknown>>(options.query);
        const result = await runRawHttp(client, method, path, data, params);
        printData(result, config);
      } catch (error) {
        handleCliError(error, Boolean((this.optsWithGlobals() as { verbose?: boolean }).verbose));
      }
    });
}
