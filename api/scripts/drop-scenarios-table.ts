import 'dotenv/config';
import { sequelize } from '../src/config/database.js';

async function dropScenariosTable() {
  try {
    console.log('🔄 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Database connected');

    console.log('🗑️  Dropping scenarios table...');
    await sequelize.query('DROP TABLE IF EXISTS scenarios CASCADE;');
    console.log('✅ Scenarios table dropped successfully');

    console.log('✨ Done! Now you can restart the API server.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

dropScenariosTable();
