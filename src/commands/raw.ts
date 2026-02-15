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
    .addHelpText(
      'after',
      `
Examples:
  $ vestberry raw gql --query 'query { funds { id displayName } }'
  $ vestberry raw gql --query @query.graphql
  $ vestberry raw gql --query @query.graphql --variables '{"fundId":"abc123"}'
  $ vestberry raw gql --query @introspect.graphql --operation IntrospectionQuery`,
    )
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
    .addHelpText(
      'after',
      `
Examples:
  $ vestberry raw http GET /api/health
  $ vestberry raw http POST /graphql --data '{"query":"{ funds { id } }"}'
  $ vestberry raw http GET /api/funds --query '{"limit":10}'`,
    )
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
