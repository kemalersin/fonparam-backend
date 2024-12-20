import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

class InflationRate extends Model {
    declare date: Date;
    declare monthly_rate: number;
    declare yearly_rate: number;
}

InflationRate.init({
    date: {
        type: DataTypes.DATEONLY,
        primaryKey: true,
        allowNull: false
    },
    monthly_rate: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        get() {
            const value = this.getDataValue('monthly_rate');
            return value === null ? null : Number(value);
        }
    },
    yearly_rate: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        get() {
            const value = this.getDataValue('yearly_rate');
            return value === null ? null : Number(value);
        }
    }
}, {
    sequelize,
    modelName: 'InflationRate',
    tableName: 'inflation_rates',
    timestamps: false,
    indexes: [
        {
            name: 'idx_date',
            fields: ['date']
        }
    ]
});

export default InflationRate; 