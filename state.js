// state.js
const fs = require('fs');

const DATA_FILE = 'seen_ids.json';

const state = {
    categoryId: "2044", // По умолчанию: Квартиры
    cityId: "103184",
    cookie: `srv_id=canary; event_user_hash=85be75b5-6b25-43f6-9dc4-700a57f40633; _fbp=fb.1.1770716662990.468760634837351358; _ga=GA1.1.1721054379.1770716663; _hjSessionUser_3562562=eyJpZCI6IjZiYjE0YjIxLTI5NDMtNTM0MC1hYjk1LTFlMzE1OGIzYzM3MCIsImNyZWF0ZWQiOjE3NzA3MTY2NjQ1MzMsImV4aXN0aW5nIjp0cnVlfQ==; event_session_id=d862c456c861b55310e612d38562fdf2; cf_clearance=315g0P0qT.lDfXFodq2bjPJK3lRg8qLho82DQPsGvZk-1770841511-1.2.1.1-NRxMhuwjgEqEGft7yWVTKqiSEV4TLkr4qpPR7gxY0oQZQDfiiOcjv9fOEV.3cN7Zu8kBpV.OgmMbTkxSW8fDDqp._sajC10PrssW4vt3PlUYO.0_iH2rT9w9EKPE0ZH6Xu56BzkMSc2d9yS4jnR74zB5wCZDvTJgrcFwIvpBInmFBMSpjw.YJZcqFJDW8_p_8QUoULnntee9nCXX.mKTA_6BnlE9T2qUqHundtvc8Tg; __gads=ID=feb1a454a739c5b7:T=1770716663:RT=1770841513:S=ALNI_MZIqVsrcRXjPznwS47h-g1cOIwU5g; __gpi=UID=00001317aab97689:T=1770716663:RT=1770841513:S=ALNI_MY5gDs74vdMsGjhPeRnwmKcOH2__Q; __eoi=ID=f8f7b36fa815ce83:T=1770716663:RT=1770841513:S=AA-AfjYdcr1OrdCqddRHP4SV37IE; experiment=novalue; device_fingerprint=71812e8bb63a9927d7d452ccbc93d49f; _ga_Z4VRYJ4XGN=GS2.1.s1770841501$o4$g1$t1770841527$j34$l0$h0; lastAnalyticsEvent=listing%3Acategory_tab%3Asearch%3Alevel_4%3Atap`,         // Куки (обновляются динамически)
    isParsing: false,   // Флаг работы
    intervalId: null,   // Таймер
    seenIds: new Set()  // Список ID, которые мы уже видели
};

// Загрузка истории ID при старте
if (fs.existsSync(DATA_FILE)) {
    try {
        const data = JSON.parse(fs.readFileSync(DATA_FILE));
        data.forEach(id => state.seenIds.add(id));
        console.log(`📂 Загружено ${state.seenIds.size} старых объявлений из памяти.`);
    } catch (e) {
        console.error("Ошибка чтения файла истории:", e);
    }
}

// Сохранение истории ID
function saveSeenIds() {
    try {
        // Преобразуем Set в Array для JSON
        fs.writeFileSync(DATA_FILE, JSON.stringify([...state.seenIds]));
    } catch (e) {
        console.error("Ошибка сохранения истории:", e);
    }
}

module.exports = { state, saveSeenIds };