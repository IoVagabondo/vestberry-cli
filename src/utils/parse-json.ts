import fs from 'node:fs/promises';
import path from 'node:path';
import { CliError } from './errors';

export async function parseJsonInput<T = unknown>(input?: string): Promise<T | undefined> {
  if (!input) {
    return undefined;
  }

  let content = input;

  if (input.startsWith('@')) {
    const file = path.resolve(process.cwd(), input.slice(1));
    content = await fs.readFile(file, 'utf-8');
  }

  try {
    return JSON.parse(content) as T;
  } catch (error) {
    throw new CliError('VALIDATION_ERROR', `Invalid JSON input: ${input}`, error);
  }
}

export async function parseTextInput(input: string): Promise<string> {
  if (input.startsWith('@')) {
    const file = path.resolve(process.cwd(), input.slice(1));
    return fs.readFile(file, 'utf-8');
  }
  return input;
}
