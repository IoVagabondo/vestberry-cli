import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseJsonInput, parseTextInput } from '../../src/utils/parse-json';

describe('parse-json utilities', () => {
  it('parses inline json', async () => {
    const result = await parseJsonInput<{ hello: string }>('{"hello":"world"}');
    expect(result).toEqual({ hello: 'world' });
  });

  it('parses @file json', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'vestberry-'));
    const file = path.join(dir, 'vars.json');
    await fs.writeFile(file, '{"a":1}', 'utf-8');

    const result = await parseJsonInput<{ a: number }>(`@${file}`);
    expect(result).toEqual({ a: 1 });
  });

  it('reads text from @file', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'vestberry-'));
    const file = path.join(dir, 'query.gql');
    await fs.writeFile(file, 'query { __typename }', 'utf-8');

    const result = await parseTextInput(`@${file}`);
    expect(result).toContain('__typename');
  });
});
