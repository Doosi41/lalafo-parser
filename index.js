const TelegramBot = require('node-telegram-bot-api');
const { fetchAds } = require('./api');
const { refreshCookies } = require('./browser');
const { state, saveSeenIds } = require('./state');
const { saveToHtml } = require('./htmlGenerator');
const locations = require('./locations.json'); // Твой файл с городами
require('dotenv').config();

const token = process.env.TELEGRAM_TOKEN;
const bot = new TelegramBot(token, { polling: true });

// --- НАСТРОЙКИ ---
const CATEGORIES = {
    'cat_rent': { id: 2044, name: 'Аренда квартир' },
    'cat_sell': { id: 2032, name: 'Продажа квартир' },
    'cat_buy':  { id: 2035, name: 'Куплю квартиру' },
    'cat_take': { id: 2046, name: 'Сниму квартиру' }
};

// Константы для пагинации городов
const CITIES_PER_PAGE = 15; 
const COLUMNS_COUNT = 3;

console.log("🚀 Бот запущен: Режим Single Message (Без спама)");

// --- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ---

// 1. Функция разбивки массива на кусочки (для колонок)
function chunkArray(array, chunkSize) {
    const result = [];
    for (let i = 0; i < array.length; i += chunkSize) {
        result.push(array.slice(i, i + chunkSize));
    }
    return result;
}

// 2. Генерация клавиатуры городов
function getCityKeyboard(page = 0) {
    const totalPages = Math.ceil(locations.length / CITIES_PER_PAGE);
    
    // Берем кусочек городов для текущей страницы
    const start = page * CITIES_PER_PAGE;
    const end = start + CITIES_PER_PAGE;
    const citiesOnPage = locations.slice(start, end);

    // Создаем кнопки городов
    const cityButtons = citiesOnPage.map(city => ({
        text: city.name,
        callback_data: `set_city_${city.id}`
    }));

    // Разбиваем на 3 колонки
    const keyboardRows = chunkArray(cityButtons, COLUMNS_COUNT);

    // Добавляем кнопки навигации (Назад / Вперед)
    const navRow = [];
    if (page > 0) navRow.push({ text: "⬅️", callback_data: `city_page_${page - 1}` });
    navRow.push({ text: `${page + 1}/${totalPages}`, callback_data: "ignore" }); // Просто счетчик
    if (page < totalPages - 1) navRow.push({ text: "➡️", callback_data: `city_page_${page + 1}` });

    keyboardRows.push(navRow);
    keyboardRows.push([{ text: "🔙 Назад в меню", callback_data: "nav_categories" }]);

    return { inline_keyboard: keyboardRows };
}

// 3. Отправка объявления (Тут удалять нельзя, это лента уведомлений)
async function sendAd(chatId, item) {
    const user = item.user || {};
    const phone = item.mobile || 'Не указан';
    
    const caption = 
        `🔥 **${item.title || 'Новое объявление'}**\n\n` +
        `💰 **${item.price} ${item.currency}**\n` +
        `📞 \`${phone}\`\n` +
        `🏙 ${item.city || '-'}\n` +
        `🔗 [Открыть](https://lalafo.kg${item.url})`;

    try {
        if (item.images && item.images.length > 0) {
            await bot.sendPhoto(chatId, item.images[0].original_url, { caption, parse_mode: 'Markdown' });
        } else {
            await bot.sendMessage(chatId, caption, { parse_mode: 'Markdown' });
        }
    } catch (e) {
        console.error("Ошибка отправки:", e.message);
    }
}

// 4. Проверка обновлений
async function checkNewAds(chatId) {
    const items = await fetchAds(1);
    if (!items) return;
    for (const item of items) {
        if (!state.seenIds.has(item.id)) {
            state.seenIds.add(item.id);
            await sendAd(chatId, item);
        }
    }
    saveSeenIds();
}

// --- КЛАВИАТУРЫ (СТАТИЧНЫЕ) ---

const keyboards = {
    main: {
        inline_keyboard: [
            [{ text: "🔍 Поиск", callback_data: "menu_search" }],
            [{ text: "📚 Инструкция", callback_data: "menu_help" }, { text: "🆘 Инфо", callback_data: "menu_support" }]
        ]
    },
    searchCategory: {
        inline_keyboard: [
            [{ text: "🏢 Недвижимость", callback_data: "type_real_estate" }],
            [{ text: "🚗 Транспорт", callback_data: "type_transport" }],
            [{ text: "🔙 В начало", callback_data: "nav_main" }]
        ]
    },
    realEstate: {
        inline_keyboard: [
            [{ text: "🔑 Аренда", callback_data: "cat_rent" }, { text: "🏠 Продажа", callback_data: "cat_sell" }],
            [{ text: "💰 Куплю", callback_data: "cat_buy" }, { text: "🙋‍♂️ Сниму", callback_data: "cat_take" }],
            [{ text: "🔙 Назад", callback_data: "menu_search" }]
        ]
    },
    controlPanel: (isWorking) => ({
        inline_keyboard: [
            [{ text: isWorking ? "🛑 СТОП Мониторинг" : "▶️ ЗАПУСТИТЬ ПОИСК", callback_data: isWorking ? "act_stop" : "act_start" }],
            [{ text: "🏙 Сменить город", callback_data: "nav_cities_reset" }], // Ведет к выбору города
            [{ text: "📂 Сменить категорию", callback_data: "type_real_estate" }],
            [{ text: "🔙 В Главное меню", callback_data: "nav_main" }]
        ]
    })
};

// --- ОБРАБОТЧИКИ ---

// Стартовая команда (единственная, которая создает новое сообщение)
bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, "👋 **Lalafo Parser v2.0**\n\nИспользуйте кнопки для навигации:", {
        parse_mode: 'Markdown',
        reply_markup: keyboards.main
    });
});

bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const msgId = query.message.message_id;
    const data = query.data;

    try {
        // --- НАВИГАЦИЯ ---

        if (data === 'nav_main') {
            await bot.editMessageText("🏠 Главное меню:", {
                chat_id: chatId, message_id: msgId, reply_markup: keyboards.main
            });
        }
        
        else if (data === 'menu_search') {
            await bot.editMessageText("📂 Выберите раздел:", {
                chat_id: chatId, message_id: msgId, reply_markup: keyboards.searchCategory
            });
        }

        else if (data === 'type_real_estate' || data === 'nav_categories') {
            await bot.editMessageText("🏢 Выберите тип сделки:", {
                chat_id: chatId, message_id: msgId, reply_markup: keyboards.realEstate
            });
        }

        // --- ВЫБОР КАТЕГОРИИ И ПЕРЕХОД К ГОРОДАМ ---

        else if (CATEGORIES[data]) {
            state.categoryId = CATEGORIES[data].id;
            // Сразу перекидываем на выбор города (страница 0)
            await bot.editMessageText(`✅ Категория: **${CATEGORIES[data].name}**\n📍 Теперь выберите город:`, {
                chat_id: chatId, message_id: msgId, parse_mode: 'Markdown',
                reply_markup: getCityKeyboard(0)
            });
        }

        // --- ПАГИНАЦИЯ ГОРОДОВ ---

        else if (data.startsWith('city_page_')) {
            const page = parseInt(data.split('_')[2]);
            await bot.editMessageReplyMarkup(getCityKeyboard(page), {
                chat_id: chatId, message_id: msgId
            });
        }

        else if (data === 'nav_cities_reset') {
            // Сброс на 1 страницу городов
            await bot.editMessageText("📍 Выберите город:", {
                chat_id: chatId, message_id: msgId, 
                reply_markup: getCityKeyboard(0)
            });
        }

        // --- ВЫБОР ГОРОДА (ФИНАЛ НАСТРОЙКИ) ---

        else if (data.startsWith('set_city_')) {
            const cityId = data.split('_')[2];
            const cityObj = locations.find(c => c.id == cityId);
            
            if (cityObj) {
                state.cityId = cityObj.id;
                
                // Формируем красивое описание текущих настроек
                const catName = Object.values(CATEGORIES).find(c => c.id === state.categoryId)?.name || "Не выбрано";
                const statusText = 
                    `⚙️ **Панель управления**\n` +
                    `📂 Категория: ${catName}\n` +
                    `📍 Город: **${cityObj.name}**\n` +
                    `📡 Статус: ${state.isParsing ? "🟢 Работает" : "🔴 Остановлен"}`;

                await bot.editMessageText(statusText, {
                    chat_id: chatId, message_id: msgId, parse_mode: 'Markdown',
                    reply_markup: keyboards.controlPanel(state.isParsing)
                });
            }
        }

        // --- ДЕЙСТВИЯ (СТАРТ / СТОП) ---

        else if (data === 'act_start') {
            if (state.isParsing) return;

            // Обновляем панель на "Стоп"
            await bot.editMessageReplyMarkup(keyboards.controlPanel(true), { chat_id: chatId, message_id: msgId });
            
            // Отправляем временное сообщение о запуске (можно потом удалить)
            const loadingMsg = await bot.sendMessage(chatId, "⏳ Загружаю данные... Подождите...");

            state.isParsing = true;
            if (!state.cookie) await refreshCookies();

            // Сбор данных
            let allItems = [];
            let page = 1;
            while (page <= 5) {
                const items = await fetchAds(page);
                if (!items || items.length === 0) break;
                allItems = allItems.concat(items);
                items.forEach(item => state.seenIds.add(item.id));
                page++;
            }

            // Удаляем сообщение "Загружаю..."
            await bot.deleteMessage(chatId, loadingMsg.message_id);

            if (allItems.length > 0) {
                saveSeenIds();
                const filePath = saveToHtml(allItems);
                await bot.sendDocument(chatId, filePath, { caption: `✅ Найдено ${allItems.length} объявлений. Мониторинг запущен!` });
            } else {
                bot.sendMessage(chatId, "❌ Объявлений не найдено. Попробуйте сменить город или категорию.");
            }

            state.intervalId = setInterval(() => checkNewAds(chatId), 60000);
        }

        else if (data === 'act_stop') {
            if (state.intervalId) clearInterval(state.intervalId);
            state.isParsing = false;
            state.intervalId = null;
            
            // Возвращаем кнопку "Старт"
            await bot.editMessageReplyMarkup(keyboards.controlPanel(false), { chat_id: chatId, message_id: msgId });
            await bot.answerCallbackQuery(query.id, { text: "Остановлено" });
        }

        // --- ПРОЧЕЕ ---
        
        else if (data === 'type_transport') {
            await bot.answerCallbackQuery(query.id, { text: "⛔️ Транспорт пока в разработке", show_alert: true });
        }
        else if (data === 'ignore') {
            await bot.answerCallbackQuery(query.id);
        }
        
    } catch (error) {
        console.error("Ошибка в меню:", error.message);
    }
});

// Ловим ошибки Telegram API
bot.on('polling_error', (err) => console.log(err.code));