import { Op, Sequelize } from 'sequelize';
import { FundManagementCompany } from './FundManagementCompany';
import FundYield from './FundYield';
import FundHistoricalValue from './FundHistoricalValue';
import Fund from './Fund';
import FundType from './FundType';
import DailyStatistics from './DailyStatistics';
import FundTypeYields from './FundTypeYields';
import sequelize from '../config/database';

// İlişkileri tanımla
FundManagementCompany.hasMany(Fund, {
    sourceKey: 'code',
    foreignKey: 'management_company_id',
    as: 'funds'
});

Fund.belongsTo(FundManagementCompany, {
    targetKey: 'code',
    foreignKey: 'management_company_id',
    as: 'management_company'
});

Fund.belongsTo(FundType, {
    targetKey: 'type',
    foreignKey: 'type',
    as: 'fund_type'
});

Fund.hasOne(FundYield, {
    sourceKey: 'code',
    foreignKey: 'code',
    as: 'yield'
});

FundYield.belongsTo(Fund, {
    targetKey: 'code',
    foreignKey: 'code',
    as: 'fund'
});

Fund.hasOne(FundHistoricalValue, {
    sourceKey: 'code',
    foreignKey: 'code',
    as: 'last_historical_value',
    scope: {
        date: {
            [Op.eq]: sequelize.literal(`(
                SELECT MAX(date) 
                FROM fund_historical_values AS hv 
                WHERE hv.code = Fund.code
            )`)
        }
    }
});

FundHistoricalValue.belongsTo(Fund, {
    targetKey: 'code',
    foreignKey: 'code',
    as: 'fund'
});

FundTypeYields.belongsTo(FundType, {
    targetKey: 'type',
    foreignKey: 'type',
    as: 'fund_type'
});

FundType.hasOne(FundTypeYields, {
    sourceKey: 'type',
    foreignKey: 'type',
    as: 'yields'
});

export {
    FundManagementCompany,
    Fund,
    FundType,
    FundYield,
    FundHistoricalValue,
    DailyStatistics,
    FundTypeYields
}; 