import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

class FundHistoricalValue extends Model {
    declare code: string;
    declare date: Date;
    declare value: number;
    declare aum: number | null;
    declare shares_active: number | null;
    declare yield: number | null;
    declare cumulative_cashflow: number | null;
    declare investor_count: number | null;
}

FundHistoricalValue.init({
    code: {
        type: DataTypes.STRING(10),
        allowNull: false,
        primaryKey: true,
        references: {
            model: 'funds',
            key: 'code'
        }
    },
    date: {
        type: DataTypes.DATE,
        allowNull: false,
        primaryKey: true
    },
    value: {
        type: DataTypes.DECIMAL(10, 6),
        allowNull: false,
        get() {
            const value = this.getDataValue('value');
            return value === null ? null : Number(value);
        }
    },
    aum: {
        type: DataTypes.DECIMAL(20, 2),
        allowNull: true,
        get() {
            const value = this.getDataValue('aum');
            return value === null ? null : Number(value);
        }
    },
    shares_active: {
        type: DataTypes.DECIMAL(20, 2),
        allowNull: true,
        get() {
            const value = this.getDataValue('shares_active');
            return value === null ? null : Number(value);
        }
    },
    yield: {
        type: DataTypes.DECIMAL(10, 4),
        allowNull: true,
        get() {
            const value = this.getDataValue('yield');
            return value === null ? null : Number(value);
        }
    },
    cumulative_cashflow: {
        type: DataTypes.DECIMAL(20, 2),
        allowNull: true,
        get() {
            const value = this.getDataValue('cumulative_cashflow');
            return value === null ? null : Number(value);
        }
    },
    investor_count: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
}, {
    sequelize,
    tableName: 'fund_historical_values',
    timestamps: false
});

export default FundHistoricalValue; 