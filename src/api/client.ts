import axios, { AxiosInstance, AxiosResponse } from 'axios';

const RETRY_CODES = new Set([429, 502, 503, 504]);

export interface RetryOptions {
  retries?: number;
  minDelayMs?: number;
  maxDelayMs?: number;
}

export function createApiClient(baseURL: string, apiKey: string): AxiosInstance {
  const client = axios.create({
    baseURL,
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: 30_000,
  });

  client.interceptors.request.use((config) => {
    config.headers.Authorization = `Bearer ${apiKey}`;
    return config;
  });

  return client;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function nextDelay(attempt: number, minDelay: number, maxDelay: number): number {
  const exp = minDelay * 2 ** attempt;
  const jitter = Math.floor(Math.random() * 150);
  return Math.min(exp + jitter, maxDelay);
}

export async function requestWithRetry<T>(
  call: () => Promise<AxiosResponse<T>>,
  options: RetryOptions = {},
): Promise<AxiosResponse<T>> {
  const retries = options.retries ?? 4;
  const minDelay = options.minDelayMs ?? 300;
  const maxDelay = options.maxDelayMs ?? 5_000;

  let attempt = 0;
  let lastError: unknown;

  while (attempt <= retries) {
    try {
      return await call();
    } catch (error: any) {
      const status = error?.response?.status as number | undefined;
      if (status === undefined || !RETRY_CODES.has(status) || attempt === retries) {
        throw error;
      }
      lastError = error;
      const delay = nextDelay(attempt, minDelay, maxDelay);
      await wait(delay);
      attempt += 1;
    }
  }

  throw lastError;
}
