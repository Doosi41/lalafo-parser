// browser.js
const { chromium } = require('playwright-extra');
const stealth = require('puppeteer-extra-plugin-stealth')();
const { state } = require('./state');
const { USER_AGENT, LALAFO_URL } = require('./config');

chromium.use(stealth);

async function refreshCookies() {
    console.log("🚑 Запускаю Playwright для лечения кук...");
    let browser = null;
    
    try {
        browser = await chromium.launch({ headless: true });
        const context = await browser.newContext({ userAgent: USER_AGENT });
        const page = await context.newPage();

        // 1. Увеличиваем общий тайм-аут до 60 секунд на всякий случай
        page.setDefaultTimeout(60000);

        // 2. Используем 'domcontentloaded' вместо 'networkidle'
        // Это сработает, как только загрузится структура страницы
        console.log("🌐 Перехожу на сайт...");
        await page.goto(LALAFO_URL, { waitUntil: 'domcontentloaded' });
        
        // 3. Ждем появления любого важного элемента (например, логотипа или кнопки поиска)
        // Это подтверждает, что мы прошли Cloudflare и видим сайт
        console.log("⏳ Ждем загрузки контента...");
        try {
            await page.waitForSelector('header', { timeout: 15000 }); 
        } catch (e) {
            console.log("⚠️ Не дождались селектора, но попробуем забрать что есть...");
        }

        // 4. Небольшая пауза для прогрузки кук
        await page.waitForTimeout(5000);

        const cookies = await context.cookies();
        const cookieString = cookies.map(c => `${c.name}=${c.value}`).join('; ');

        if (cookieString.includes('cf_clearance') || cookieString.length > 50) {
            state.cookie = cookieString;
            console.log(cookieString);
            console.log("✅ Куки успешно обновлены!");
            await browser.close();
            return true;
        } else {
            console.error("❌ Куки не содержат нужных данных.");
            await browser.close();
            return false;
        }

    } catch (error) {
        console.error("❌ Ошибка в браузере:", error.message);
        if (browser) await browser.close();
        return false;
    }
}

module.exports = { refreshCookies };