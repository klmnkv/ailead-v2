import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database.js';

export interface BotKnowledgeAttributes {
  id: number;
  bot_id: number;
  knowledge_id: number;
  priority: number;
  created_at?: Date;
}

export interface BotKnowledgeCreationAttributes extends Optional<BotKnowledgeAttributes, 'id' | 'created_at'> {}

export class BotKnowledge extends Model<BotKnowledgeAttributes, BotKnowledgeCreationAttributes> implements BotKnowledgeAttributes {
  declare id: number;
  declare bot_id: number;
  declare knowledge_id: number;
  declare priority: number;
  declare readonly created_at?: Date;
}

BotKnowledge.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    bot_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'ID бота',
    },
    knowledge_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'ID записи базы знаний',
    },
    priority: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Приоритет использования (больше = выше)',
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'bot_knowledge',
    timestamps: false,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['bot_id', 'knowledge_id'],
      },
      {
        fields: ['bot_id'],
      },
      {
        fields: ['knowledge_id'],
      },
    ],
  }
);

export default BotKnowledge;
