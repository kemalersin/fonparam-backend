import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

class FundHistoricalValue extends Model {
    declare code: string;
    declare date: Date;
    declare value: number;
}

FundHistoricalValue.init({
    code: {
        type: DataTypes.STRING(10),
        allowNull: false,
        primaryKey: true
    },
    date: {
        type: DataTypes.DATE,
        allowNull: false,
        primaryKey: true
    },
    value: {
        type: DataTypes.DECIMAL(10, 6),
        allowNull: false
    }
}, {
    sequelize,
    tableName: 'fund_historical_values',
    timestamps: false
});

export default FundHistoricalValue; 