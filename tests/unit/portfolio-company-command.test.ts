import { Command } from 'commander';
import { describe, expect, it } from 'vitest';
import { registerPortfolioCompanyCommand } from '../../src/commands/portfolio-company';

describe('portfolio-company command', () => {
  it('keeps get/search and drops list', () => {
    const program = new Command();
    registerPortfolioCompanyCommand(program);

    const root = program.commands.find((cmd) => cmd.name() === 'portfolio-company');
    expect(root).toBeDefined();

    const subcommands = (root?.commands ?? []).map((cmd) => cmd.name());
    expect(subcommands).toContain('get');
    expect(subcommands).toContain('search');
    expect(subcommands).not.toContain('list');
  });
});

