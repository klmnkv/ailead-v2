import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export class Message extends Model {
  public id!: number;
  public account_id!: number;
  public integration_id?: number;
  public lead_id!: number;
  public message_text!: string;
  public message_type!: string;
  public direction!: string;
  public status!: string;
  public processing_time?: number;
  public error_message?: string;
  public screenshot_url?: string;
  public job_id?: string;
  public readonly created_at!: Date;
  public sent_at?: Date;
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
      allowNull: false,
      references: {
        model: 'accounts',
        key: 'id'
      }
    },
    integration_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'integrations',
        key: 'id'
      }
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
      defaultValue: 'chat',
      validate: {
        isIn: [['chat', 'note', 'task', 'email']]
      }
    },
    direction: {
      type: DataTypes.STRING(20),
      defaultValue: 'outgoing',
      validate: {
        isIn: [['incoming', 'outgoing']]
      }
    },
    status: {
      type: DataTypes.STRING(50),
      defaultValue: 'pending',
      validate: {
        isIn: [['pending', 'queued', 'processing', 'sent', 'failed']]
      }
    },
    processing_time: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Processing time in milliseconds'
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
    sent_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  },
  {
    sequelize,
    tableName: 'messages',
    underscored: true,
    timestamps: true,
    updatedAt: false, // Только created_at, без updated_at
    indexes: [
      {
        fields: ['account_id', 'lead_id']
      },
      {
        fields: ['status']
      },
      {
        fields: ['created_at']
      },
      {
        fields: ['job_id']
      }
    ]
  }
);