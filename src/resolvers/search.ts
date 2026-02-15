import { CliError } from '../utils/errors';

export interface RankedItem<T> {
  item: T;
  score: number;
}

function normalize(value: string): string {
  return value.toLowerCase().trim();
}

export function rankByQuery<T>(
  query: string,
  items: T[],
  selector: (item: T) => string,
): Array<RankedItem<T>> {
  const q = normalize(query);
  const tokens = q.split(/\s+/).filter(Boolean);

  const ranked = items
    .map((item) => {
      const source = normalize(selector(item));
      if (!source) {
        return { item, score: -1 };
      }

      if (source === q) {
        return { item, score: 1000 };
      }

      if (source.startsWith(q)) {
        return { item, score: 800 };
      }

      let score = 0;
      if (source.includes(q)) {
        score += 600;
      }

      for (const token of tokens) {
        if (source.startsWith(token)) {
          score += 100;
        } else if (source.includes(token)) {
          score += 50;
        }
      }

      return { item, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);

  return ranked;
}

export function ensureSingleMatch<T>(ranked: Array<RankedItem<T>>, selectFirst = false): T {
  if (ranked.length === 0) {
    throw new CliError('NOT_FOUND', 'No matching entity found.');
  }

  if (ranked.length > 1 && !selectFirst) {
    throw new CliError('AMBIGUOUS_RESULT', 'Ambiguous query, multiple candidates found.', {
      candidates: ranked.slice(0, 10),
    });
  }

  const top = ranked[0];
  if (!top) {
    throw new CliError('NOT_FOUND', 'No matching entity found.');
  }
  return top.item;
}
