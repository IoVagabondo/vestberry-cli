const HIDDEN_PREFIXES = ['test_', 'internal_'];

function shouldHideKey(key: string): boolean {
  if (key === '__typename') {
    return true;
  }
  return HIDDEN_PREFIXES.some((prefix) => key.startsWith(prefix));
}

function simplifyValue(value: unknown): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => simplifyValue(item));
  }

  if (typeof value !== 'object') {
    return value;
  }

  const obj = value as Record<string, unknown>;
  if ('displayName' in obj && typeof obj.displayName === 'string') {
    return obj.displayName;
  }
  if ('name' in obj && typeof obj.name === 'string') {
    return obj.name;
  }
  if ('code' in obj && typeof obj.code === 'string') {
    return obj.code;
  }
  if ('id' in obj && typeof obj.id === 'string' && Object.keys(obj).length === 1) {
    return obj.id;
  }

  return compactObject(obj);
}

export function compactObject(input: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(input)) {
    if (shouldHideKey(key)) {
      continue;
    }

    out[key] = simplifyValue(value);
  }

  return out;
}

export function flattenRow(input: Record<string, unknown>, prefix = ''): Record<string, unknown> {
  const out: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(input)) {
    const composed = prefix ? `${prefix}.${key}` : key;

    if (value === null || value === undefined) {
      out[composed] = value;
      continue;
    }

    if (Array.isArray(value)) {
      if (value.length > 0 && typeof value[0] === 'object') {
        out[composed] = JSON.stringify(value);
      } else {
        out[composed] = value.join(', ');
      }
      continue;
    }

    if (typeof value === 'object') {
      const nested = flattenRow(value as Record<string, unknown>, composed);
      Object.assign(out, nested);
      continue;
    }

    out[composed] = value;
  }

  return out;
}

export function compactRows(rows: Array<Record<string, unknown>>): Array<Record<string, unknown>> {
  return rows.map((row) => compactObject(row));
}
