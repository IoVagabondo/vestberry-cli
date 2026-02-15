import type { AxiosInstance } from 'axios';
import { executeGraphQL } from '../graphql';

export interface PortfolioCompany {
  id: string;
  displayName: string;
  [key: string]: unknown;
}

interface PortfolioCompaniesResponse {
  portfolioCompanies: PortfolioCompany[];
}

interface PortfolioCompanyResponse {
  portfolioCompany: PortfolioCompany;
}

export async function listPortfolioCompanies(
  client: AxiosInstance,
  fundId: string,
  verbose = false,
): Promise<PortfolioCompany[]> {
  const query = `
    query PortfolioCompanies($input: PortfolioCompaniesInput) {
      portfolioCompanies(input: $input) {
        id
        displayName
      }
    }
  `;

  const data = await executeGraphQL<PortfolioCompaniesResponse>(
    client,
    { query, variables: { input: { fund: { id: fundId } } } },
    verbose,
  );

  return data.portfolioCompanies ?? [];
}

export async function getPortfolioCompany(
  client: AxiosInstance,
  fundId: string,
  companyId: string,
  verbose = false,
): Promise<PortfolioCompany> {
  const query = `
    query PortfolioCompany($input: GetPortfolioCompanyInput) {
      portfolioCompany(input: $input) {
        id
        displayName
        description
        email
        phone
        web
      }
    }
  `;

  const data = await executeGraphQL<PortfolioCompanyResponse>(
    client,
    { query, variables: { input: { fund: { id: fundId }, id: companyId } } },
    verbose,
  );

  return data.portfolioCompany;
}
