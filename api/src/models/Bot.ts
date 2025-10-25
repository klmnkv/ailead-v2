import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database.js';

export interface BotAttributes {
  id: number;
  account_id: number;
  name: string;
  description?: string;
  prompt: string;
  ai_provider?: string;
  api_key?: string;
  model: string;
  temperature: number;
  max_tokens: number;
  pipeline_id?: number;
  stage_id?: number;
  knowledge_base_id?: number;
  knowledge_base_items?: number[];
  deactivation_conditions?: string;
  deactivation_message?: string;
  is_active: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface BotCreationAttributes extends Optional<BotAttributes, 'id' | 'created_at' | 'updated_at'> {}

export class Bot extends Model<BotAttributes, BotCreationAttributes> implements BotAttributes {
  declare id: number;
  declare account_id: number;
  declare name: string;
  declare description?: string;
  declare prompt: string;
  declare ai_provider?: string;
  declare api_key?: string;
  declare model: string;
  declare temperature: number;
  declare max_tokens: number;
  declare pipeline_id?: number;
  declare stage_id?: number;
  declare knowledge_base_id?: number;
  declare knowledge_base_items?: number[];
  declare deactivation_conditions?: string;
  declare deactivation_message?: string;
  declare is_active: boolean;
  declare readonly created_at?: Date;
  declare readonly updated_at?: Date;

  // Скрываем api_key из JSON ответа
  toJSON() {
    const values = { ...this.get() };
    if (values.api_key) {
      values.api_key = '***hidden***';
    }
    return values;
  }
}

Bot.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    account_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'ID аккаунта amoCRM',
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'Название бота',
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Описание бота',
    },
    prompt: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'Промпт для AI',
    },
    ai_provider: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: 'openai',
      comment: 'Провайдер AI (openai, anthropic)',
    },
    api_key: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'API ключ для провайдера AI',
    },
    model: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: 'gpt-3.5-turbo',
      comment: 'Модель AI',
    },
    temperature: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0.7,
      comment: 'Temperature (0-2) - креативность ответов',
    },
    max_tokens: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 500,
      comment: 'Максимальное количество токенов в ответе',
    },
    pipeline_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'ID воронки в amoCRM',
    },
    stage_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'ID этапа в воронке amoCRM',
    },
    knowledge_base_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'ID базы знаний',
    },
    knowledge_base_items: {
      type: DataTypes.ARRAY(DataTypes.INTEGER),
      allowNull: true,
      defaultValue: [],
      comment: 'Массив ID выбранных элементов базы знаний',
    },
    deactivation_conditions: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Условия отключения бота',
    },
    deactivation_message: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Сообщение при отключении бота',
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Активен ли бот',
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'bots',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['account_id'],
      },
      {
        fields: ['is_active'],
      },
    ],
  }
);

export default Bot;
