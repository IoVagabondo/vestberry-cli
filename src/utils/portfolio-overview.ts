import type { PortfolioSummaryRow } from '../api/endpoints/metrics';

function asRecord(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined;
  }
  return value as Record<string, unknown>;
}

function toStringOrFallback(value: unknown, fallback: string): string {
  if (typeof value === 'string' && value.length > 0) {
    return value;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  return fallback;
}

function toNumberOrFallback(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return fallback;
}

function pickFundOrGpOrLocal(value: unknown): unknown {
  const record = asRecord(value);
  if (record) {
    if (record.fund !== undefined && record.fund !== null) {
      return record.fund;
    }
    if (record.gp !== undefined && record.gp !== null) {
      return record.gp;
    }
    if (record.local !== undefined && record.local !== null) {
      return record.local;
    }

    // Keep export scalar-only for fund/gp/local objects even when all are null.
    if ('fund' in record || 'gp' in record || 'local' in record) {
      return null;
    }
  }

  return value ?? null;
}

function latestRoundDate(value: unknown): string | null {
  if (typeof value === 'string' && value.length > 0) {
    return value;
  }

  const list = Array.isArray(value) ? value : [];
  const dates = list
    .map((item) => asRecord(item)?.eventDate)
    .filter((item): item is string => typeof item === 'string' && item.length > 0);

  if (dates.length === 0) {
    return null;
  }

  return dates.sort((a, b) => a.localeCompare(b)).at(-1) ?? null;
}

function findTotalRow(summary: PortfolioSummaryRow[]): PortfolioSummaryRow | undefined {
  return summary.find((row) => String(row.investmentName).trim().toUpperCase() === 'TOTAL');
}

export interface PortfolioOverviewPayload {
  cutOffDate: string;
  fund: {
    id: string;
    name: string;
  };
  performance: {
    numberOfCashFlows: number;
    numberOfNAVs: number;
    balance: string;
    tvpi: string;
    dpi: string;
    rvpi: string;
    netIrr: string;
  };
  portfolioCompanies: Array<Record<string, unknown>>;
}

export function buildPortfolioOverviewPayload(
  input: {
    fundId: string;
    fundName?: string;
    cutOffDate: string;
    fundManagement: Record<string, unknown>;
    summary: PortfolioSummaryRow[];
  },
): PortfolioOverviewPayload {
  const totalRow = findTotalRow(input.summary);
  const totalDetails = asRecord(totalRow?.dashboardDetails);
  const fundRecord = asRecord(input.fundManagement.fund);

  const fundName =
    (typeof input.fundName === 'string' && input.fundName.length > 0
      ? input.fundName
      : undefined) ??
    (typeof fundRecord?.displayName === 'string' && fundRecord.displayName.length > 0
      ? fundRecord.displayName
      : undefined) ??
    input.fundId;

  const performance = {
    numberOfCashFlows: toNumberOrFallback(input.fundManagement.numberOfCashFlows, 0),
    numberOfNAVs: toNumberOrFallback(input.fundManagement.numberOfNAVs, 0),
    balance: toStringOrFallback(input.fundManagement.balance, '0'),
    tvpi: toStringOrFallback(
      input.fundManagement.tvpi,
      toStringOrFallback(pickFundOrGpOrLocal(totalDetails?.multiple), '0'),
    ),
    dpi: toStringOrFallback(input.fundManagement.dpi, '0'),
    rvpi: toStringOrFallback(input.fundManagement.rvpi, '0'),
    netIrr: toStringOrFallback(
      input.fundManagement.netIrr,
      toStringOrFallback(pickFundOrGpOrLocal(totalDetails?.irr), '0'),
    ),
  };

  const portfolioCompanies = input.summary.map((row) => {
    const details = asRecord(row.dashboardDetails) ?? {};
    const company = asRecord(row.portfolioCompany);

    return {
      id: row.id,
      investmentName: row.investmentName,
      portfolioCompanyId: typeof company?.id === 'string' ? company.id : null,
      portfolioCompanyName:
        typeof company?.displayName === 'string' ? company.displayName : null,
      ownership: details.ownership ?? null,
      ownershipFD: details.ownershipFD ?? null,
      investedEquity: pickFundOrGpOrLocal(details.investedEquity),
      investedDebt: pickFundOrGpOrLocal(details.investedDebt),
      investedFunds: pickFundOrGpOrLocal(details.investedFunds),
      totalOriginalCost: pickFundOrGpOrLocal(details.totalOriginalCost),
      irr: pickFundOrGpOrLocal(details.irr),
      multiple: pickFundOrGpOrLocal(details.multiple),
      latestInvestmentRoundDate: latestRoundDate(details.latestInvestmentRoundDate),
    };
  });

  return {
    cutOffDate: input.cutOffDate,
    fund: {
      id: input.fundId,
      name: fundName,
    },
    performance,
    portfolioCompanies,
  };
}
