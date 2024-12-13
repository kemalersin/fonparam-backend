import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

class FundYield extends Model {
    public code!: string;
    public yield_1d!: number | null;
    public yield_1w!: number | null;
    public yield_1m!: number | null;
    public yield_3m!: number | null;
    public yield_6m!: number | null;
    public yield_ytd!: number | null;
    public yield_1y!: number | null;
    public yield_3y!: number | null;
    public yield_5y!: number | null;
}

FundYield.init(
    {
        code: {
            type: DataTypes.STRING(10),
            primaryKey: true,
            allowNull: false,
            references: {
                model: 'funds',
                key: 'code'
            }
        },
        yield_1d: {
            type: DataTypes.DECIMAL(10, 4),
            allowNull: true,
            get() {
                const value = this.getDataValue('yield_1d');
                return value === null ? null : Number(value);
            }
        },
        yield_1w: {
            type: DataTypes.DECIMAL(10, 4),
            allowNull: true,
            get() {
                const value = this.getDataValue('yield_1w');
                return value === null ? null : Number(value);
            }
        },
        yield_1m: {
            type: DataTypes.DECIMAL(10, 4),
            allowNull: true,
            get() {
                const value = this.getDataValue('yield_1m');
                return value === null ? null : Number(value);
            }
        },
        yield_3m: {
            type: DataTypes.DECIMAL(10, 4),
            allowNull: true,
            get() {
                const value = this.getDataValue('yield_3m');
                return value === null ? null : Number(value);
            }
        },
        yield_6m: {
            type: DataTypes.DECIMAL(10, 4),
            allowNull: true,
            get() {
                const value = this.getDataValue('yield_6m');
                return value === null ? null : Number(value);
            }
        },
        yield_ytd: {
            type: DataTypes.DECIMAL(10, 4),
            allowNull: true,
            get() {
                const value = this.getDataValue('yield_ytd');
                return value === null ? null : Number(value);
            }
        },
        yield_1y: {
            type: DataTypes.DECIMAL(10, 4),
            allowNull: true,
            get() {
                const value = this.getDataValue('yield_1y');
                return value === null ? null : Number(value);
            }
        },
        yield_3y: {
            type: DataTypes.DECIMAL(10, 4),
            allowNull: true,
            get() {
                const value = this.getDataValue('yield_3y');
                return value === null ? null : Number(value);
            }
        },
        yield_5y: {
            type: DataTypes.DECIMAL(10, 4),
            allowNull: true,
            get() {
                const value = this.getDataValue('yield_5y');
                return value === null ? null : Number(value);
            }
        }
    },
    {
        sequelize,
        tableName: 'fund_yields',
        timestamps: false
    }
);

export { FundYield }; 