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


## Global Flags

- `--api-key <key>`
- `--format json|table|csv` (default `json`)
- `--compact` / `--no-compact` (default compact)
- `--verbose`
- `--dry-run`

## Command Layers

### Layer A: Primitive Wrappers

Thin wrappers around single API operations. Use these when you want direct control over query inputs and raw response shapes.

- `auth test`
- `raw gql`, `raw http`
- `fund list|get|get-portco-list|search`
- `portfolio-company get|search`
- `fund get-summary`
- `affinity portco dashboard`
- `investment list|search`
- `round list|get|search`
- `captable-event list`
- `stakeholder list|search`
- `kpi overview|definitions|reports|values`
- `note list|create|update`
- `meta countries|currencies|fx-rates`

Examples:

```bash
vestberry auth test
vestberry schema pull
vestberry fund list
vestberry fund search --query "Sample Growth Fund"
vestberry fund get <fund-id>
vestberry fund get <fund-id> --full
vestberry fund get-portco-list <fund-id>
vestberry fund get-summary <fund-id>
vestberry fund get-summary <fund-id> --full
vestberry fund get-summary <fund-id> --select id,investmentName,irr,multiple
vestberry fund get-summary <fund-id> --select portfolioCompanies.id,portfolioCompanies.irr,summary.irr
vestberry fund get-summary <fund-id> --export-json
vestberry portfolio-company search --fund-id <fund-id> --query "Sample Co"
vestberry affinity portco dashboard <fund-id> <portco-id>
vestberry affinity portco dashboard <fund-id> <portco-id> --format table
vestberry kpi overview --fund-id <fund-id>
vestberry round list --company-id <company-id>
vestberry captable-event list --company-id <company-id>
```

### Layer B: Advanced Intent Commands

Composed workflows that orchestrate multiple primitives and return opinionated output for common tasks.

- `portfolio overview`
- `portfolio companies`
- `company dossier`
- `rounds last-quarter`
- `invested total`
- `ingest legal-docs`

Examples:

```bash
vestberry portfolio overview --fund-id <fund-id> --cut-off-date 2025-12-31 --export-json
vestberry portfolio companies --fund-id <fund-id>
vestberry company dossier --company-id <company-id> --fund-id <fund-id> --full
vestberry rounds last-quarter --fund-id <fund-id>
vestberry invested total --company "Company" --fund "Fund"
```

## Output Formats

- `json`: default, list envelope includes pagination
- `table`: flattened rows
- `csv`: flattened rows

## Compact Formatting

Compact mode strips non-essential metadata and simplifies nested fields.
Disable with `--no-compact`.

## Portfolio Overview Export

Use `--export-json [path]` on `portfolio overview` to write the payload to disk instead of printing full JSON to terminal.

- `vestberry portfolio overview --fund-id <fund-id> --export-json`
- `vestberry portfolio overview --fund-id <fund-id> --cut-off-date 2025-12-31 --export-json`
- `vestberry portfolio overview --fund-id <fund-id> --export-json ./tmp/overview.json`

When no path is provided, files are saved in `output/` with naming:
`<timestamp>-portfolio-overview-fund-id-<fund-id>.json`

Export payload structure:
- `cutOffDate` (replaces `until`)
- `fund` (`id`, `name`)
- `performance` (`numberOfCashFlows`, `numberOfNAVs`, `balance`, `tvpi`, `dpi`, `rvpi`, `netIrr`)
- `portfolioCompanies` (flattened dashboard metrics preferring `fund`, then `gp`, then `local`; single latest `latestInvestmentRoundDate`)

For `fund get-summary`, JSON output/export uses:
- `portfolioCompanies` (instead of `data`)
- flattened company rows: `portfolioCompany.*` and `dashboardDetails.*` moved one level up
- company rows exclude redundant `portfolioCompanyCompanyId` and exclude `portfolioFund`
- flattened `summary`: `dashboardDetails.*` moved one level up
- `summary.id` is set to the queried fund id
- optional `--select <fields>` projection for prosumer/agent use:
  - unscoped fields (e.g. `id,irr`) are applied where available
  - scoped fields: `portfolioCompanies.<field>` and `summary.<field>`

Rows are filtered to non-empty `id` and non-empty `portfolioCompany.id`; aggregate `TOTAL` is exposed as top-level `summary` when present.

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
