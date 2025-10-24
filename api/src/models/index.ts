import { Account } from './Account.js';
import { Integration } from './Integration.js';
import { Message } from './Message.js';
import { Bot } from './Bot.js';

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

Account.hasMany(Bot, {
  foreignKey: 'account_id',
  as: 'bots'
});

Bot.belongsTo(Account, {
  foreignKey: 'account_id',
  as: 'account'
});

export { Account, Integration, Message, Bot };