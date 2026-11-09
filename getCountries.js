const fs = require('fs');

async function downloadCities() {
    console.log("📡 Подключаюсь к API Lalafo для сбора городов...");
    
    try {
        // Динамический импорт got-scraping
        const { gotScraping } = await import('got-scraping');

        const response = await gotScraping({
            url: 'https://lalafo.kg/api/proxy/v3/countries/12/cities', // 12 - ID Кыргызстана
            method: 'GET',
            responseType: 'json',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Country-Id': '12',
                'Language-Id': '2'
            }
        });

        if (Array.isArray(response.body)) {
            const cities = response.body.map(city => ({
                id: city.id,
                name: city.name
            }));

            // Сортируем по алфавиту для удобства
            cities.sort((a, b) => a.name.localeCompare(b.name));

            // Сохраняем в файл
            fs.writeFileSync('cities_list.json', JSON.stringify(cities, null, 2));
            
            console.log(`✅ Успех! Собрано ${cities.length} населенных пунктов.`);
            console.log("📁 Список сохранен в файл: cities_list.json");
            
            // Выведем топовые города для проверки
            const topCities = ["Бишкек", "Ош", "Арашан", "Кара-Балта"];
            console.log("\nПроверка популярных ID:");
            cities.forEach(c => {
                if (topCities.includes(c.name)) {
                    console.log(`📍 ${c.name}: ${c.id}`);
                }
            });

        } else {
            console.error("❌ Сервер вернул пустой список или ошибку.");
        }
    } catch (error) {
        console.error("❌ Ошибка запроса:", error.message);
    }
}

downloadCities();