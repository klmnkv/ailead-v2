// test-send-message.js
const testMessage = async () => {
  try {
    const response = await fetch('http://localhost:4000/api/messages/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        account_id: 1,  // Замените на ваш account_id
        lead_id: 12345,  // Замените на реальный ID лида из amoCRM для теста
        message_text: 'Тестовое сообщение от AI.LEAD v2! 🚀',
        note_text: 'Примечание: Тест системы',
        priority: 'high'
      })
    });

    const data = await response.json();
    console.log('✅ Response:', JSON.stringify(data, null, 2));

    if (data.job_id) {
      console.log(`\n📊 Проверьте статус задачи: http://localhost:4000/api/queue/job/${data.job_id}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
};

testMessage();