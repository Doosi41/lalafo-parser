// api.js
const { API_URL, USER_AGENT, HEADERS_TEMPLATE } = require('./config');
const { state } = require('./state');
const { refreshCookies } = require('./browser');

/**
 * Запрос объявлений с Lalafo
 * @param {number} page - Номер страницы
 * @param {number} retryCount - Счетчик повторных попыток
 * @param {string|number} cityId - ID города из твоего списка
 */
async function fetchAds(page = 1, retryCount = 0) {
    try {
        const { gotScraping } = await import('got-scraping');

        // Подготавливаем параметры запроса
        const params = {
            expand: 'url',
            'per-page': 40,
            category_id: state.categoryId,
            page: page
        };

        // Если в глобальном стейте или аргументе есть cityId — добавляем в фильтр
        const currentCityId = state.cityId || null;
        if (currentCityId) {
            params['city_id'] = currentCityId;
        }

        const response = await gotScraping({
            url: API_URL,
            method: 'GET',
            headers: {
                ...HEADERS_TEMPLATE,
                'user-agent': USER_AGENT,
                'cookie': state.cookie || '',
                'referer': 'https://lalafo.kg/',
                'language-id': '2',
                'device': 'pc' // Важный заголовок для корректной выдачи
            },
            useHeaderGenerator: false, 
            headerGeneratorOptions: {
                browsers: [{ name: 'chrome', minVersion: 120 }],
                devices: ['desktop'],
                operatingSystems: ['macos'],
            },
            searchParams: params,
            responseType: 'json',
            timeout: { request: 15000 }
        });

        if (response.body && response.body.items) {
            const count = response.body.items.length;
            const cityName = currentCityId ? ` (ID города: ${currentCityId})` : " (Весь Кыргызстан)";
            console.log(`✅ Успех! Получено ${count} объявлений${cityName}.`);
            return response.body.items;
        }
        
        return [];

    } catch (error) {
        const status = error.response ? error.response.statusCode : 'Error';
        const errorBody = error.response ? error.response.body : '';
        
        console.error(`❌ Ошибка API. Статус: ${status}`);
        
        // Если сработала защита (417 или 403), пробуем обновить куки один раз
        if (status === 417 || status === 403) {
            console.log("📝 Сервер просит обновить сессию...");
            if (retryCount < 1) { 
                const success = await refreshCookies();
                if (success) {
                    console.log("🔄 Повторная попытка запроса с новыми куками...");
                    return await fetchAds(page, retryCount + 1);
                }
            }
        }
        return [];
    }
}

module.exports = { fetchAds };