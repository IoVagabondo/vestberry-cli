import fs from 'node:fs/promises';
import path from 'node:path';

export async function writeRunLog(payload: unknown): Promise<string> {
  const dir = path.join(process.cwd(), '.cache', 'runs');
  await fs.mkdir(dir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const file = path.join(dir, `${stamp}.json`);
  await fs.writeFile(file, JSON.stringify(payload, null, 2), 'utf-8');
  return file;
}
