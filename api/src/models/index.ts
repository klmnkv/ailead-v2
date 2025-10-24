import { Account } from './Account.js';
import { Integration } from './Integration.js';
import { Message } from './Message.js';
import { KnowledgeBase } from './KnowledgeBase.js';

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

Account.hasMany(KnowledgeBase, {
  foreignKey: 'account_id',
  as: 'knowledgeBase'
});

KnowledgeBase.belongsTo(Account, {
  foreignKey: 'account_id',
  as: 'account'
});

export { Account, Integration, Message, KnowledgeBase };