import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';
import { FundTypeEnum } from '../types';
import FundType from './FundType';
import FundYield from './FundYield';

class Fund extends Model {
    declare code: string;
    declare management_company_id: string;
    declare title: string;
    declare type: FundTypeEnum;
    declare tefas: boolean;
    declare has_historical_data: boolean;
    declare historical_data_check_date: Date;
    declare risk_value: number | null;
    declare purchase_value_day: number | null;
    declare sale_value_day: number | null;
    declare management_fee: number | null;
    declare fund_type?: FundType;
    declare yield?: FundYield;
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
    },
    risk_value: {
        type: DataTypes.INTEGER,
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
    management_fee: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
        comment: 'Yönetim ücreti (%)'
    }
}, {
    sequelize,
    tableName: 'funds',
    timestamps: false
});

export default Fund;
