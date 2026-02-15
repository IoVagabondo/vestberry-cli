# Changelog

## Unreleased

### Added
- Layer A: `fund get <id> --full` for expanded fund detail retrieval.
- Layer A: `portfolio-summary get <fund-id>` with richer default fields.
- Layer A: `portfolio-summary get <fund-id> --full` for extended dashboard metrics plus `seatsAggregated` and `sectors`.
- Layer A: `portfolio-summary get ... --export-json [path]` for local JSON exports (default to `output/` with timestamped filenames).
- Unit tests for funds endpoint query shape and portfolio summary command/endpoint behavior.

### Changed
- `fund list` now follows `getFundNames` shape and returns `id`, `displayName`, `vintageYear`, `order`.
- `fund get` query payload upgraded from minimal fields to richer fund metadata by default.
- `portfolio-summary` Layer A command moved from flag-heavy `list` usage to explicit `get <fund-id>` plus `--full`.
- `portfolio-summary get` now drops rows without `id` from `portfolioCompanies`, and surfaces aggregate `TOTAL` as top-level `summary` in JSON output/export.
- `portfolio-summary get` now also excludes rows where `portfolioCompany.id` is missing/null.
- `portfolio-summary` JSON/export payload now uses `portfolioCompanies` (instead of `data`) and flattens both `portfolioCompany` and `dashboardDetails` one level in company rows.
- `portfolio-summary` aggregate `summary` now has flattened `dashboardDetails` fields.
- `portfolio-summary` aggregate `summary.id` now maps to the queried fund id.
- `portfolio-summary` flattened company rows now omit redundant `portfolioCompanyCompanyId` and omit `portfolioFund`.
- `portfolio-summary get` no longer queries `latestInvestmentRoundDate`, so it is omitted from `portfolioCompanies` and `summary` output.
- `portfolio-summary` dashboard values now request `fund`, `gp`, and `local` from API payloads.
- `portfolio overview` value normalization now prefers `fund` over `gp` over `local`.
- README command examples restructured by Layer A vs Layer B, with examples moved into each section.

### Security / Tooling
- Secret scan script now excludes generated `output/` exports to avoid false positives from presigned URL query params.
