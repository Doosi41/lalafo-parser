# lalafo-parser

A Node.js bot that collects apartment ads from lalafo.kg and is controlled through Telegram.

## Features

- Categories: rent, sale, buy and wanted apartments
- Choose a city from a paged menu (`locations.json`)
- One menu message that updates itself, with no chat spam
- Saves the found ads to an HTML report
- Remembers ads it has already seen (`seen_ids.json`)

## Tech stack

Node.js · node-telegram-bot-api · got-scraping · Playwright · ExcelJS · dotenv

## Quick start

```bash
git clone https://github.com/Doosi41/lalafo-parser.git && cd lalafo-parser
npm install
echo "TELEGRAM_TOKEN=your_bot_token" > .env   # token from @BotFather
node index.js
```

## Files

| File | What it does |
|---|---|
| `index.js` | The Telegram bot and its menus |
| `api.js` | Requests to the lalafo.kg search API |
| `browser.js` | Gets fresh cookies with a browser |
| `htmlGenerator.js` | Builds the HTML report |
| `state.js` | Keeps the list of seen ads |
| `config.js`, `locations.json` | Settings and cities |

## Notes

- Be polite to the website: do not send many requests in a short time and follow its terms of use.
- Ads contain personal data such as phone numbers. Do not publish the reports or `seen_ids.json`; they are in `.gitignore`.
- Never commit `.env`.
