#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const EXCLUDED_DIRS = new Set([
  '.git',
  'node_modules',
  'dist',
  '.cache',
  'coverage',
  'internal_docs',
]);

const EXCLUDED_FILES = new Set(['.env']);

const PATTERNS = [
  { name: 'private-key-block', regex: /-----BEGIN [A-Z ]*PRIVATE KEY-----/g },
  { name: 'aws-access-key', regex: /\bAKIA[0-9A-Z]{16}\b/g },
  { name: 'github-token', regex: /\bgh[pousr]_[A-Za-z0-9]{36,}\b/g },
  { name: 'slack-token', regex: /\bxox[baprs]-[A-Za-z0-9-]{20,}\b/g },
  {
    name: 'generic-secret-assignment',
    regex: /\b(api[_-]?key|token|secret|password)\b\s*[:=]\s*["'`][^"'`\s]{16,}["'`]/gi,
  },
  {
    name: 'hardcoded-bearer-token',
    regex: /authorization\s*[:=]\s*["'`]bearer\s+[a-z0-9._~+/-]{20,}["'`]/gi,
  },
  {
    name: 'connection-string-with-credentials',
    regex: /\b(?:postgres|mysql|mongodb(?:\+srv)?|redis):\/\/[^\s:@]+:[^@\s]+@/gi,
  },
];

function isLikelyText(content) {
  return !content.includes('\u0000');
}

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.name === '.' || entry.name === '..') {
      continue;
    }

    const full = path.join(dir, entry.name);
    const rel = path.relative(ROOT, full);

    if (entry.isDirectory()) {
      if (EXCLUDED_DIRS.has(entry.name)) {
        continue;
      }
      files.push(...(await walk(full)));
      continue;
    }

    if (entry.isFile()) {
      if (EXCLUDED_FILES.has(entry.name)) {
        continue;
      }
      files.push(rel);
    }
  }

  return files;
}

async function main() {
  const files = await walk(ROOT);
  const findings = [];

  for (const rel of files) {
    const full = path.join(ROOT, rel);
    const content = await fs.readFile(full, 'utf-8').catch(() => '');
    if (!content || !isLikelyText(content)) {
      continue;
    }

    for (const pattern of PATTERNS) {
      pattern.regex.lastIndex = 0;
      const match = pattern.regex.exec(content);
      if (!match) {
        continue;
      }
      const firstLine = content.slice(0, match.index).split('\n').length;
      findings.push(`${rel}:${firstLine} [${pattern.name}] ${match[0].slice(0, 80)}`);
    }
  }

  if (findings.length > 0) {
    process.stderr.write('Potential secrets detected:\n');
    for (const finding of findings) {
      process.stderr.write(`- ${finding}\n`);
    }
    process.exit(1);
  }

  process.stdout.write('No obvious hardcoded secrets found.\n');
}

await main();
