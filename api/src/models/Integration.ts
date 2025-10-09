// api/src/models/Integration.ts
import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database.js';

interface IntegrationAttributes {
    id: number;
    account_id: number;
    amocrm_account_id: number;
    base_url: string;
    domain?: string;  // ← сделали optional
    client_id?: string;  // ← сделали optional
    access_token: string;
    refresh_token: string;
    token_expiry: number;
    status: 'active' | 'expired' | 'revoked';
    last_sync_at: Date | null;
    created_at: Date;
    updated_at: Date;
}

interface IntegrationCreationAttributes
    extends Optional<IntegrationAttributes, 'id' | 'domain' | 'client_id' | 'last_sync_at' | 'created_at' | 'updated_at'> {}

export class Integration extends Model<IntegrationAttributes, IntegrationCreationAttributes>
    implements IntegrationAttributes {
    public id!: number;
    public account_id!: number;
    public amocrm_account_id!: number;
    public base_url!: string;
    public domain?: string;  // ← изменили
    public client_id?: string;  // ← изменили
    public access_token!: string;
    public refresh_token!: string;
    public token_expiry!: number;
    public status!: 'active' | 'expired' | 'revoked';
    public last_sync_at!: Date | null;

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
            }
        },
        amocrm_account_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        base_url: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        domain: {
            type: DataTypes.STRING(255),
            allowNull: true,  // ← ВАЖНО: true вместо false
            defaultValue: null
        },
        client_id: {
            type: DataTypes.STRING(255),
            allowNull: true,  // ← ВАЖНО: true вместо false
            defaultValue: null
        },
        access_token: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        refresh_token: {
            type: DataTypes.TEXT,
            allowNull: false
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
        tableName: 'integrations',
        timestamps: true,
        underscored: true
    }
);