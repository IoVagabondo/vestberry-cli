# Changelog

## Unreleased

### Added
- Layer A: `fund get <id> --full` for expanded fund detail retrieval.
- Layer A: `fund get-summary <fund-id>` with richer default fields.
- Layer A: `fund get-summary <fund-id> --full` for extended dashboard metrics plus `seatsAggregated` and `sectors`.
- Layer A: `fund get-summary <fund-id> --select <fields>` for allowlisted field projections (`portfolioCompanies.<field>`, `summary.<field>`).
- Layer A: `fund get-summary ... --export-json [path]` for local JSON exports (default to `output/` with timestamped filenames).
- Layer A: `portco dashboard <fund-id> <portco-id>` for `ledgerDashboardDetails` metrics scoped to fund + portfolio company.
- Unit tests for funds endpoint query shape and portfolio summary command/endpoint behavior.

### Changed
- `fund list` now follows `getFundNames` shape and returns `id`, `displayName`, `vintageYear`, `order`.
- `fund get` query payload upgraded from minimal fields to richer fund metadata by default.
- `fund get --full` now filters `portfolioSummary` entries to non-empty `id` values.
- portfolio company listing moved from `portfolio-company list --fund-id <id>` to `fund get-portco-list <fund-id>`.
- Layer A command renamed from `portfolio-summary` to `fund get-summary`.
- `fund get-summary` moved from flag-heavy `list` usage to explicit `get-summary <fund-id>` plus `--full`.
- `fund get-summary` now drops rows without `id` from `portfolioCompanies`, and surfaces aggregate `TOTAL` as top-level `summary` in JSON output/export.
- `fund get-summary` now also excludes rows where `portfolioCompany.id` is missing/null.
- `fund get-summary` JSON/export payload now uses `portfolioCompanies` (instead of `data`) and flattens both `portfolioCompany` and `dashboardDetails` one level in company rows.
- `fund get-summary` aggregate `summary` now has flattened `dashboardDetails` fields.
- `fund get-summary` aggregate `summary.id` now maps to the queried fund id.
- `fund get-summary` flattened company rows now omit redundant `portfolioCompanyCompanyId` and omit `portfolioFund`.
- `fund get-summary` no longer queries `latestInvestmentRoundDate`, so it is omitted from `portfolioCompanies` and `summary` output.
- `fund get-summary` dashboard values now request `fund`, `gp`, and `local` from API payloads.
- `portfolio overview` value normalization now prefers `fund` over `gp` over `local`.
- README command examples restructured by Layer A vs Layer B, with examples moved into each section.

### Security / Tooling
- Secret scan script now excludes generated `output/` exports to avoid false positives from presigned URL query params.
