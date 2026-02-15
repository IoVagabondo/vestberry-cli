import { describe, expect, it } from 'vitest';
import dotenv from 'dotenv';
import { createApiClient } from '../../src/api/client';
import { authTest } from '../../src/api/endpoints/auth';
import { getFund, listFunds } from '../../src/api/endpoints/funds';
import { listCountries, listCurrencies } from '../../src/api/endpoints/meta';
import { listInvestments } from '../../src/api/endpoints/metrics';

dotenv.config({ quiet: true });

const apiKey = process.env.VESTBERRY_API_KEY || process.env.VESTBERRY_API_TOKEN;
const baseUrl = process.env.VESTBERRY_API_BASE_URL || 'https://api.vestberry.com/graphql';
const LIVE_TIMEOUT_MS = 20_000;

const canRun = Boolean(apiKey);

describe.skipIf(!canRun)('live integration', () => {
  const client = createApiClient(baseUrl, apiKey as string);

  it('auth test succeeds', async () => {
    const response = await authTest(client);
    expect(response.__typename).toBeTruthy();
  }, LIVE_TIMEOUT_MS);

  it('funds query returns array', async () => {
    const funds = await listFunds(client);
    expect(Array.isArray(funds)).toBe(true);
    if (funds.length > 0) {
      expect(typeof funds[0]?.id).toBe('string');
      expect(typeof funds[0]?.displayName).toBe('string');
    }
  }, LIVE_TIMEOUT_MS);

  it('single fund lookup works for an existing fund id when available', async () => {
    const funds = await listFunds(client);
    if (funds.length === 0) {
      return;
    }

    const firstFund = funds[0];
    if (!firstFund?.id) {
      return;
    }

    const fund = await getFund(client, firstFund.id);
    expect(fund.id).toBe(firstFund.id);
    expect(typeof fund.displayName).toBe('string');
  }, LIVE_TIMEOUT_MS);

  it('countries query returns list-shaped metadata', async () => {
    const countries = await listCountries(client);
    expect(Array.isArray(countries)).toBe(true);
    if (countries.length > 0) {
      expect(typeof countries[0]?.id).toBe('string');
      expect(typeof countries[0]?.code).toBe('string');
      expect(typeof countries[0]?.displayName).toBe('string');
    }
  }, LIVE_TIMEOUT_MS);

  it('currencies query returns list-shaped metadata', async () => {
    const currencies = await listCurrencies(client);
    expect(Array.isArray(currencies)).toBe(true);
    if (currencies.length > 0) {
      expect(typeof currencies[0]?.id).toBe('string');
      expect(typeof currencies[0]?.code).toBe('string');
    }
  }, LIVE_TIMEOUT_MS);

  it('investments query returns array with stable object shape when rows exist', async () => {
    const investments = await listInvestments(client);
    expect(Array.isArray(investments)).toBe(true);
    if (investments.length > 0) {
      expect(typeof investments[0]?.id).toBe('string');
    }
  }, LIVE_TIMEOUT_MS);
});
