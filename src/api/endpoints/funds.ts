import type { AxiosInstance } from 'axios';
import { executeGraphQL } from '../graphql';

export interface Fund {
  id: string;
  displayName: string;
  vintageYear?: number | null;
  order?: number | null;
  [key: string]: unknown;
}

interface FundsResponse {
  funds: Fund[];
}

interface FundResponse {
  fund: Fund;
}

function hasNonEmptyId(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function normalizeFund(fund: Fund): Fund {
  const portfolioSummaryRaw = fund.portfolioSummary;
  if (!Array.isArray(portfolioSummaryRaw)) {
    return fund;
  }

  const portfolioSummary = portfolioSummaryRaw.filter((row) => {
    if (!row || typeof row !== 'object' || Array.isArray(row)) {
      return false;
    }
    return hasNonEmptyId((row as { id?: unknown }).id);
  });

  return {
    ...fund,
    portfolioSummary,
  };
}

const FUND_BASE_FIELDS = `
  id
  displayName
  fullLegalName
  legalForm
  companyId
  taxId
  vatId
  incorporationDate
  domicileAddress
  domicileCity
  domicileZip
  web
  phone
  email
  description
  companyDescription
  legalName
  name
  address
  city
  zip
  createdAt
  geographicFocus
  fundSize
  investableCapital
  firstClosingDate
  finalClosingDate
  vintageYear
  reportingPeriodicity
  strategy
  isGuest
  terminationDate
  fxConsolidationDate
  sellingMethod
  costCalcMethod
  fundSizeOther
  operatingCurrency {
    id
    name
    code
    symbol
  }
  currency {
    id
    name
    code
    symbol
  }
  country {
    id
    name
    code
    displayName
  }
  domicileCountry {
    id
    name
    code
    displayName
  }
  domicileRegion {
    id
    name
    level
  }
  investmentStages {
    id
    name
  }
`;

const FUND_FULL_FIELDS = `
  ${FUND_BASE_FIELDS}
  logo {
    id
    mime
    type
    name
    path
    pathWithoutAttachment
    thumbnail
    size
    tags
    created
    canBeDeleted
  }
  employees {
    id
    email
    firstName
    lastName
    isLimitedPartner
    isLPPortalUser
    type
    isAdmin
    receiveReminders
    debtMaturityReminders
    position
  }
  aclTemplates {
    id
    name
    createdAt
    updatedAt
  }
  portfolioInvestments {
    id
    displayName
    fullLegalName
    legalForm
    companyId
    taxId
    vatId
    incorporationDate
    domicileAddress
    domicileCity
    domicileZip
    web
    phone
    email
    description
    companyDescription
    legalName
    name
    address
    city
    zip
    createdAt
  }
  portfolioSummary {
    id
    investmentName
    dashboardDetails {
      ownership
      ownershipFD
      investedEquity {
        local
        gp
      }
      investedDebt {
        local
        gp
      }
      investedFunds {
        local
        gp
      }
      totalOriginalCost {
        local
        gp
      }
      irr {
        local
        gp
      }
      multiple {
        local
        gp
      }
      latestInvestmentRoundDate {
        eventDate
      }
    }
    portfolioCompany {
      id
      displayName
    }
    portfolioFund {
      id
      displayName
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
  }
  generalPartnerCompany {
    id
    displayName
    fullLegalName
    legalForm
    companyId
    taxId
    vatId
    incorporationDate
    domicileAddress
    domicileCity
    domicileZip
    web
    phone
    email
    description
    companyDescription
    legalName
    name
    address
    city
    zip
    createdAt
    isGuest
    isCopy
    canBeCopied
    pricingType
    type
  }
  extraStaticInfo {
    name
  }
  order
  industryRoot {
    id
    name
    code
    level
    root
    description
    generalPartnerCompanyId
  }
  industryList {
    id
    name
    code
    level
    root
    description
    generalPartnerCompanyId
  }
  investmentSectors {
    id
    name
    code
    level
    root
    description
    generalPartnerCompanyId
  }
`;

export async function listFunds(
  client: AxiosInstance,
  input?: Record<string, unknown>,
  verbose = false,
): Promise<Fund[]> {
  const query = `
    query getFundNames($input: FundsSearch) {
      funds(input: $input) {
        id
        displayName
        vintageYear
        order
      }
    }
  `;

  const data = await executeGraphQL<FundsResponse>(
    client,
    { query, variables: { input } },
    verbose,
  );
  return data.funds ?? [];
}

export async function getFund(
  client: AxiosInstance,
  id: string,
  verbose = false,
  full = false,
): Promise<Fund> {
  const fields = full ? FUND_FULL_FIELDS : FUND_BASE_FIELDS;
  const query = `
    query Fund($input: FundSearch) {
      fund(input: $input) {
        ${fields}
      }
    }
  `;

  const data = await executeGraphQL<FundResponse>(
    client,
    { query, variables: { input: { id } } },
    verbose,
  );
  return normalizeFund(data.fund);
}
