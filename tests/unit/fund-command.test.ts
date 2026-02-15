import { Command } from 'commander';
import { describe, expect, it } from 'vitest';
import { registerFundCommand } from '../../src/commands/fund';

describe('fund command', () => {
  it('exposes get-portco-list subcommand', () => {
    const program = new Command();
    registerFundCommand(program);

    const fund = program.commands.find((cmd) => cmd.name() === 'fund');
    expect(fund).toBeDefined();

    const subcommands = (fund?.commands ?? []).map((cmd) => cmd.name());
    expect(subcommands).toContain('list');
    expect(subcommands).toContain('get');
    expect(subcommands).toContain('get-portco-list');
    expect(subcommands).toContain('get-summary');
    expect(subcommands).toContain('search');
  });
});
