import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export class Message extends Model {
  declare id: number;
  declare account_id: number;
  declare integration_id: number;
  declare lead_id: number;
  declare message_text: string;
  declare message_type: string;
  declare direction: string;
  declare status: string;
  declare processing_time: number | null;
  declare error_message: string | null;
  declare screenshot_url: string | null;
  declare job_id: string | null;
  declare created_at: Date;
  declare sent_at: Date | null;
}

Message.init(
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true
    },
    account_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    integration_id: {
      type: DataTypes.INTEGER,
      allowNull: true
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
      type: DataTypes.STRING(50),
      defaultValue: 'chat'
    },
    direction: {
      type: DataTypes.STRING(20),
      defaultValue: 'outgoing'
    },
    status: {
      type: DataTypes.STRING(50),
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
      type: DataTypes.TEXT,
      allowNull: true
    },
    job_id: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    sent_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  },
  {
    sequelize,
    tableName: 'messages',
    underscored: true,
    timestamps: false
  }
);