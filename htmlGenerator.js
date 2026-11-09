// htmlGenerator.js
const fs = require('fs');

/**
 * Генерирует HTML-отчет на основе массива объявлений Lalafo
 * @param {Array} items - Список объектов объявлений из API
 * @returns {string} - Имя созданного файла
 */
function saveToHtml(items) {
    const fileName = 'lalafo_report.html';
    
    // Формируем строки таблицы
    const rows = items.map((item, index) => {
        const user = item.user || {};
        
        // --- Логика сбора телефонов ---
        const phones = [];
        // 1. Основной мобильный из корня (как в твоем примере JSON)
        if (item.mobile) phones.push(item.mobile);
        
        // 2. Дополнительные контакты из бизнес-профиля (если есть)
        const businessContacts = user.business?.features?.contact_phones?.model?.contacts || [];
        businessContacts.forEach(c => {
            if (c.phone && !phones.includes(c.phone)) {
                phones.push(c.phone);
            }
        });

        // Распределяем по колонкам
        const p1 = phones[0] || '-';
        const p2 = phones[1] || '-';
        const p3 = phones[2] || '-';
        const p4 = phones[3] || '-';

        // --- Обработка даты (перевод из UNIX в читаемый формат Бишкека) ---
        const formatDate = (ts) => {
            if (!ts) return '-';
            return new Date(ts * 1000).toLocaleString('ru-RU', { 
                timeZone: 'Asia/Bishkek',
                day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
            });
        };

        // --- Изображение ---
        const photoUrl = item.images && item.images.length > 0 
            ? item.images[0].thumbnail_url 
            : 'https://via.placeholder.com/100?text=No+Photo';

        return `
        <tr>
            <td>${index + 1}</td>
            <td><code>${item.id}</code></td>
            <td>
                <a href="https://lalafo.kg${item.url}" target="_blank">
                    <img src="${photoUrl}" width="80" alt="photo"><br>
                    🔗 Ссылка
                </a>
            </td>
            <td class="phone"><b>${p1}</b></td>
            <td>${p2}</td>
            <td>${p3}</td>
            <td>${p4}</td>
            <td><b>${item.title || '-'}</b></td>
            <td class="price">${item.price || '0'} ${item.currency || ''}</td>
            <td><div class="desc">${(item.description || '').replace(/\n/g, '<br>')}</div></td>
            <td>${item.city || '-'}</td>
            <td>${user.username || '-'}</td>
            <td>${formatDate(item.created_time)}</td>
            <td>${formatDate(item.updated_time)}</td>
        </tr>`;
    }).join('');

    // Полный HTML шаблон
    const htmlContent = `
    <!DOCTYPE html>
    <html lang="ru">
    <head>
        <meta charset="UTF-8">
        <title>Lalafo Export Report</title>
        <style>
            body { font-family: -apple-system, system-ui, sans-serif; background: #f4f7f9; margin: 20px; color: #333; }
            h2 { color: #2c3e50; border-bottom: 2px solid #007bff; padding-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; background: white; box-shadow: 0 4px 6px rgba(0,0,0,0.1); border-radius: 8px; overflow: hidden; }
            th { background: #007bff; color: white; padding: 12px 10px; text-align: left; font-size: 13px; white-space: nowrap; }
            td { border-bottom: 1px solid #eee; padding: 10px; font-size: 13px; vertical-align: top; }
            tr:hover { background: #f1f8ff; }
            .price { font-weight: bold; color: #28a745; white-space: nowrap; font-size: 14px; }
            .phone { color: #d63031; white-space: nowrap; }
            .desc { max-height: 100px; overflow-y: auto; max-width: 400px; font-size: 11px; line-height: 1.4; color: #666; background: #fafafa; padding: 5px; border-radius: 4px; }
            code { background: #eee; padding: 2px 4px; border-radius: 3px; font-family: monospace; }
            img { border-radius: 4px; margin-bottom: 5px; border: 1px solid #ddd; }
            a { text-decoration: none; color: #007bff; font-weight: 500; }
        </style>
    </head>
    <body>
        <h2>📊 Отчет по недвижимости (Всего объявлений: ${items.length})</h2>
        <table>
            <thead>
                <tr>
                    <th>№</th>
                    <th>ID</th>
                    <th>Превью / URL</th>
                    <th>Телефон 1</th>
                    <th>Телефон 2</th>
                    <th>Телефон 3</th>
                    <th>Телефон 4</th>
                    <th>Заголовок</th>
                    <th>Цена</th>
                    <th>Описание</th>
                    <th>Город</th>
                    <th>Имя</th>
                    <th>Создано</th>
                    <th>Обновлено</th>
                </tr>
            </thead>
            <tbody>
                ${rows}
            </tbody>
        </table>
    </body>
    </html>`;

    // Запись в файл
    try {
        fs.writeFileSync(fileName, htmlContent);
        console.log(`✅ Отчет успешно сохранен в файл: ${fileName}`);
        return fileName;
    } catch (err) {
        console.error("❌ Ошибка при сохранении HTML:", err);
        return null;
    }
}

module.exports = { saveToHtml };