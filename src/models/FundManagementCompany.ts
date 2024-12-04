import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';
import { FundYield } from './FundYield';

interface FundManagementCompanyAttributes {
    code: string;
    title: string;
    logo?: string;
    funds?: FundYield[];
}

class FundManagementCompany extends Model<FundManagementCompanyAttributes> implements FundManagementCompanyAttributes {
    public code!: string;
    public title!: string;
    public logo?: string;
    public funds?: FundYield[];
}

FundManagementCompany.init(
    {
        code: {
            type: DataTypes.STRING(10),
            primaryKey: true,
            allowNull: false
        },
        title: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        logo: {
            type: DataTypes.STRING,
            allowNull: true
        }
    },
    {
        sequelize,
        tableName: 'fund_management_companies',
        timestamps: false
    }
);

export { FundManagementCompany }; 