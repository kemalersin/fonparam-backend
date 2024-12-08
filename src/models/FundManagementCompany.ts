import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

const API_URL = process.env.API_URL || 'http://localhost:3000';

export class FundManagementCompany extends Model {
    public code!: string;
    public title!: string;
    public logo!: string | null;

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
        type: DataTypes.STRING(100),
        allowNull: false
    },
    logo: {
        type: DataTypes.STRING(100),
        allowNull: true
    }
}, {
    sequelize,
    tableName: 'fund_management_companies',
    timestamps: false
}); 