export type CliErrorCode =
  | 'CONFIG_ERROR'
  | 'VALIDATION_ERROR'
  | 'GRAPHQL_ERROR'
  | 'HTTP_ERROR'
  | 'NETWORK_ERROR'
  | 'AMBIGUOUS_RESULT'
  | 'NOT_FOUND'
  | 'DRY_RUN'
  | 'DEPENDENCY_ERROR';

export class CliError extends Error {
  readonly code: CliErrorCode;
  readonly details?: unknown;

  constructor(code: CliErrorCode, message: string, details?: unknown) {
    super(message);
    this.code = code;
    this.details = details;
  }
}

export interface MappedGraphQLError {
  message: string;
  path?: ReadonlyArray<string | number>;
  extensions?: Record<string, unknown>;
}

export function toCliError(error: unknown): CliError {
  if (error instanceof CliError) {
    return error;
  }

  if (error instanceof Error) {
    return new CliError('HTTP_ERROR', error.message);
  }

  return new CliError('HTTP_ERROR', 'Unknown error', error);
}
