import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

class ApiKey extends Model {
    declare id: string;
    declare key: string;
    declare name: string;
    declare email: string;
    declare description: string;
    declare daily_limit: number;
    declare monthly_limit: number;
    declare is_active: boolean;
    declare expires_at: Date | null;
    declare created_at: Date;
    declare updated_at: Date;
}

ApiKey.init({
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    key: {
        type: DataTypes.STRING(64),
        allowNull: false,
        unique: true
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    email: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    description: {
        type: DataTypes.STRING,
        allowNull: true
    },
    daily_limit: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 100
    },
    monthly_limit: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 3000
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    },
    expires_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    }
}, {
    sequelize,
    modelName: 'ApiKey',
    tableName: 'api_keys',
    timestamps: true,
    underscored: true
});

export default ApiKey; 