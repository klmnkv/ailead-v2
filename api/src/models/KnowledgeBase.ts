import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database.js';

export interface KnowledgeBaseAttributes {
  id: number;
  account_id: number;
  name: string;
  description?: string;
  is_active: boolean;
  is_default: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface KnowledgeBaseCreationAttributes
  extends Optional<KnowledgeBaseAttributes, 'id' | 'created_at' | 'updated_at'> {}

export class KnowledgeBase
  extends Model<KnowledgeBaseAttributes, KnowledgeBaseCreationAttributes>
  implements KnowledgeBaseAttributes {
  declare id: number;
  declare account_id: number;
  declare name: string;
  declare description?: string;
  declare is_active: boolean;
  declare is_default: boolean;
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
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'Название базы знаний',
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Описание базы знаний',
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'Активна ли база знаний',
    },
    is_default: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Использовать по умолчанию',
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
    tableName: 'knowledge_bases',
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
        fields: ['is_default'],
      },
    ],
  }
);

export default KnowledgeBase;
