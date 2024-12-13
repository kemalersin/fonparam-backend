import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';
import { FundTypeEnum } from '../types';

class Fund extends Model {
    declare code: string;
    declare management_company_id: string;
    declare title: string;
    declare type: FundTypeEnum;
    declare tefas: boolean;
    declare has_historical_data: boolean;
    declare historical_data_check_date: Date;
}

Fund.init({
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
        type: DataTypes.STRING(255),
        allowNull: false
    },
    type: {
        type: DataTypes.ENUM(...Object.values(FundTypeEnum)),
        allowNull: false
    },
    tefas: {
        type: DataTypes.BOOLEAN,
        allowNull: true
    },
    has_historical_data: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    },
    historical_data_check_date: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    sequelize,
    tableName: 'funds',
    timestamps: false
});

export default Fund;
