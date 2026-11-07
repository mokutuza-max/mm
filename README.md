# Сайт МО Кутузовского ФО

Портал ролевого проекта **RMRP (Кутузовский)** — «Министерство Обороны Кутузовского
Федерального Округа». Работает на **Cloudflare Workers** с базой **Cloudflare D1**.
Фронтенд — обычные HTML/CSS/JS без сборщиков. R2 не требуется: фотографии хранятся
как ссылки или Base64-строки в D1.

## Что реализовано

### Публичная часть

| Страница | Назначение |
| --- | --- |
| `index.html` | Главная: приветствие, быстрые ссылки, 3 последние новости |
| `o-ministerstve.html` | Устав, история и задачи ведомства |
| `sostav.html` | Руководство и состав из D1, сортировка по `display_order` |
| `novosti.html` | Лента новостей с фильтром по категориям и поиском |
| `novost.html?id=…` | Полная новость |
| `documents.html` | Документы, сгруппированные по категориям |
| `obrashcheniya.html` | Форма обращения граждан |
| `trudoustroystvo.html` | Вакансии и форма заявки |
| `vhod.html`, `registraciya.html` | Вход и регистрация |
| `akkaunt.html` | Личный кабинет: профиль, аватар, пароль, свои обращения и заявки |
| `administraciya.html` | Панель управления (роли `admin` и `editor`) |

### Панель управления

- **Новости** — создание, редактирование, удаление, категория, черновик/публикация.
- **Состав** — добавление, редактирование, удаление, фото по URL/Base64,
  изменение порядка кнопками ↑ ↓ и Drag-and-Drop. Порядок сохраняется в `display_order`.
- **Документы** — CRUD, категория, ссылка на файл.
- **Обращения** — просмотр, смена статуса, ответ, удаление.
- **Заявки** — просмотр заявок на трудоустройство, статус и комментарий.
- **Вакансии** — CRUD, открытие/закрытие.
- **Пользователи** — только для `admin`: роли, статусы, состояние, удаление.

Любая форма в админке отправляется через `fetch()` с `event.preventDefault()`,
обрабатывает ошибки через `try/catch` и показывает уведомление **«Успешно сохранено!»**
без перезагрузки страницы.

## Локальный запуск

Нужны Node.js 18+ и аккаунт Cloudflare (для `wrangler`).

```powershell
npm install
npx wrangler d1 execute mkfo --local --file=./migrations/0001_init.sql
npx wrangler d1 execute mkfo --local --file=./migrations/0002_avatar_d1.sql
npx wrangler d1 execute mkfo --local --file=./migrations/0003_content.sql
npx wrangler d1 execute mkfo --local --file=./migrations/0004_seed.sql
npx wrangler dev
```

Сайт: <http://localhost:8787>.

Первый зарегистрированный аккаунт автоматически получает роль `admin`.
Роль `editor` может управлять всем контентом, но не пользователями.

### Деплой на Cloudflare

```powershell
npx wrangler d1 execute mkfo --remote --file=./migrations/0003_content.sql
npx wrangler d1 execute mkfo --remote --file=./migrations/0004_seed.sql
npx wrangler login
npx wrangler secret put DISCORD_CLIENT_SECRET   # необязательно, для Discord OAuth2
npx wrangler deploy
```

`wrangler.toml` уже содержит `database_id` D1 и `APP_URL`. Если база создаётся заново,
выполните все четыре миграции по порядку.

> Повторный запуск `0003_content.sql` безопасен (`IF NOT EXISTS`).
> `0004_seed.sql` использует `INSERT OR IGNORE` и не дублирует демо-записи.
> `0002_avatar_d1.sql` добавляет колонки и на уже мигрированной базе повторно не нужен.

## Изображения без R2

Фото состава и новостей принимаются двумя способами:

1. **Ссылка** — `https://…`, `/img/photo.png` или `img/photo.png`.
2. **Base64** — в форме есть кнопка «Загрузить файл». Браузер уменьшает изображение
   до 900 px, сжимает в JPEG и подставляет `data:image/jpeg;base64,…` в поле.

Серверная проверка: до 700 000 символов Base64 (~500 КБ исходника), только
`png/jpeg/webp/gif`, MIME определяется по префиксу. Это укладывается в лимиты D1.

Для документов принимается ссылка на файл (внутренняя или внешняя).

## Схема БД

Основные таблицы (`migrations/`):

- `users` — аккаунты, PBKDF2-хеш пароля, роль, статус, состояние, аватар, Discord.
- `sessions` — серверные сессии (токен хранится в HttpOnly-cookie).
- `staff` — состав: ФИО, звание, должность, подразделение, фото, `display_order`.
- `news` — новости: заголовок, текст, категория, изображение, `status` (`draft`/`published`).
- `appeals` — обращения: автор, контакты, тема, текст, статус, ответ.
- `documents` — документы: название, ссылка, категория.
- `vacancies` — вакансии.
- `applications` — заявки на трудоустройство.

Все значения передаются в D1 через `prepare(...).bind(...)` — конкатенации
пользовательских данных в SQL нет.

## API

### Публичные

| Метод и путь | Назначение |
| --- | --- |
| `GET /api/news?limit=&category=&q=` | Опубликованные новости |
| `GET /api/news/:id` | Одна новость |
| `GET /api/staff` | Состав по `display_order` |
| `GET /api/documents` | Документы |
| `GET /api/vacancies` | Открытые вакансии |
| `POST /api/appeals` | Отправить обращение |
| `POST /api/applications` | Отправить заявку |
| `GET /api/me/appeals` | Свои обращения (вход) |
| `GET /api/me/applications` | Свои заявки (вход) |
| `POST /api/auth/register`, `/login`, `/logout` | Авторизация |
| `GET/PATCH /api/me`, `POST /api/me/password` | Профиль |
| `POST/DELETE /api/me/avatar` | Аватар |
| `GET /api/avatar/:id` | Аватар пользователя |

### Админ-панель (`admin` / `editor`)

| Метод и путь | Назначение |
| --- | --- |
| `GET /api/admin/stats` | Сводка |
| `GET/POST /api/admin/staff` | Список / создание |
| `PATCH/DELETE /api/admin/staff/:id` | Изменение / удаление |
| `POST /api/admin/staff/reorder` | Порядок: `{ "ids": ["…"] }` |
| `GET/POST /api/admin/news` | Список / создание |
| `PATCH/DELETE /api/admin/news/:id` | Изменение / удаление |
| `GET/POST /api/admin/documents` | Документы |
| `PATCH/DELETE /api/admin/documents/:id` | Изменение / удаление |
| `GET/PATCH/DELETE /api/admin/appeals/:id` | Обращения |
| `GET/PATCH/DELETE /api/admin/applications/:id` | Заявки |
| `GET/POST /api/admin/vacancies` | Вакансии |
| `PATCH/DELETE /api/admin/vacancies/:id` | Изменение / удаление |
| `GET /api/users`, `PATCH/DELETE /api/users/:id` | Пользователи (только `admin`) |

## Структура файлов

| Путь | Назначение |
| --- | --- |
| `worker/index.js` | Роутинг страниц, проверка доступа, UTF-8 для документов |
| `worker/api.js` | REST-роутинг |
| `worker/content.js` | Контент, CRUD, сортировка состава |
| `worker/auth.js` | Пароли PBKDF2, сессии, роли, проверки |
| `worker/discord.js` | Discord OAuth2 |
| `css/style.css` | Тёмная тема: `#121212`, `#0d0d0f`, акцент `#e05a2b` |
| `js/main.js` | Шапка, навигация, API-клиент, модальные окна, уведомления |
| `js/admin.js` | Панель управления |
| `js/account.js` | Личный кабинет |
| `js/news.js`, `js/staff.js`, `js/documents.js`, `js/jobs.js`, `js/appeals.js` | Страницы |
| `migrations/*.sql` | Схема и демо-данные D1 |
| `docs/*.txt` | Демонстрационные документы (отдаются с `charset=utf-8`) |

## Безопасность и качество

- Пароли — PBKDF2-SHA256, 100 000 итераций, случайная соль.
- Сессия — случайный токен, в D1 хранится только SHA-256 хеш; cookie `HttpOnly`,
  `SameSite=Lax`, `Secure` на HTTPS.
- Все изменяющие API-запросы проверяют `Origin`.
- Весь пользовательский текст экранируется на клиенте (`Site.esc`), новости
  выводятся как безопасные абзацы (`Site.textHtml`).
- Ссылки на изображения и файлы валидируются по белому списку схем.
- Самопроверка чек-листа:
  1. SQL — только параметризованные запросы `.bind()`.
  2. Формы админки — `preventDefault`, `fetch`, `try/catch`, уведомление.
  3. Порядок состава — `POST /api/admin/staff/reorder` обновляет `display_order`,
     публичная страница сортируется по этому полю.
  4. Все файлы в UTF-8; HTML содержит `<meta charset="utf-8">`, документы `.txt`
     отдаются Worker-ом с `text/plain; charset=utf-8`.
