import { Command } from 'commander';
import { describe, expect, it } from 'vitest';
import { registerPortcoCommand } from '../../src/commands/portco';

describe('portco command', () => {
  it('exposes portco dashboard command', () => {
    const program = new Command();
    registerPortcoCommand(program);

    const portco = program.commands.find((cmd) => cmd.name() === 'portco');
    expect(portco).toBeDefined();

    const dashboard = portco?.commands.find((cmd) => cmd.name() === 'dashboard');
    expect(dashboard).toBeDefined();
    expect(dashboard?.registeredArguments.length).toBe(2);
  });
});
