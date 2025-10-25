import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database.js';

export interface KnowledgeBaseItemAttributes {
  id: number;
  knowledge_base_id: number;
  title: string;
  content: string;
  type: 'text' | 'file' | 'url';
  metadata?: Record<string, any>;
  created_at?: Date;
  updated_at?: Date;
}

export interface KnowledgeBaseItemCreationAttributes
  extends Optional<KnowledgeBaseItemAttributes, 'id' | 'created_at' | 'updated_at'> {}

export class KnowledgeBaseItem
  extends Model<KnowledgeBaseItemAttributes, KnowledgeBaseItemCreationAttributes>
  implements KnowledgeBaseItemAttributes {
  declare id: number;
  declare knowledge_base_id: number;
  declare title: string;
  declare content: string;
  declare type: 'text' | 'file' | 'url';
  declare metadata?: Record<string, any>;
  declare readonly created_at?: Date;
  declare readonly updated_at?: Date;
}

KnowledgeBaseItem.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    knowledge_base_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'ID базы знаний',
      references: {
        model: 'knowledge_bases',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    title: {
      type: DataTypes.STRING(500),
      allowNull: false,
      comment: 'Название элемента',
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'Содержимое элемента',
    },
    type: {
      type: DataTypes.ENUM('text', 'file', 'url'),
      allowNull: false,
      defaultValue: 'text',
      comment: 'Тип элемента',
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Дополнительные метаданные',
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
    tableName: 'knowledge_base_items',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['knowledge_base_id'],
      },
      {
        fields: ['type'],
      },
    ],
  }
);

export default KnowledgeBaseItem;
