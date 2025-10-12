import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database.js';

interface IntegrationAttributes {
  id: number;
  account_id: number;
  amocrm_account_id: number;
  domain?: string;
  base_url: string;
  client_id?: string;
  access_token: string;
  refresh_token: string;
  token_expiry: number;
  email?: string;
  password?: string;
  status: string;
  last_sync_at?: Date;
  created_at?: Date;
  updated_at?: Date;
}

interface IntegrationCreationAttributes
  extends Optional<IntegrationAttributes, 'id' | 'created_at' | 'updated_at'> {}

export class Integration extends Model<
  IntegrationAttributes,
  IntegrationCreationAttributes
> implements IntegrationAttributes {
  public id!: number;
  public account_id!: number;
  public amocrm_account_id!: number;
  public domain?: string;
  public base_url!: string;
  public client_id?: string;
  public access_token!: string;
  public refresh_token!: string;
  public token_expiry!: number;
  public email?: string;
  public password?: string;
  public status!: string;
  public last_sync_at?: Date;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
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
    client_id: {
      type: DataTypes.STRING(255),
      allowNull: true
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
    last_sync_at: {
      type: DataTypes.DATE,
      allowNull: true
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