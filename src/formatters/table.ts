import Table from 'cli-table3';

export function formatTable(rows: Array<Record<string, unknown>>): string {
  if (rows.length === 0) {
    return 'No data.';
  }

  const headers = Object.keys(rows[0] ?? {});
  const table = new Table({ head: headers });

  for (const row of rows) {
    table.push(headers.map((key) => stringifyCell(row[key])));
  }

  return table.toString();
}

function stringifyCell(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  if (Array.isArray(value)) {
    return value.join(', ');
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  return String(value);
}
