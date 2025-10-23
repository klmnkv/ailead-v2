import { sequelize } from '../src/config/database.js';
import { Integration } from '../src/models/Integration.js';

const ACCOUNT_ID = 32181490;
const BASE_DOMAIN = 'amocrm.ru';

// Долгосрочный токен доступа
const ACCESS_TOKEN = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImp0aSI6ImQwOTE3YzgzZDAxYjJmNDMyYjk1MjRiYmQxMGNjYzAwOTllYjE5OWM5ODhkOWVhN2NlZTc2ZmNkYzU2NjRhODg4NTM2MjA1ZTQ3ZmE4ZGIzIn0.eyJhdWQiOiJjNzQwODE2Ny1kZGVlLTRjNzktYmI2MS1lZDJlMTRiOGUyMjEiLCJqdGkiOiJkMDkxN2M4M2QwMWIyZjQzMmI5NTI0YmJkMTBjY2MwMDk5ZWIxOTljOTg4ZDllYTdjZWU3NmZjZGM1NjY0YTg4ODUzNjIwNWU0N2ZhOGRiMyIsImlhdCI6MTc2MTIwNTc0NSwibmJmIjoxNzYxMjA1NzQ1LCJleHAiOjE3OTM0MDQ4MDAsInN1YiI6IjEyMDExMTc4IiwiZ3JhbnRfdHlwZSI6IiIsImFjY291bnRfaWQiOjMyMTgxNDkwLCJiYXNlX2RvbWFpbiI6ImFtb2NybS5ydSIsInZlcnNpb24iOjIsInNjb3BlcyI6WyJjcm0iLCJmaWxlcyIsImZpbGVzX2RlbGV0ZSIsIm5vdGlmaWNhdGlvbnMiLCJwdXNoX25vdGlmaWNhdGlvbnMiXSwiaGFzaF91dWlkIjoiY2Y5NTdkODgtMDgwNi00OTA4LWI5Y2YtMWVlZDI2NTJlMmI2IiwidXNlcl9mbGFncyI6MCwiYXBpX2RvbWFpbiI6ImFwaS1iLmFtb2NybS5ydSJ9.SVQb_Pjg-daIt491yhBhIGKgnv0utPfVdbThZN3YzOAt9KmuBW2okZE0qEUk7VNB3RIAVrOaib_zjTuKhcFxSjakN3_uCT7CLg8iHIlGYSP67PRocpLXvbUb3oUWQem8vWChDOg29YKWtcAIlb6L25XY71vngAad0QMOp9xKsokzGNxnrIi2AC5yPVa88ELdTO5DxIsGIsxWUz0nt9JEccuSk7dxg3pGqnEmfPOn0hcKfbkx5LwhjOT_K5HiZSQbHPMn5yMHnMnsLx9YQPXxFOsNBorbFHCe_P-frIfBHesKdGVSVC8_xUJtLaUkdRwSVHiF3Heyt87Xtze6SeARHw';

// Долгосрочный токен истекает в 2026 году (exp: 1793404800)
const TOKEN_EXPIRY = 1793404800;

async function updateTokens() {
    try {
        console.log('🔄 Обновление токенов для аккаунта', ACCOUNT_ID);

        // Подключаемся к БД
        await sequelize.authenticate();
        console.log('✅ Подключение к БД установлено');

        // Ищем интеграцию
        const integration = await Integration.findOne({
            where: { amocrm_account_id: ACCOUNT_ID }
        });

        if (!integration) {
            console.log('❌ Интеграция не найдена. Создаю новую...');

            await Integration.create({
                account_id: 1, // Внутренний ID
                amocrm_account_id: ACCOUNT_ID,
                base_url: `https://kirilltihiy.${BASE_DOMAIN}`,
                domain: `kirilltihiy.${BASE_DOMAIN}`,
                client_id: 'c7408167-ddee-4c79-bb61-ed2e14b8e221',
                access_token: ACCESS_TOKEN,
                refresh_token: ACCESS_TOKEN, // Для долгосрочного токена используем тот же
                token_expiry: TOKEN_EXPIRY,
                status: 'active'
            });

            console.log('✅ Интеграция создана');
        } else {
            console.log('📝 Обновляю существующую интеграцию...');

            await integration.update({
                access_token: ACCESS_TOKEN,
                refresh_token: ACCESS_TOKEN,
                token_expiry: TOKEN_EXPIRY,
                status: 'active'
            });

            console.log('✅ Токены обновлены');
        }

        console.log('\n✨ Готово! Токены успешно обновлены.');
        console.log(`📅 Токен действителен до: ${new Date(TOKEN_EXPIRY * 1000).toLocaleString('ru')}`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Ошибка:', error);
        process.exit(1);
    }
}

updateTokens();
