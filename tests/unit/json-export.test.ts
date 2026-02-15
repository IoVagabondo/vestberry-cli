import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  buildDefaultJsonExportPath,
  createTimestampPrefix,
  resolveJsonExportPath,
  writeJsonExportFile,
} from '../../src/utils/json-export';

describe('json export utilities', () => {
  it('creates a stable timestamp prefix', () => {
    const value = createTimestampPrefix(new Date('2026-02-15T19:01:29.321Z'));
    expect(value).toBe('20260215T190129Z');
  });

  it('builds default export path in output folder with type and id', () => {
    const result = buildDefaultJsonExportPath({
      type: 'portfolio-overview',
      idLabel: 'fund-id',
      id: '0c40f1ba-9da6-11ee-9a89-03a079508684',
      now: new Date('2026-02-15T19:01:29.321Z'),
      baseDir: '/repo',
    });

    expect(result).toBe(
      '/repo/output/20260215T190129Z-portfolio-overview-fund-id-0c40f1ba-9da6-11ee-9a89-03a079508684.json',
    );
  });

  it('resolves directory targets and appends json extension for file targets', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'vestberry-export-'));
    const defaultPath = path.join(dir, 'output', 'default-name.json');

    const inDir = await resolveJsonExportPath(dir, defaultPath);
    expect(inDir).toBe(path.join(dir, 'default-name.json'));

    const noExt = await resolveJsonExportPath(path.join(dir, 'custom-name'), defaultPath);
    expect(noExt).toBe(path.join(dir, 'custom-name.json'));
  });

  it('writes pretty json files and creates parent folders', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'vestberry-export-'));
    const file = path.join(dir, 'nested', 'overview.json');
    await writeJsonExportFile(file, { ok: true, count: 2 });

    const content = await fs.readFile(file, 'utf-8');
    expect(content).toContain('"ok": true');
    expect(content.endsWith('\n')).toBe(true);
  });
});
