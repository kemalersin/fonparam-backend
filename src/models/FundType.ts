import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';
import { FundTypeEnum } from '../types';

class FundType extends Model {
    declare type: FundTypeEnum;
    declare short_name: string;
    declare long_name: string;
    declare group_name: string;
}

FundType.init({
    type: {
        type: DataTypes.ENUM(...Object.values(FundTypeEnum)),
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
