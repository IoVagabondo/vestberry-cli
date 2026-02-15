import { stringify } from 'csv-stringify/sync';

export function formatCsv(rows: Array<Record<string, unknown>>): string {
  if (rows.length === 0) {
    return '';
  }

  return stringify(rows, {
    header: true,
    cast: {
      object: (value) => JSON.stringify(value),
    },
  });
}
