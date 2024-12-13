import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

class FundType extends Model {
    declare type: string;
    declare short_name: string;
    declare long_name: string;
    declare group_name: string;
}

FundType.init({
    type: {
        type: DataTypes.STRING(20),
        primaryKey: true,
        allowNull: false
    },
    short_name: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    long_name: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    group_name: {
        type: DataTypes.STRING(50),
        allowNull: false
    }
}, {
    sequelize,
    tableName: 'fund_types',
    timestamps: false
});

export default FundType;
