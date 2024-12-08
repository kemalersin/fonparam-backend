import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';
import { FundManagementCompany } from './FundManagementCompany';

const API_URL = process.env.API_URL || 'http://localhost:3000';

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
    management_company?: FundManagementCompany;
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
    public management_company?: FundManagementCompany;

    // JSON dönüşümü için
    toJSON() {
        const values = Object.assign({}, super.toJSON()) as Record<string, any>;

        // Getiri alanlarını number'a çevir
        ['yield_1m', 'yield_3m', 'yield_6m', 'yield_ytd', 'yield_1y', 'yield_3y', 'yield_5y'].forEach(field => {
            if (values[field] !== null && values[field] !== undefined) {
                values[field] = Number(values[field]);
            }
        });

        if (values.management_company) {
            // Eğer management_company bir instance ise
            if (values.management_company instanceof FundManagementCompany) {
                values.management_company = values.management_company.toJSON();
            }
            // Logo URL'sini güncelle
            const company = values.management_company as { logo?: string };
            if (company && company.logo) {
                company.logo = `${API_URL}/public/logos/${company.logo}`;
            }
        }
        return values;
    }
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