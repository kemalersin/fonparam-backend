import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';
import { FundTypeEnum } from '../types';

class FundTypeYields extends Model {
  public type!: FundTypeEnum;
  public yield_1d?: number;
  public yield_1w?: number;
  public yield_1m?: number;
  public yield_3m?: number;
  public yield_6m?: number;
  public yield_ytd?: number;
  public yield_1y?: number;
  public yield_3y?: number;
  public yield_5y?: number;
  public total_funds!: number;
  public total_aum?: number;
}

FundTypeYields.init(
  {
    type: {
      type: DataTypes.ENUM(...Object.values(FundTypeEnum)),
      primaryKey: true,
      allowNull: false,
    },
    yield_1d: {
      type: DataTypes.DECIMAL(10, 4),
      allowNull: true,
    },
    yield_1w: {
      type: DataTypes.DECIMAL(10, 4),
      allowNull: true,
    },
    yield_1m: {
      type: DataTypes.DECIMAL(10, 4),
      allowNull: true,
    },
    yield_3m: {
      type: DataTypes.DECIMAL(10, 4),
      allowNull: true,
    },
    yield_6m: {
      type: DataTypes.DECIMAL(10, 4),
      allowNull: true,
    },
    yield_ytd: {
      type: DataTypes.DECIMAL(10, 4),
      allowNull: true,
    },
    yield_1y: {
      type: DataTypes.DECIMAL(10, 4),
      allowNull: true,
    },
    yield_3y: {
      type: DataTypes.DECIMAL(10, 4),
      allowNull: true,
    },
    yield_5y: {
      type: DataTypes.DECIMAL(10, 4),
      allowNull: true,
    },
    total_funds: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    total_aum: {
      type: DataTypes.DECIMAL(20, 2),
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'FundTypeYields',
    tableName: 'fund_type_yields',
    timestamps: false,
  }
);

export default FundTypeYields; 