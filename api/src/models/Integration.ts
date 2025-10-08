import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';
import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your_encryption_key_must_be_exactly_32_characters_long';

export class Integration extends Model {
  declare id: number;
  declare account_id: number;
  declare amocrm_account_id: number;
  declare base_url: string;
  declare access_token: string;
  declare refresh_token: string;
  declare token_expiry: number;
  declare status: string;
  declare last_sync_at: Date | null;
  declare created_at: Date;
  declare updated_at: Date;
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
      allowNull: false
    },
    amocrm_account_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    base_url: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    access_token: {
      type: DataTypes.TEXT,
      allowNull: false,
      get() {
        const encrypted = this.getDataValue('access_token');
        if (!encrypted) return '';
        try {
          const decrypted = CryptoJS.AES.decrypt(encrypted, ENCRYPTION_KEY);
          return decrypted.toString(CryptoJS.enc.Utf8);
        } catch (error) {
          return encrypted; // Если не зашифровано, возвращаем как есть
        }
      },
      set(value: string) {
        const encrypted = CryptoJS.AES.encrypt(value, ENCRYPTION_KEY).toString();
        this.setDataValue('access_token', encrypted);
      }
    },
    refresh_token: {
      type: DataTypes.TEXT,
      allowNull: false,
      get() {
        const encrypted = this.getDataValue('refresh_token');
        if (!encrypted) return '';
        try {
          const decrypted = CryptoJS.AES.decrypt(encrypted, ENCRYPTION_KEY);
          return decrypted.toString(CryptoJS.enc.Utf8);
        } catch (error) {
          return encrypted;
        }
      },
      set(value: string) {
        const encrypted = CryptoJS.AES.encrypt(value, ENCRYPTION_KEY).toString();
        this.setDataValue('refresh_token', encrypted);
      }
    },
    token_expiry: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    status: {
      type: DataTypes.STRING(50),
      defaultValue: 'active'
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
    timestamps: true
  }
);