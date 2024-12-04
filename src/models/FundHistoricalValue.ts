import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';
import { FundHistoricalValue as IFundHistoricalValue } from '../types';

class FundHistoricalValue extends Model<IFundHistoricalValue> implements IFundHistoricalValue {
    public code!: string;
    public date!: Date;
    public value?: number;
}

FundHistoricalValue.init({
    code: {
        type: DataTypes.STRING(10),
        primaryKey: true,
        allowNull: false,
        references: {
            model: 'fund_yields',
            key: 'code'
        }
    },
    date: {
        type: DataTypes.DATEONLY,
        primaryKey: true,
        allowNull: false
    },
    value: {
        type: DataTypes.DECIMAL(10, 6),
        allowNull: true
    }
}, {
    sequelize,
    tableName: 'fund_historical_values',
    timestamps: false
});

export default FundHistoricalValue; 