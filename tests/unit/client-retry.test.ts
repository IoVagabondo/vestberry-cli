import type { AxiosResponse } from 'axios';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { requestWithRetry } from '../../src/api/client';

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('requestWithRetry', () => {
  it('retries transient HTTP failures and eventually succeeds', async () => {
    vi.useFakeTimers();
    vi.spyOn(Math, 'random').mockReturnValue(0);

    const response = { data: { ok: true } } as AxiosResponse<{ ok: boolean }>;
    const call = vi
      .fn<() => Promise<AxiosResponse<{ ok: boolean }>>>()
      .mockRejectedValueOnce({ response: { status: 503 } })
      .mockRejectedValueOnce({ response: { status: 429 } })
      .mockResolvedValueOnce(response);

    const pending = requestWithRetry(call, { retries: 3, minDelayMs: 10, maxDelayMs: 10 });
    await vi.runAllTimersAsync();
    const result = await pending;

    expect(result.data.ok).toBe(true);
    expect(call).toHaveBeenCalledTimes(3);
  });

  it('does not retry non-retryable HTTP status codes', async () => {
    const error = { response: { status: 400 } };
    const call = vi.fn<() => Promise<AxiosResponse<unknown>>>().mockRejectedValue(error);

    await expect(requestWithRetry(call, { retries: 3 })).rejects.toEqual(error);
    expect(call).toHaveBeenCalledTimes(1);
  });

  it('fails after exhausting retries for transient failures', async () => {
    vi.useFakeTimers();
    vi.spyOn(Math, 'random').mockReturnValue(0);

    const error = { response: { status: 503 } };
    const call = vi.fn<() => Promise<AxiosResponse<unknown>>>().mockRejectedValue(error);

    const pending = requestWithRetry(call, { retries: 2, minDelayMs: 10, maxDelayMs: 10 });
    const rejection = expect(pending).rejects.toEqual(error);
    await vi.runAllTimersAsync();

    await rejection;
    expect(call).toHaveBeenCalledTimes(3);
  });
});
