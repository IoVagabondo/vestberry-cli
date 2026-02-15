import fs from 'node:fs/promises';
import path from 'node:path';

function sanitizeSegment(value: string): string {
  const normalized = value.trim().replace(/[^a-zA-Z0-9._-]+/g, '-');
  const collapsed = normalized.replace(/-+/g, '-').replace(/^-|-$/g, '');
  return collapsed.length > 0 ? collapsed.toLowerCase() : 'unknown';
}

export function createTimestampPrefix(now = new Date()): string {
  return now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

export function buildDefaultJsonExportPath(options: {
  type: string;
  idLabel: string;
  id: string;
  now?: Date;
  baseDir?: string;
}): string {
  const baseDir = options.baseDir ?? process.cwd();
  const filename = [
    createTimestampPrefix(options.now),
    sanitizeSegment(options.type),
    sanitizeSegment(options.idLabel),
    sanitizeSegment(options.id),
  ].join('-');

  return path.join(baseDir, 'output', `${filename}.json`);
}

export async function resolveJsonExportPath(
  requestedPath: string | undefined,
  defaultPath: string,
): Promise<string> {
  if (!requestedPath || requestedPath.trim().length === 0) {
    return defaultPath;
  }

  const resolved = path.resolve(requestedPath);
  try {
    const stat = await fs.stat(resolved);
    if (stat.isDirectory()) {
      return path.join(resolved, path.basename(defaultPath));
    }
  } catch {
    // If file does not exist yet, continue with extension normalization.
  }

  if (path.extname(resolved).toLowerCase() !== '.json') {
    return `${resolved}.json`;
  }

  return resolved;
}

export async function writeJsonExportFile(filePath: string, payload: unknown): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf-8');
}
