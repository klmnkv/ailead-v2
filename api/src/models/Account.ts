import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export class Account extends Model {
  declare id: number;
  declare email: string;
  declare password_hash: string;
  declare company_name: string | null;
  declare subscription_plan: string;
  declare token_balance: number;
  declare created_at: Date;
  declare updated_at: Date;
}

Account.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    company_name: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    subscription_plan: {
      type: DataTypes.STRING(50),
      defaultValue: 'free'
    },
    token_balance: {
      type: DataTypes.INTEGER,
      defaultValue: 1000
    }
  },
  {
    sequelize,
    tableName: 'accounts',
    underscored: true,
    timestamps: true
  }
);