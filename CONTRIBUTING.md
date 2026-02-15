# Contributing

## Setup

1. Install dependencies: `npm ci`
2. Create `.env` from `.env.example`
3. Run checks before opening a PR:

- `npm run build`
- `npm run type-check`
- `npm run lint`
- `npm run test`

## Publishing

Run before `npm publish`:

- `npm run verify`
- `npm pack --dry-run`

## Integration Tests

Integration tests require `VESTBERRY_API_KEY`.
Run with: `npm run test:integration`.
