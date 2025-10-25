import { Account } from './Account.js';
import { Integration } from './Integration.js';
import { Message } from './Message.js';
import { Bot } from './Bot.js';
import { KnowledgeBase } from './KnowledgeBase.js';
import { KnowledgeBaseItem } from './KnowledgeBaseItem.js';

// Связи
Account.hasMany(Integration, {
  foreignKey: 'account_id',
  as: 'integrations'
});

Integration.belongsTo(Account, {
  foreignKey: 'account_id',
  as: 'account'
});

Account.hasMany(Message, {
  foreignKey: 'account_id',
  as: 'messages'
});

Message.belongsTo(Account, {
  foreignKey: 'account_id',
  as: 'account'
});

Integration.hasMany(Message, {
  foreignKey: 'integration_id',
  as: 'messages'
});

Message.belongsTo(Integration, {
  foreignKey: 'integration_id',
  as: 'integration'
});

// Bot связи
Account.hasMany(Bot, {
  foreignKey: 'account_id',
  as: 'bots'
});

Bot.belongsTo(Account, {
  foreignKey: 'account_id',
  as: 'account'
});

// Knowledge Base связи
Account.hasMany(KnowledgeBase, {
  foreignKey: 'account_id',
  as: 'knowledge_bases'
});

KnowledgeBase.belongsTo(Account, {
  foreignKey: 'account_id',
  as: 'account'
});

KnowledgeBase.hasMany(KnowledgeBaseItem, {
  foreignKey: 'knowledge_base_id',
  as: 'items'
});

KnowledgeBaseItem.belongsTo(KnowledgeBase, {
  foreignKey: 'knowledge_base_id',
  as: 'knowledge_base'
});

Bot.belongsTo(KnowledgeBase, {
  foreignKey: 'knowledge_base_id',
  as: 'knowledge_base'
});

export { Account, Integration, Message, Bot, KnowledgeBase, KnowledgeBaseItem };