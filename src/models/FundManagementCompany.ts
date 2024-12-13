import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

const API_URL = process.env.API_URL || 'http://localhost:3000';

export class FundManagementCompany extends Model {
    public code!: string;
    public title!: string;
    public logo!: string | null;
    public total_funds!: number | null;
    public avg_yield_1d!: number | null;
    public avg_yield_1w!: number | null;
    public avg_yield_1m!: number | null;
    public avg_yield_6m!: number | null;
    public avg_yield_ytd!: number | null;
    public avg_yield_1y!: number | null;
    public avg_yield_3y!: number | null;
    public avg_yield_5y!: number | null;

    // Logo için getter
    get logoUrl(): string | null {
        return this.logo ? `${API_URL}/public/logos/${this.logo}` : null;
    }

    // JSON dönüşümü için
    toJSON() {
        const values = super.toJSON();
        return {
            ...values,
            logo: this.logoUrl
        };
    }
}

FundManagementCompany.init({
    code: {
        type: DataTypes.STRING(10),
        primaryKey: true,
        allowNull: false
    },
    title: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    logo: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    total_funds: {
        type: DataTypes.INTEGER,
        allowNull: true,
        get() {
            const value = this.getDataValue('total_funds');
            return value === null ? null : Number(value);
        }
    },
    avg_yield_1d: {
        type: DataTypes.DECIMAL(10, 4),
        allowNull: true,
        get() {
            const value = this.getDataValue('avg_yield_1d');
            return value === null ? null : Number(value);
        }
    },
    avg_yield_1w: {
        type: DataTypes.DECIMAL(10, 4),
        allowNull: true,
        get() {
            const value = this.getDataValue('avg_yield_1w');
            return value === null ? null : Number(value);
        }
    },
    avg_yield_1m: {
        type: DataTypes.DECIMAL(10, 4),
        allowNull: true,
        get() {
            const value = this.getDataValue('avg_yield_1m');
            return value === null ? null : Number(value);
        }
    },
    avg_yield_6m: {
        type: DataTypes.DECIMAL(10, 4),
        allowNull: true,
        get() {
            const value = this.getDataValue('avg_yield_6m');
            return value === null ? null : Number(value);
        }
    },
    avg_yield_ytd: {
        type: DataTypes.DECIMAL(10, 4),
        allowNull: true,
        get() {
            const value = this.getDataValue('avg_yield_ytd');
            return value === null ? null : Number(value);
        }
    },
    avg_yield_1y: {
        type: DataTypes.DECIMAL(10, 4),
        allowNull: true,
        get() {
            const value = this.getDataValue('avg_yield_1y');
            return value === null ? null : Number(value);
        }
    },
    avg_yield_3y: {
        type: DataTypes.DECIMAL(10, 4),
        allowNull: true,
        get() {
            const value = this.getDataValue('avg_yield_3y');
            return value === null ? null : Number(value);
        }
    },
    avg_yield_5y: {
        type: DataTypes.DECIMAL(10, 4),
        allowNull: true,
        get() {
            const value = this.getDataValue('avg_yield_5y');
            return value === null ? null : Number(value);
        }
    }
}, {
    sequelize,
    tableName: 'fund_management_companies',
    timestamps: false
}); 