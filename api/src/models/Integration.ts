// api/src/models/Integration.ts
import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database.js';

interface IntegrationAttributes {
    id: number;
    account_id: number;
    amocrm_account_id: number;
    base_url: string;
    domain?: string;
    client_id?: string;
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
    declare id: number;
    declare account_id: number;
    declare amocrm_account_id: number;
    declare base_url: string;
    declare domain?: string;
    declare client_id?: string;
    declare access_token: string;
    declare refresh_token: string;
    declare token_expiry: number;
    declare status: 'active' | 'expired' | 'revoked';
    declare last_sync_at: Date | null;

    declare readonly created_at: Date;
    declare readonly updated_at: Date;
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
            allowNull: true,
            defaultValue: null
        },
        client_id: {
            type: DataTypes.STRING(255),
            allowNull: true,
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