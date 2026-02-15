import type { AxiosInstance } from 'axios';
import { executeGraphQL } from '../graphql';

export interface PortfolioSummaryRow {
  id: string | null;
  investmentName: string;
  dashboardDetails: Record<string, unknown>;
  portfolioCompany: { id: string; displayName: string; [key: string]: unknown } | null;
  portfolioFund?: { id: string; displayName: string; [key: string]: unknown } | null;
  seatsAggregated?: Record<string, unknown> | null;
  sectors?: Array<Record<string, unknown>>;
}

interface PortfolioSummaryResponse {
  portfolioSummary: PortfolioSummaryRow[];
}

interface InvestmentsResponse {
  investments: Array<Record<string, unknown>>;
}

interface KpiOverviewResponse {
  kpiOverview: Array<Record<string, unknown>>;
}

interface KpisResponse {
  kpis: {
    kpis: Array<Record<string, unknown>>;
  };
}

interface KpiReportsResponse {
  kpiMonitoringReports: Array<Record<string, unknown>>;
}

interface KpiValuesResponse {
  kpiMonitoringReportAllValues: Array<Record<string, unknown>>;
}

interface FundManagementResponse {
  fundManagement: Record<string, unknown>;
}

export interface PortfolioSummaryInput {
  fundId: string;
  companyId?: string;
  until?: string;
  detailed?: boolean;
  full?: boolean;
  includeLatestInvestmentRoundDate?: boolean;
}

const DASHBOARD_VALUE_FIELDS = `
  fund
  gp
  local
`;

const PORTFOLIO_SUMMARY_DASHBOARD_BASE_FIELDS = `
  ownership
  ownershipFD
  investedEquity { ${DASHBOARD_VALUE_FIELDS} }
  investedDebt { ${DASHBOARD_VALUE_FIELDS} }
  investedFunds { ${DASHBOARD_VALUE_FIELDS} }
  totalOriginalCost { ${DASHBOARD_VALUE_FIELDS} }
  irr { ${DASHBOARD_VALUE_FIELDS} }
  multiple { ${DASHBOARD_VALUE_FIELDS} }
`;

const PORTFOLIO_SUMMARY_DASHBOARD_FULL_FIELDS = `
  ${PORTFOLIO_SUMMARY_DASHBOARD_BASE_FIELDS}
  investmentInstrument
  entryRound
  exits
  status
  totalFofInvestment { ${DASHBOARD_VALUE_FIELDS} }
  latestInvestmentStage {
    id
    name
  }
  totalFollowOnInvestment { ${DASHBOARD_VALUE_FIELDS} }
  totalInitialInvestment { ${DASHBOARD_VALUE_FIELDS} }
  currentCost { ${DASHBOARD_VALUE_FIELDS} }
  investedOther { ${DASHBOARD_VALUE_FIELDS} }
  proceedsTotal { ${DASHBOARD_VALUE_FIELDS} }
  proceeds { ${DASHBOARD_VALUE_FIELDS} }
  debtRepayment { ${DASHBOARD_VALUE_FIELDS} }
  cashRealized { ${DASHBOARD_VALUE_FIELDS} }
  cashIncome { ${DASHBOARD_VALUE_FIELDS} }
  currentShareValue { ${DASHBOARD_VALUE_FIELDS} }
  companyValuation { ${DASHBOARD_VALUE_FIELDS} }
  firstCheckMoIC { ${DASHBOARD_VALUE_FIELDS} }
  totalReturn { ${DASHBOARD_VALUE_FIELDS} }
  outstandingDebt { ${DASHBOARD_VALUE_FIELDS} }
  totalCapitalGain { ${DASHBOARD_VALUE_FIELDS} }
  entryInvestmentStage {
    id
    name
  }
  firstInvestmentEventDate
  totalCommitment { ${DASHBOARD_VALUE_FIELDS} }
  fundedPortfolioFundCommitment { ${DASHBOARD_VALUE_FIELDS} }
  fundedPortfolioCompanyCommitment { ${DASHBOARD_VALUE_FIELDS} }
  unfundedPortfolioFundCommitment { ${DASHBOARD_VALUE_FIELDS} }
  unfundedPortfolioCompanyCommitment { ${DASHBOARD_VALUE_FIELDS} }
  latestFinancingRound {
    fund {
      preMoneyValuation
      postMoneyValuation
    }
    other {
      preMoneyValuation
      postMoneyValuation
    }
  }
  totalAmountRaised { ${DASHBOARD_VALUE_FIELDS} }
`;

function dashboardFields(includeLatestInvestmentRoundDate: boolean, full: boolean): string {
  const latestField = includeLatestInvestmentRoundDate ? '\n  latestInvestmentRoundDate { eventDate }' : '';
  if (full) {
    return `${PORTFOLIO_SUMMARY_DASHBOARD_FULL_FIELDS}${latestField}`;
  }
  return `${PORTFOLIO_SUMMARY_DASHBOARD_BASE_FIELDS}${latestField}`;
}

const PORTFOLIO_SUMMARY_ENTITY_FIELDS = `
  id
  investmentName
  portfolioCompany {
    id
    companyId
    vatId
    taxId
    fullLegalName
    stage
    displayName
    domicileCountry {
      id
      displayName
      name
    }
    operatingCurrency {
      id
      name
      code
    }
    logo {
      id
      path
    }
  }
  portfolioFund {
    id
    companyId
    vatId
    taxId
    fullLegalName
    displayName
    domicileCountry {
      id
      displayName
      name
    }
    operatingCurrency {
      id
      name
      code
    }
    logo {
      id
      path
    }
  }
`;

const PORTFOLIO_SUMMARY_FULL_EXTRA_FIELDS = `
  seatsAggregated {
    seats {
      total
      board
      observer
    }
  }
  sectors {
    id
    name
    code
    level
    root
    description
    generalPartnerCompanyId
  }
`;

function portfolioSummaryFields(full: boolean, includeLatestInvestmentRoundDate: boolean): string {
  const dashboardDetailsFields = dashboardFields(includeLatestInvestmentRoundDate, full);
  return `
    ${PORTFOLIO_SUMMARY_ENTITY_FIELDS}
    dashboardDetails {
      ${dashboardDetailsFields}
    }
    ${full ? PORTFOLIO_SUMMARY_FULL_EXTRA_FIELDS : ''}
  `;
}

export async function listPortfolioSummary(
  client: AxiosInstance,
  input: PortfolioSummaryInput,
  verbose = false,
): Promise<PortfolioSummaryRow[]> {
  const includeLatestInvestmentRoundDate = input.includeLatestInvestmentRoundDate ?? true;
  const fields = portfolioSummaryFields(Boolean(input.full), includeLatestInvestmentRoundDate);
  const query = `
    query PortfolioSummary($input: PortfolioSummaryInput) {
      portfolioSummary(input: $input) {
        ${fields}
      }
    }
  `;

  const payload: Record<string, unknown> = {
    fund: { id: input.fundId },
    detailed: input.detailed ?? false,
    filter: {},
  };

  const filter = payload.filter as Record<string, unknown>;
  if (input.companyId) {
    filter.portfolioCompany = { id: input.companyId };
  }
  if (input.until) {
    filter.until = input.until;
  }

  if (Object.keys(filter).length === 0) {
    delete payload.filter;
  }

  const data = await executeGraphQL<PortfolioSummaryResponse>(
    client,
    { query, variables: { input: payload } },
    verbose,
  );

  return data.portfolioSummary ?? [];
}

export async function listInvestments(
  client: AxiosInstance,
  verbose = false,
): Promise<Array<Record<string, unknown>>> {
  const query = `
    query Investments($input: InvestmentsInputGQL) {
      investments(input: $input) {
        id
        status
        fund { id displayName }
        portfolioCompany { id displayName }
        portfolioFund { id displayName }
      }
    }
  `;

  const data = await executeGraphQL<InvestmentsResponse>(
    client,
    { query, variables: { input: {} } },
    verbose,
  );

  return data.investments ?? [];
}

export async function getFundManagement(
  client: AxiosInstance,
  fundId: string,
  until?: string,
  verbose = false,
): Promise<Record<string, unknown>> {
  const query = `
    query FundManagement($input: FundManagementInput!) {
      fundManagement(input: $input) {
        fund { id displayName }
        numberOfCashFlows
        numberOfNAVs
        balance
        tvpi
        dpi
        rvpi
        netIrr
        latestNAV { id date name nav }
      }
    }
  `;

  const payload: Record<string, unknown> = { fund: { id: fundId } };
  if (until) {
    payload.until = until;
  }

  const data = await executeGraphQL<FundManagementResponse>(
    client,
    { query, variables: { input: payload } },
    verbose,
  );
  return data.fundManagement;
}

export async function getKpiOverview(
  client: AxiosInstance,
  fundId: string,
  verbose = false,
): Promise<Array<Record<string, unknown>>> {
  const query = `
    query KpiOverview($input: KpiOverviewInput!) {
      kpiOverview(input: $input) {
        portfolioCompany { id displayName }
        investmentStatus
      }
    }
  `;

  const data = await executeGraphQL<KpiOverviewResponse>(
    client,
    { query, variables: { input: { fund: { id: fundId } } } },
    verbose,
  );

  return data.kpiOverview ?? [];
}

export async function getKpiDefinitions(
  client: AxiosInstance,
  companyId: string,
  verbose = false,
): Promise<Array<Record<string, unknown>>> {
  const query = `
    query Kpis($input: KpisInput) {
      kpis(input: $input) {
        kpis {
          id
          name
          type
          valueType
          aggregation
          category
        }
      }
    }
  `;

  const data = await executeGraphQL<KpisResponse>(
    client,
    { query, variables: { input: { filter: { portfolioCompany: { id: companyId } } } } },
    verbose,
  );

  return data.kpis?.kpis ?? [];
}

export async function getKpiReports(
  client: AxiosInstance,
  companyId: string,
  limit = 20,
  offset = 0,
  verbose = false,
): Promise<Array<Record<string, unknown>>> {
  const query = `
    query KpiMonitoringReports($input: KpiMonitoringReportsInput) {
      kpiMonitoringReports(input: $input) {
        id
        status
        title
        subtitle
        submittedAt
        createdAt
        portfolioCompany { id displayName }
      }
    }
  `;

  const data = await executeGraphQL<KpiReportsResponse>(
    client,
    {
      query,
      variables: {
        input: {
          portfolioCompany: { id: companyId },
          limit,
          offset,
        },
      },
    },
    verbose,
  );

  return data.kpiMonitoringReports ?? [];
}

export async function getKpiValues(
  client: AxiosInstance,
  companyId: string,
  includeEmpty = false,
  includeDraft = false,
  verbose = false,
): Promise<Array<Record<string, unknown>>> {
  const query = `
    query KpiMonitoringReportAllValues($input: KpiMonitoringReportAllValuesInput!) {
      kpiMonitoringReportAllValues(input: $input) {
        kpi { id name type valueType aggregation category }
        period
        historic
        valueInterval
        actual { value { local } currency { local { code } } }
        budget { value { local } currency { local { code } } }
        forecast { value { local } currency { local { code } } }
      }
    }
  `;

  const data = await executeGraphQL<KpiValuesResponse>(
    client,
    {
      query,
      variables: {
        input: {
          portfolioCompany: { id: companyId },
          includeEmptyKpis: includeEmpty,
          includeDraftValues: includeDraft,
        },
      },
    },
    verbose,
  );

  return data.kpiMonitoringReportAllValues ?? [];
}
