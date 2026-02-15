import type { AxiosInstance } from 'axios';
import { executeGraphQL } from '../graphql';

export interface PortfolioCompanyLedgerDashboardDetailsInput {
  fundId: string;
  portfolioCompanyId: string;
}

interface PortfolioCompanyLedgerDashboardDetailsResponse {
  ledgerDashboardDetails: Record<string, unknown>;
}

const LOCAL_GP_VALUE_FIELDS = `
  local
  fund
  gp
  other
`;

export async function getPortfolioCompanyLedgerDashboardDetails(
  client: AxiosInstance,
  input: PortfolioCompanyLedgerDashboardDetailsInput,
  verbose = false,
): Promise<Record<string, unknown>> {
  const query = `
    query portfolioCompanyLedgerDashboardDetails($input: LedgerDashboardDetailsSearch!) {
      ledgerDashboardDetails(input: $input) {
        holdingPeriod
        ownedShares
        ownedSharesFD
        captableOwnedShares
        captableOwnedWarrants
        captableOwnedSharesFD
        ledgerOwnedShares
        ledgerOwnedWarrants
        ledgerOwnedSharesFD
        latestCaptableEventDate
        outstandingShares
        outstandingSharesFD
        ownership
        ownershipFD
        writtenOff
        firstInvestmentEventDate
        reservedSharesDetailedWithObtained {
          amount
          securityOptionPlan {
            id
            optionPoolName
          }
          securityShareClass {
            id
            name
          }
        }
        latestInvestmentRound {
          id
          name
          stage {
            id
            name
          }
        }
        latestPortfolioCompanyInvestmentRound {
          id
          name
          stage {
            id
            name
          }
        }
        valuationMethodology {
          local {
            valuationMethodology
            enterpriseValue
          }
          gp {
            valuationMethodology
            enterpriseValue
          }
          fund {
            valuationMethodology
            enterpriseValue
          }
          raw {
            valuationMethodology
            enterpriseValue
            currency
          }
        }
        totalCapitalGain { ${LOCAL_GP_VALUE_FIELDS} }
        pps { ${LOCAL_GP_VALUE_FIELDS} }
        investedEquity { ${LOCAL_GP_VALUE_FIELDS} }
        investedDebt { ${LOCAL_GP_VALUE_FIELDS} }
        investedOther { ${LOCAL_GP_VALUE_FIELDS} }
        fxCapitalGain {
          proceedsToday
          proceedsCost
          fairValueToday
          fairValueCost
          fxGain
          capitalGainLocal
          capitalGainFund
        }
        totalOriginalCost { ${LOCAL_GP_VALUE_FIELDS} }
        currentShareValue { ${LOCAL_GP_VALUE_FIELDS} }
        outstandingDebt { ${LOCAL_GP_VALUE_FIELDS} }
        currentEquityFairValues { ${LOCAL_GP_VALUE_FIELDS} }
        companyValuation { ${LOCAL_GP_VALUE_FIELDS} }
        proceedsTotal { ${LOCAL_GP_VALUE_FIELDS} }
        proceeds { ${LOCAL_GP_VALUE_FIELDS} }
        debtRepayment { ${LOCAL_GP_VALUE_FIELDS} }
        cashIncome { ${LOCAL_GP_VALUE_FIELDS} }
        cashRealized { ${LOCAL_GP_VALUE_FIELDS} }
        totalReturn { ${LOCAL_GP_VALUE_FIELDS} }
        multiple { ${LOCAL_GP_VALUE_FIELDS} }
        irr { ${LOCAL_GP_VALUE_FIELDS} }
        exits
        status
        investmentInstrument
        entryRound
      }
    }
  `;

  const data = await executeGraphQL<PortfolioCompanyLedgerDashboardDetailsResponse>(
    client,
    {
      operationName: 'portfolioCompanyLedgerDashboardDetails',
      query,
      variables: {
        input: {
          funds: [{ id: input.fundId }],
          portfolioCompany: { id: input.portfolioCompanyId },
        },
      },
    },
    verbose,
  );

  return data.ledgerDashboardDetails;
}
