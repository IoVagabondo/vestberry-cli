import { Command } from 'commander';
import { describe, expect, it } from 'vitest';
import {
  hasPortfolioSummaryId,
  registerPortfolioSummaryCommand,
} from '../../src/commands/portfolio-summary';

describe('portfolio-summary command', () => {
  it('exposes full and export-json options on get', () => {
    const program = new Command();
    registerPortfolioSummaryCommand(program);

    const root = program.commands.find((cmd) => cmd.name() === 'portfolio-summary');
    expect(root).toBeDefined();

    const getCmd = root?.commands.find((cmd) => cmd.name() === 'get');
    expect(getCmd).toBeDefined();

    const optionNames = (getCmd?.options ?? []).map((opt) => opt.long);
    expect(optionNames).toContain('--full');
    expect(optionNames).toContain('--export-json');
  });

  it('filters out rows without id', () => {
    expect(hasPortfolioSummaryId({ id: 'abc123' })).toBe(true);
    expect(hasPortfolioSummaryId({ id: '  abc123  ' })).toBe(true);
    expect(hasPortfolioSummaryId({ id: null })).toBe(false);
    expect(hasPortfolioSummaryId({ id: '' })).toBe(false);
    expect(hasPortfolioSummaryId({ id: '   ' })).toBe(false);
    expect(hasPortfolioSummaryId({})).toBe(false);
  });
});
