// migrations/002_add_email_password.ts
export async function up(sequelize) {
  await sequelize.query(`
    ALTER TABLE integrations
    ADD COLUMN IF NOT EXISTS email VARCHAR(255),
    ADD COLUMN IF NOT EXISTS password VARCHAR(255);
  `);
}