# RitmixLove — Production

Персонализированные песни и музыкальные подарки на заказ.
Одностраничный лендинг (dark neon / glassmorphism), чистый HTML5 + CSS3 + JS, без сборки.
Контент вынесен в CMS-файл — тексты, цены, кнопки и картинки правятся без правки кода.

## Стек
- HTML5, CSS3 (кастомные свойства, glassmorphism, неоновые акценты)
- Ванильный JavaScript (без фреймворков и сборки)
- Реальное аудио: `HTMLAudioElement` (треки из `content/site.json`)
- **CMS:** `content/site.json` + `cms.js` + Decap CMS (`/admin/`)

## Структура
```
index.html          — каркас страницы (секции-контейнеры)
styles.css          — стили (тёмная неоновая тема + CMS text-safety)
cms.js              — загружает content/site.json и рендерит контент
script.js           — аудиоплеер, меню, reveal, карусель отзывов
youtube.js          — лента релизов YouTube
content/site.json   — ⭐ весь редактируемый контент (источник правды)
admin/index.html    — панель Decap CMS
admin/config.yml    — схема полей CMS
uploads/            — медиа, загруженные через админку
LOGO.png, *.mp3, …  — статические ассеты
```

## Как менять контент

### Вариант 1 — править JSON напрямую (самый простой)
Откройте `content/site.json` и измените нужные поля:

| Раздел | Что внутри |
|--------|------------|
| `meta` | title, description, SEO |
| `brand` / `images` | название, логотип, фон hero |
| `contacts` | телефон, WhatsApp, Telegram, email, соцсети |
| `nav` | пункты меню |
| `buttons` | тексты и ссылки всех кнопок |
| `hero` | заголовок, подзаголовок, чипы |
| `advantages` | 6 карточек преимуществ |
| `categories` | «Что мы создаём» |
| `portfolio.tracks` | примеры работ (название, mp3, длительность) |
| `pricing.packages` | тарифы: имя, цена, фичи, ссылка заказа |
| `process.steps` | шаги «Как заказать» |
| `reviews.items` | отзывы клиентов |
| `cta` / `footer` | призыв к действию и подвал |

После сохранения обновите страницу — изменения появятся сразу.

### Вариант 2 — Decap CMS (визуальный редактор)
1. Задеплойте сайт на **Netlify**.
2. Включите **Identity** + **Git Gateway** (Site settings → Identity → Services).
3. Пригласите себя как пользователя Identity.
4. Откройте `https://ваш-сайт.netlify.app/admin/` и войдите.
5. Редактируйте поля, нажмите **Publish** — Decap закоммитит `content/site.json`.

**Локально (без Netlify):**
```bash
# терминал 1 — статика
python3 -m http.server 8000

# терминал 2 — proxy для git-backend Decap
npx decap-server
```
Откройте http://localhost:8000/admin/

## Запуск локально
```bash
python3 -m http.server 8000
# открыть http://localhost:8000/
```
> `content/site.json` грузится через `fetch`, поэтому нужен HTTP-сервер
> (открытие `index.html` как `file://` не сработает).

## Секции
1. Hero (главный экран)
2. Преимущества
3. Что мы создаём
4. Примеры работ (аудиоплееры)
5. Свежие релизы на YouTube
6. Тарифы
7. Как заказать
8. Отзывы
9. CTA (WhatsApp / Telegram)
10. Контакты (подвал)

## Контакты (дефолтные, правятся в CMS)
- WhatsApp: +7 776 256 60 66 — https://wa.me/77762566066
- Telegram: @ritmixlove — https://t.me/ritmixlove
- YouTube: @RitmixLOVE — https://www.youtube.com/@RitmixLOVE
- Instagram: @ritmixlove — https://www.instagram.com/ritmixlove/
- TikTok: @ritmixlove — https://www.tiktok.com/@ritmixlove

## YouTube-лента (опционально)
Лента работает без ключа через RSS-fallback. Для динамического режима
вставьте ключ YouTube Data API v3 в `youtube.js` → `YOUTUBE.apiKey`.

---
© 2025 RitmixLove — Production
