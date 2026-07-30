# RitmixLove — Production

Персонализированные песни и музыкальные подарки на заказ.
Одностраничный лендинг (dark neon / glassmorphism), чистый HTML5 + CSS3 + JS, без сборки.

## Стек
- HTML5, CSS3 (кастомные свойства, glassmorphism, неоновые акценты)
- Ванильный JavaScript (без фреймворков и сборки)
- Реальное аудио: `HTMLAudioElement` (4 трека, MP3)

## Структура
```
index.html      — разметка страницы (все секции)
styles.css      — стили (тёмная неоновая тема)
script.js       — логика аудиоплеера, мобильное меню, reveal-анимации
youtube.js      — динамическая лента релизов с YouTube (API v3 + RSS-fallback)
LOGO.png        — логотип
micro.png       — изображение микрофона в hero-секции
*.mp3           — 4 примера работ (альмира / галек / дмитрий / ринат)
```

## Запуск локально
```bash
python3 -m http.server 8000
# открыть http://localhost:8000/
```

## Секции
1. Hero (главный экран)
2. Преимущества (6 карточек)
3. Как мы создаём песню
4. Примеры наших работ (3+1 аудиоплеера)
5. Свежие релизы на YouTube (карусель + lightbox)
6. Тарифы
7. Как заказать
8. Отзывы
9. CTA (WhatsApp / Telegram)
10. Контакты (подвал)

## Контакты
- WhatsApp: +7 776 256 60 66 — https://wa.me/77762566066
- Telegram: @ritmixlove — https://t.me/ritmixlove
- YouTube: @RitmixLOVE — https://www.youtube.com/@RitmixLOVE
- Instagram: @ritmixlove — https://www.instagram.com/ritmixlove/
- TikTok: @ritmixlove — https://www.tiktok.com/@ritmixlove

## YouTube-лента (опционально, для автоматического обновления)
Лента работает без ключа через RSS-fallback. Для полностью динамического режима
вставьте ключ YouTube Data API v3 в `youtube.js` → `YOUTUBE.apiKey`.

---
© 2025 RitmixLove — Production
