import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

class ApiLog extends Model {
    declare id: string;
    declare ip_address: string;
    declare api_key: string | null;
    declare endpoint: string;
    declare method: string;
    declare status_code: number;
    declare response_time: number;
    declare is_whitelisted: boolean;
    declare created_at: Date;
}

ApiLog.init({
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    ip_address: {
        type: DataTypes.STRING(45), // IPv6 için yeterli uzunluk
        allowNull: false
    },
    api_key: {
        type: DataTypes.STRING(64),
        allowNull: true,
        references: {
            model: 'api_keys',
            key: 'key'
        }
    },
    endpoint: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    method: {
        type: DataTypes.STRING(10),
        allowNull: false
    },
    status_code: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    response_time: {
        type: DataTypes.INTEGER, // milisaniye cinsinden
        allowNull: false
    },
    is_whitelisted: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    }
}, {
    sequelize,
    modelName: 'ApiLog',
    tableName: 'api_logs',
    timestamps: false
});

export default ApiLog; 