# vestberry-cli

Production-grade GraphQL CLI for Vestberry with two layers:

- Layer A: primitive read/write commands
- Layer B: intent/orchestration commands for agent workflows


## From source

```bash
npm install
npm run build
npm link
vestberry --help
```

## Auth

Create `.env`:

```env
VESTBERRY_API_KEY=...
VESTBERRY_API_BASE_URL=https://api.vestberry.com/graphql
```


## Quick Start

```bash
vestberry auth test
vestberry schema pull
vestberry fund list
vestberry fund search --query "Sample Growth Fund"
vestberry portfolio-company list --fund-id <fund-id>
vestberry portfolio-summary list --fund-id <fund-id> --until YYYY-MM-DD --detailed
vestberry kpi overview --fund-id <fund-id>
vestberry round list --company-id <company-id>
vestberry captable-event list --company-id <company-id>
```

## Global Flags

- `--api-key <key>`
- `--format json|table|csv` (default `json`)
- `--compact` / `--no-compact` (default compact)
- `--verbose`
- `--dry-run`

## Command Model

## Layer A primitives

- `auth test`
- `raw gql`, `raw http`
- `fund list|get|search`
- `portfolio-company list|get|search`
- `portfolio-summary list`
- `investment list|search`
- `round list|get|search`
- `captable-event list`
- `stakeholder list|search`
- `kpi overview|definitions|reports|values`
- `note list|create|update`
- `meta countries|currencies|fx-rates`

## Layer B intents

- `portfolio overview`
- `portfolio companies`
- `company dossier`
- `rounds last-quarter`
- `invested total`
- `ingest legal-docs`

## Output Formats

- `json`: default, list envelope includes pagination
- `table`: flattened rows
- `csv`: flattened rows

## Compact Formatting

Compact mode strips non-essential metadata and simplifies nested fields.
Disable with `--no-compact`.

## Write Safety

Mutations are dry-run by default.
For write commands, pass `--apply --no-dry-run` to execute.
Run logs are written to `.cache/runs/`.

## Development

```bash
npm run dev -- --help
npm run type-check
npm run lint
npm run test
npm run build
```

Integration tests (live API):

```bash
npm run test:integration
```

## Troubleshooting

- 401/403: verify API key and base URL
- GraphQL field errors: run `vestberry schema pull` and use `raw gql` for discovery
- Empty arrays can be valid (for sparse KPI/report datasets)

## License

MIT
