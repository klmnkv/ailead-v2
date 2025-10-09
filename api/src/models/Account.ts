import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export class Account extends Model {
  public id!: number;
  public email!: string;
  public password_hash!: string;
  public company_name?: string;
  public subscription_plan!: string;
  public token_balance!: number;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
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
      defaultValue: 'free',
      validate: {
        isIn: [['free', 'basic', 'pro', 'enterprise']]
      }
    },
    token_balance: {
      type: DataTypes.INTEGER,
      defaultValue: 1000,
      validate: {
        min: 0
      }
    }
  },
  {
    sequelize,
    tableName: 'accounts',
    underscored: true,
    timestamps: true
  }
);