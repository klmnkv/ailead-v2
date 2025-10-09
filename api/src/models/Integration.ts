import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';
import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default_key_change_in_production_32c';

/**
 * Шифрует токен
 */
function encryptToken(token: string): string {
  return CryptoJS.AES.encrypt(token, ENCRYPTION_KEY).toString();
}

/**
 * Расшифровывает токен
 */
function decryptToken(encrypted: string): string {
  try {
    const bytes = CryptoJS.AES.decrypt(encrypted, ENCRYPTION_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error('Token decryption failed:', error);
    return '';
  }
}

export class Integration extends Model {
  public id!: number;
  public account_id!: number;
  public amocrm_account_id!: number;
  public base_url!: string;
  public access_token!: string;
  public refresh_token!: string;
  public token_expiry!: number;
  public status!: string;
  public last_sync_at?: Date;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Integration.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    account_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'accounts',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    amocrm_account_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    base_url: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        isUrl: true
      }
    },
    access_token: {
      type: DataTypes.TEXT,
      allowNull: false,
      get() {
        const encrypted = this.getDataValue('access_token');
        return encrypted ? decryptToken(encrypted) : '';
      },
      set(value: string) {
        this.setDataValue('access_token', encryptToken(value));
      }
    },
    refresh_token: {
      type: DataTypes.TEXT,
      allowNull: false,
      get() {
        const encrypted = this.getDataValue('refresh_token');
        return encrypted ? decryptToken(encrypted) : '';
      },
      set(value: string) {
        this.setDataValue('refresh_token', encryptToken(value));
      }
    },
    token_expiry: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Unix timestamp of token expiry'
    },
    status: {
      type: DataTypes.STRING(50),
      defaultValue: 'active',
      validate: {
        isIn: [['active', 'inactive', 'expired', 'error']]
      }
    },
    last_sync_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  },
  {
    sequelize,
    tableName: 'integrations',
    underscored: true,
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['account_id', 'amocrm_account_id']
      },
      {
        fields: ['status']
      }
    ]
  }
);