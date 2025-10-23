import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

export interface BotAttributes {
  id?: number;
  account_id: number;
  name: string;
  description?: string;
  funnel?: string;
  stage?: string;
  is_active: boolean;
  prompt: string;
  model: string;
  temperature?: number;
  max_tokens?: number;
  deactivation_conditions?: string;
  deactivation_message?: string;
  files?: any;
  actions?: any;
  created_at?: Date;
  updated_at?: Date;
}

export class Bot extends Model<BotAttributes> implements BotAttributes {
  declare id: number;
  declare account_id: number;
  declare name: string;
  declare description: string;
  declare funnel: string;
  declare stage: string;
  declare is_active: boolean;
  declare prompt: string;
  declare model: string;
  declare temperature: number;
  declare max_tokens: number;
  declare deactivation_conditions: string;
  declare deactivation_message: string;
  declare files: any;
  declare actions: any;
  declare created_at: Date;
  declare updated_at: Date;
}

Bot.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    account_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'ID аккаунта amoCRM'
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'Название бота'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Описание бота'
    },
    funnel: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Воронка'
    },
    stage: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Этап воронки'
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Активен ли бот'
    },
    prompt: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'Промпт для AI'
    },
    model: {
      type: DataTypes.STRING(50),
      defaultValue: 'GPT-4',
      comment: 'Модель AI (GPT-4, GPT-3.5, Claude)'
    },
    temperature: {
      type: DataTypes.DECIMAL(2, 1),
      defaultValue: 0.7,
      comment: 'Температура модели (0-1)'
    },
    max_tokens: {
      type: DataTypes.INTEGER,
      defaultValue: 500,
      comment: 'Максимум токенов на ответ'
    },
    deactivation_conditions: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Условия отключения бота'
    },
    deactivation_message: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Сообщение при отключении'
    },
    files: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Файлы для обучения бота'
    },
    actions: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Действия при достижении цели'
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
    tableName: 'bots',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);
