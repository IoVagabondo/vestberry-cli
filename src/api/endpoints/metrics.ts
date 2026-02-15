import type { AxiosInstance } from 'axios';
import { executeGraphQL } from '../graphql';

export interface PortfolioSummaryRow {
  id: string | null;
  investmentName: string;
  dashboardDetails: Record<string, unknown>;
  portfolioCompany: { id: string; displayName: string } | null;
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
}

export async function listPortfolioSummary(
  client: AxiosInstance,
  input: PortfolioSummaryInput,
  verbose = false,
): Promise<PortfolioSummaryRow[]> {
  const query = `
    query PortfolioSummary($input: PortfolioSummaryInput) {
      portfolioSummary(input: $input) {
        id
        investmentName
        dashboardDetails {
          ownership
          ownershipFD
          investedEquity { local gp }
          investedDebt { local gp }
          investedFunds { local gp }
          totalOriginalCost { local gp }
          irr { local gp }
          multiple { local gp }
          latestInvestmentRoundDate { eventDate }
        }
        portfolioCompany { id displayName }
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
