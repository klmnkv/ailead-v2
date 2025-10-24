import { Account } from './Account.js';
import { Integration } from './Integration.js';
import { Message } from './Message.js';
import { Bot } from './Bot.js';
import { KnowledgeBase } from './KnowledgeBase.js';
import { BotKnowledge } from './BotKnowledge.js';

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

// KnowledgeBase связи
Account.hasMany(KnowledgeBase, {
  foreignKey: 'account_id',
  as: 'knowledge_base'
});

KnowledgeBase.belongsTo(Account, {
  foreignKey: 'account_id',
  as: 'account'
});

// Bot и KnowledgeBase связь многие-ко-многим через BotKnowledge
Bot.belongsToMany(KnowledgeBase, {
  through: BotKnowledge,
  foreignKey: 'bot_id',
  otherKey: 'knowledge_id',
  as: 'knowledge'
});

KnowledgeBase.belongsToMany(Bot, {
  through: BotKnowledge,
  foreignKey: 'knowledge_id',
  otherKey: 'bot_id',
  as: 'bots'
});

export { Account, Integration, Message, Bot, KnowledgeBase, BotKnowledge };