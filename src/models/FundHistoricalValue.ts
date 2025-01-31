import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

class FundHistoricalValue extends Model {
    declare code: string;
    declare date: Date;
    declare value: number;
    declare aum: number;
    declare shares_active: number;    
    declare shares_total: number | null;    
    declare yield: number | null;
    declare cumulative_cashflow: number | null;
    declare investor_count: number | null;
    declare management_fee: number | null;    
    declare risk_value: number | null;
    declare purchase_value_day: number | null;    
    declare sale_value_day: number | null;
    declare occupancy_rate: number | null;
    declare market_share: number | null;
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
    },
    risk_value: {
        type: DataTypes.TINYINT,
        allowNull: true,
        validate: {
            min: 1,
            max: 7
        },
        comment: 'Fonun risk seviyesi (1-7 arası, 1: En düşük risk, 7: En yüksek risk)'
    },
    purchase_value_day: {
        type: DataTypes.TINYINT,
        allowNull: true,
        comment: 'Alım valör günü'
    },
    sale_value_day: {
        type: DataTypes.TINYINT,
        allowNull: true,
        comment: 'Satım valör günü'
    },
    shares_active: {
        type: DataTypes.DECIMAL(20, 2),
        allowNull: true,
        get() {
            const value = this.getDataValue('shares_active');
            return value === null ? null : Number(value);
        }
    },    
    shares_total: {
        type: DataTypes.DECIMAL(20, 2),
        allowNull: true,
        comment: 'Toplam pay sayısı',
        get() {
            const value = this.getDataValue('shares_total');
            return value === null ? null : Number(value);
        }
    },
    occupancy_rate: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
        comment: 'Doluluk oranı (%)',
        get() {
            const value = this.getDataValue('occupancy_rate');
            return value === null ? null : Number(value);
        }
    },
    market_share: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
        comment: 'Pazar payı (%)',
        get() {
            const value = this.getDataValue('market_share');
            return value === null ? null : Number(value);
        }
    },
    management_fee: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
        comment: 'Yönetim ücreti (%)',
        get() {
            const value = this.getDataValue('management_fee');
            return value === null ? null : Number(value);
        }
    }
}, {
    sequelize,
    tableName: 'fund_historical_values',
    timestamps: false
});

export default FundHistoricalValue; 