import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

interface FundYieldAttributes {
    code: string;
    management_company_id: string;
    title: string;
    type: string;
    tefas?: boolean;
    yield_1m?: number;
    yield_3m?: number;
    yield_6m?: number;
    yield_ytd?: number;
    yield_1y?: number;
    yield_3y?: number;
    yield_5y?: number;
}

class FundYield extends Model<FundYieldAttributes> implements FundYieldAttributes {
    public code!: string;
    public management_company_id!: string;
    public title!: string;
    public type!: string;
    public tefas?: boolean;
    public yield_1m?: number;
    public yield_3m?: number;
    public yield_6m?: number;
    public yield_ytd?: number;
    public yield_1y?: number;
    public yield_3y?: number;
    public yield_5y?: number;
}

FundYield.init(
    {
        code: {
            type: DataTypes.STRING(10),
            primaryKey: true,
            allowNull: false
        },
        management_company_id: {
            type: DataTypes.STRING(10),
            allowNull: false,
            references: {
                model: 'fund_management_companies',
                key: 'code'
            }
        },
        title: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        type: {
            type: DataTypes.STRING(50),
            allowNull: false
        },
        tefas: {
            type: DataTypes.BOOLEAN,
            allowNull: true
        },
        yield_1m: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true
        },
        yield_3m: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true
        },
        yield_6m: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true
        },
        yield_ytd: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true
        },
        yield_1y: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true
        },
        yield_3y: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true
        },
        yield_5y: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true
        }
    },
    {
        sequelize,
        tableName: 'fund_yields',
        timestamps: false
    }
);

export { FundYield }; 