import { formatJson } from '../formatters/json';
import { formatTable } from '../formatters/table';
import { formatCsv } from '../formatters/csv';
import { compactObject, compactRows, flattenRow } from './flatten';
import type { ListEnvelope } from '../api/types';
import type { RuntimeConfig } from './config';

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function printData(
  value: unknown,
  config: Pick<RuntimeConfig, 'format' | 'compact'>,
  list = false,
): void {
  if (config.format === 'json') {
    if (list && Array.isArray(value)) {
      const rows = config.compact
        ? value.map((item) => (isRecord(item) ? compactObject(item) : item))
        : value;
      process.stdout.write(`${formatJson({ pagination: { count: rows.length }, data: rows })}\n`);
      return;
    }

    if (isRecord(value) && config.compact) {
      process.stdout.write(`${formatJson(compactObject(value))}\n`);
      return;
    }

    process.stdout.write(`${formatJson(value)}\n`);
    return;
  }

  const rows = normalizeRows(value, config.compact, list);

  if (config.format === 'table') {
    process.stdout.write(`${formatTable(rows)}\n`);
    return;
  }

  process.stdout.write(`${formatCsv(rows)}\n`);
}

export function printListEnvelope(
  envelope: ListEnvelope<Record<string, unknown>>,
  config: Pick<RuntimeConfig, 'format' | 'compact'>,
): void {
  if (config.format === 'json') {
    const rows = config.compact ? compactRows(envelope.data) : envelope.data;
    process.stdout.write(`${formatJson({ pagination: envelope.pagination, data: rows })}\n`);
    return;
  }

  const rows = normalizeRows(envelope.data, config.compact, true);
  if (config.format === 'table') {
    process.stdout.write(`${formatTable(rows)}\n`);
    return;
  }
  process.stdout.write(`${formatCsv(rows)}\n`);
}

function normalizeRows(
  value: unknown,
  compact: boolean,
  list = false,
): Array<Record<string, unknown>> {
  if (Array.isArray(value)) {
    return value
      .filter((item): item is Record<string, unknown> => isRecord(item))
      .map((item) => flattenRow(compact ? compactObject(item) : item));
  }

  if (isRecord(value)) {
    const object = compact ? compactObject(value) : value;
    if (list) {
      return [flattenRow(object)];
    }
    return [flattenRow(object)];
  }

  return [{ value }];
}
