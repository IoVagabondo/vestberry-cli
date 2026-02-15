# Contributing

## Setup

1. Install dependencies: `npm install`
2. Create `.env` from `.env.example`
3. Run checks before opening a PR:

- `npm run build`
- `npm run type-check`
- `npm run lint`
- `npm run test`

## Integration Tests

Integration tests require `VESTBERRY_API_KEY`.
Run with: `npm run test:integration`.
