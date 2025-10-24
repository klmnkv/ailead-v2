import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database.js';

export interface KnowledgeBaseAttributes {
  id: number;
  account_id: number;
  title: string;
  content: string;
  category?: string;
  tags?: string;
  is_active: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface KnowledgeBaseCreationAttributes extends Optional<KnowledgeBaseAttributes, 'id' | 'created_at' | 'updated_at'> {}

export class KnowledgeBase extends Model<KnowledgeBaseAttributes, KnowledgeBaseCreationAttributes> implements KnowledgeBaseAttributes {
  declare id: number;
  declare account_id: number;
  declare title: string;
  declare content: string;
  declare category?: string;
  declare tags?: string;
  declare is_active: boolean;
  declare readonly created_at?: Date;
  declare readonly updated_at?: Date;
}

KnowledgeBase.init(
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
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'Название записи в базе знаний',
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'Содержимое записи',
    },
    category: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Категория записи',
    },
    tags: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Теги для поиска (через запятую)',
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'Активна ли запись',
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
    tableName: 'knowledge_base',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['account_id'],
      },
      {
        fields: ['is_active'],
      },
      {
        fields: ['category'],
      },
    ],
  }
);

export default KnowledgeBase;
