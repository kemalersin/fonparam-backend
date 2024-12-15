import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

class DailyStatistics extends Model {
  public date!: Date;
  public total_funds!: number;
  public total_companies!: number;
  public total_investors!: number;
  public total_aum!: number;
  public avg_profit!: number;
  public avg_loss!: number;
}

DailyStatistics.init(
  {
    date: {
      type: DataTypes.DATEONLY,
      primaryKey: true,
      allowNull: false,
    },
    total_funds: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    total_companies: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    total_investors: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    total_aum: {
      type: DataTypes.DECIMAL(20, 2),
      allowNull: false,
    },
    avg_profit: {
      type: DataTypes.DECIMAL(10, 4),
      allowNull: false,
    },
    avg_loss: {
      type: DataTypes.DECIMAL(10, 4),
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'DailyStatistics',
    tableName: 'daily_statistics',
    timestamps: false,
  }
);

export default DailyStatistics; 