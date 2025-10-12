import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database.js';

interface MessageAttributes {
  id: number;
  account_id: number;
  integration_id: number;
  lead_id: number;
  contact_id?: number;
  message_text?: string;
  message_type: string;
  direction: string;
  status: string;
  job_id?: string;
  error_message?: string;
  sent_at?: Date;
  processing_time?: number;
  metadata?: string;
  created_at?: Date;
  updated_at?: Date;
}

interface MessageCreationAttributes
  extends Optional<MessageAttributes, 'id' | 'created_at' | 'updated_at'> {}

export class Message extends Model<
  MessageAttributes,
  MessageCreationAttributes
> implements MessageAttributes {
  public id!: number;
  public account_id!: number;
  public integration_id!: number;
  public lead_id!: number;
  public contact_id?: number;
  public message_text?: string;
  public message_type!: string;
  public direction!: string;
  public status!: string;
  public job_id?: string;
  public error_message?: string;
  public sent_at?: Date;
  public processing_time?: number;
  public metadata?: string;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Message.init(
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
    integration_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    lead_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    contact_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    message_text: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    message_type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'chat'
    },
    direction: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'outgoing'
    },
    status: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'pending'
    },
    job_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: true
    },
    error_message: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    sent_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    processing_time: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    metadata: {
      type: DataTypes.TEXT,
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
    tableName: 'messages',
    timestamps: true,
    underscored: true
  }
);