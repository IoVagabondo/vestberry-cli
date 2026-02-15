export class InMemoryCache<T> {
  private readonly map = new Map<string, T>();

  get(key: string): T | undefined {
    return this.map.get(key);
  }

  set(key: string, value: T): void {
    this.map.set(key, value);
  }

  has(key: string): boolean {
    return this.map.has(key);
  }
}

export const resolverCache = new InMemoryCache<unknown>();
