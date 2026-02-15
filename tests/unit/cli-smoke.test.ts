import { describe, expect, it } from 'vitest';
import { buildProgram } from '../../src/cli';

describe('cli smoke', () => {
  it('renders global help output', async () => {
    let stdout = '';
    const program = buildProgram();
    program.exitOverride();
    program.configureOutput({
      writeOut: (str) => {
        stdout += str;
      },
      writeErr: () => {},
    });

    await expect(program.parseAsync(['--help'], { from: 'user' })).rejects.toMatchObject({
      code: 'commander.helpDisplayed',
      exitCode: 0,
    });

    expect(stdout).toContain('Usage: vestberry');
    expect(stdout).toContain('Commands:');
    expect(stdout).toContain('fund');
  });

  it('fails on unknown commands', async () => {
    let stderr = '';
    const program = buildProgram();
    program.exitOverride();
    program.configureOutput({
      writeOut: () => {},
      writeErr: (str) => {
        stderr += str;
      },
    });

    await expect(program.parseAsync(['unknown-command'], { from: 'user' })).rejects.toMatchObject({
      code: 'commander.unknownCommand',
      exitCode: 1,
    });

    expect(stderr.toLowerCase()).toContain('unknown command');
  });
});
