import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database.js';

interface MessageAttributes {
  id: number;
  account_id: number;
  integration_id: number;
  lead_id: number;
  message_text: string;
  message_type: 'chat' | 'note' | 'task';
  direction: 'incoming' | 'outgoing';
  status: 'pending' | 'sent' | 'failed';
  processing_time?: number;
  error_message?: string;
  screenshot_url?: string;
  job_id?: string;
  sent_at?: Date;
  created_at?: Date;
  updated_at?: Date;
}

interface MessageCreationAttributes
  extends Optional<MessageAttributes, 'id' | 'created_at' | 'updated_at' | 'sent_at' | 'processing_time' | 'error_message' | 'screenshot_url' | 'job_id'> {}

export class Message extends Model<
  MessageAttributes,
  MessageCreationAttributes
> {}

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
    message_text: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    message_type: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'chat'
    },
    direction: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'outgoing'
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'pending'
    },
    processing_time: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    error_message: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    screenshot_url: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    job_id: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    sent_at: {
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
    tableName: 'messages',
    timestamps: true,
    underscored: true
  }
);