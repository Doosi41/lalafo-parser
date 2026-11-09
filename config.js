// config.js
module.exports = {
    API_URL: "https://lalafo.kg/api/search/v3/feed/search",
    LALAFO_URL: "https://lalafo.kg",
    USER_AGENT: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36',
    HEADERS_TEMPLATE: {
        'accept': 'application/json, text/plain, */*',
        'country-id': '12',
        'language': 'ru_RU',  
        'device': 'pc',
        'request-id': 'react-client-bf39b66f-4da3-4ac9-9bac-a91a9ddefdbc' // Из твоего лога
    }
};