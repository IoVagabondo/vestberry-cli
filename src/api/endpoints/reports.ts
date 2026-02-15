import type { AxiosInstance } from 'axios';
import { executeGraphQL } from '../graphql';

interface RoundListResponse {
  financingRoundDashboard: Array<Record<string, unknown>>;
}

interface RoundDetailResponse {
  financingRoundDetail: Record<string, unknown>;
}

interface CaptableEventsResponse {
  captableEvents: Array<Record<string, unknown>>;
}

interface StakeholdersResponse {
  stakeholders: Array<Record<string, unknown>>;
}

export async function listRounds(
  client: AxiosInstance,
  companyId: string,
  until?: string,
  verbose = false,
): Promise<Array<Record<string, unknown>>> {
  const query = `
    query FinancingRoundDashboard($input: FinancingRoundDashboardInput!) {
      financingRoundDashboard(input: $input) {
        id
        name
        eventDate
        preMoney
        postMoney
        pps
        roundSize
        currency { code }
        stage { id name }
      }
    }
  `;

  const input: Record<string, unknown> = { portfolioCompany: { id: companyId } };
  if (until) {
    input.until = until;
  }

  const data = await executeGraphQL<RoundListResponse>(
    client,
    { query, variables: { input } },
    verbose,
  );

  return data.financingRoundDashboard ?? [];
}

export async function getRoundDetail(
  client: AxiosInstance,
  roundId: string,
  verbose = false,
): Promise<Record<string, unknown>> {
  const query = `
    query FinancingRoundDetail($input: FinancingRoundInput) {
      financingRoundDetail(input: $input) {
        id
        name
        eventDate
        preMoney
        postMoney
        pps
        roundSize
        currency { code }
        stage { id name }
        positions {
          id
          commitment
          role { id name priority }
          stakeholder { id name }
        }
        fundData {
          description
          fund { id displayName }
          files { id name }
        }
      }
    }
  `;

  const data = await executeGraphQL<RoundDetailResponse>(
    client,
    { query, variables: { input: { id: roundId } } },
    verbose,
  );

  return data.financingRoundDetail;
}

export async function listCaptableEvents(
  client: AxiosInstance,
  companyId: string,
  verbose = false,
): Promise<Array<Record<string, unknown>>> {
  const query = `
    query CaptableEvents($input: CaptableEventsInput) {
      captableEvents(input: $input) {
        id
        name
        eventDate
        totalShares
        totalSharesFD
        totalDebt
        ownershipPerStakeholder {
          stakeholderId
          ownershipPercentOS
          ownershipPercentFD
        }
      }
    }
  `;

  const data = await executeGraphQL<CaptableEventsResponse>(
    client,
    { query, variables: { input: { portfolioCompany: { id: companyId } } } },
    verbose,
  );

  return data.captableEvents ?? [];
}

export async function listStakeholders(
  client: AxiosInstance,
  companyId: string,
  verbose = false,
): Promise<Array<Record<string, unknown>>> {
  const query = `
    query Stakeholders($input: StakeholdersInputGQL) {
      stakeholders(input: $input) {
        id
        name
        stakeholderType
        dependentFinancingRounds {
          id
          name
          eventDate
          preMoney
          postMoney
          pps
          roundSize
        }
      }
    }
  `;

  const data = await executeGraphQL<StakeholdersResponse>(
    client,
    { query, variables: { input: { portfolioCompany: { id: companyId } } } },
    verbose,
  );

  return data.stakeholders ?? [];
}
