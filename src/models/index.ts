import { FundManagementCompany } from './FundManagementCompany';
import { FundYield } from './FundYield';
import FundHistoricalValue from './FundHistoricalValue';

// İlişkileri tanımla
FundManagementCompany.hasMany(FundYield, {
    sourceKey: 'code',
    foreignKey: 'management_company_id',
    as: 'funds'
});

FundYield.belongsTo(FundManagementCompany, {
    targetKey: 'code',
    foreignKey: 'management_company_id',
    as: 'management_company'
});

FundYield.hasMany(FundHistoricalValue, {
    sourceKey: 'code',
    foreignKey: 'code',
    as: 'historical_values'
});

FundHistoricalValue.belongsTo(FundYield, {
    targetKey: 'code',
    foreignKey: 'code',
    as: 'fund'
});

export {
    FundManagementCompany,
    FundYield,
    FundHistoricalValue
}; 