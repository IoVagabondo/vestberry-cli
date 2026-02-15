# Changelog

## Unreleased

### Added
- Layer A: `fund get <id> --full` for expanded fund detail retrieval.
- Layer A: `portfolio-summary get <fund-id>` with richer default fields.
- Layer A: `portfolio-summary get <fund-id> --full` for extended `seatsAggregated` and `sectors`.
- Layer A: `portfolio-summary get ... --export-json [path]` for local JSON exports (default to `output/` with timestamped filenames).
- Unit tests for funds endpoint query shape and portfolio summary command/endpoint behavior.

### Changed
- `fund list` now follows `getFundNames` shape and returns `id`, `displayName`, `vintageYear`, `order`.
- `fund get` query payload upgraded from minimal fields to richer fund metadata by default.
- `portfolio-summary` Layer A command moved from flag-heavy `list` usage to explicit `get <fund-id>` plus `--full`.
- `portfolio-summary get` now drops rows without `id` from both terminal and exported JSON output.
- README command examples restructured by Layer A vs Layer B, with examples moved into each section.

### Security / Tooling
- Secret scan script now excludes generated `output/` exports to avoid false positives from presigned URL query params.
