import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database.js';

interface IntegrationAttributes {
  id: number;
  account_id: number;
  amocrm_account_id: number;
  domain: string;
  base_url: string;
  access_token: string;
  refresh_token: string;
  token_expiry: number;
  email?: string;
  password?: string;
  status: string;
  created_at?: Date;
  updated_at?: Date;
}

interface IntegrationCreationAttributes
  extends Optional<IntegrationAttributes, 'id' | 'created_at' | 'updated_at'> {}

export class Integration extends Model<
  IntegrationAttributes,
  IntegrationCreationAttributes
> {
  toJSON() {
    const values = super.toJSON();
    delete values.access_token;
    delete values.refresh_token;
    delete values.password;
    return values;
  }
}

Integration.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    account_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    amocrm_account_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true
    },
    domain: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    base_url: {
      type: DataTypes.STRING(500),
      allowNull: false
    },
    access_token: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    refresh_token: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    token_expiry: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    status: {
      type: DataTypes.STRING(50),
      defaultValue: 'active',
      allowNull: false
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  },
  {
    sequelize,
    tableName: 'integrations',
    timestamps: true,
    underscored: true
  }
);