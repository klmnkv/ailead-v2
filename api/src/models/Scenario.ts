import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

export interface ScenarioAttributes {
  id?: number;
  name: string;
  description: string;
  is_active: boolean;
  steps: number;
  trigger_type?: string;
  trigger_conditions?: any;
  actions?: any;
  created_at?: Date;
  updated_at?: Date;
  last_run?: Date;
  runs_count: number;
}

export class Scenario extends Model<ScenarioAttributes> implements ScenarioAttributes {
  declare id: number;
  declare name: string;
  declare description: string;
  declare is_active: boolean;
  declare steps: number;
  declare trigger_type: string;
  declare trigger_conditions: any;
  declare actions: any;
  declare created_at: Date;
  declare updated_at: Date;
  declare last_run: Date;
  declare runs_count: number;
}

Scenario.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    steps: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    trigger_type: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'new_lead, time_based, status_change, etc.'
    },
    trigger_conditions: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'JSON with trigger configuration'
    },
    actions: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'JSON with actions to perform'
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    last_run: {
      type: DataTypes.DATE,
      allowNull: true
    },
    runs_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  },
  {
    sequelize,
    tableName: 'scenarios',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);
