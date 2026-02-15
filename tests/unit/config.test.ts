import { afterEach, describe, expect, it } from 'vitest';
import { resolveRuntimeConfig } from '../../src/utils/config';
import { CliError } from '../../src/utils/errors';

const ORIGINAL_ENV = { ...process.env };

function resetEnv(): void {
  process.env = { ...ORIGINAL_ENV };
  delete process.env.VESTBERRY_API_KEY;
  delete process.env.VESTBERRY_API_TOKEN;
  delete process.env.VESTBERRY_API_BASE_URL;
}

afterEach(() => {
  resetEnv();
});

describe('runtime config resolution', () => {
  it('prefers explicit --api-key over environment variables', () => {
    process.env.VESTBERRY_API_KEY = 'env-key';
    process.env.VESTBERRY_API_TOKEN = 'legacy-token';

    const config = resolveRuntimeConfig({ apiKey: 'flag-key' });

    expect(config.apiKey).toBe('flag-key');
  });

  it('uses VESTBERRY_API_KEY before legacy token fallback', () => {
    process.env.VESTBERRY_API_KEY = 'env-key';
    process.env.VESTBERRY_API_TOKEN = 'legacy-token';

    const config = resolveRuntimeConfig({});

    expect(config.apiKey).toBe('env-key');
  });

  it('falls back to legacy VESTBERRY_API_TOKEN when key is missing', () => {
    process.env.VESTBERRY_API_TOKEN = 'legacy-token';

    const config = resolveRuntimeConfig({});

    expect(config.apiKey).toBe('legacy-token');
  });

  it('throws CONFIG_ERROR when no API key is provided', () => {
    expect(() => resolveRuntimeConfig({})).toThrowError(CliError);
    expect(() => resolveRuntimeConfig({})).toThrowError('Missing API key');
  });

  it('uses default base URL and output defaults', () => {
    process.env.VESTBERRY_API_KEY = 'env-key';

    const config = resolveRuntimeConfig({});

    expect(config.baseUrl).toBe('https://api.vestberry.com/graphql');
    expect(config.format).toBe('json');
    expect(config.compact).toBe(true);
    expect(config.verbose).toBe(false);
    expect(config.dryRun).toBe(false);
  });
});
