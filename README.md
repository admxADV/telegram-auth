# PAVEPO - Авторизация через Telegram

Веб-приложение для авторизации пользователей через Telegram бота с админ-панелью.

## Структура проекта

```
telegram-auth/
├── src/
│   ├── index.html       # Главная страница авторизации
│   ├── dashboard.html   # Личный кабинет пользователя
│   ├── admin.html       # Админ-панель
│   ├── styles.css       # Стили
│   ├── script.js        # Логика авторизации
│   ├── dashboard.js     # Личный кабинет
│   ├── admin.js         # Админ-панель
│   └── assets/          # Изображения
├── Должности/           # Файлы с вопросами тестов по отделам
├── server.js            # Сервер + Telegram бот
├── init_quiz.js         # Скрипт загрузки вопросов в БД
├── package.json
├── render.yaml          # Конфигурация для Render.com
├── .env.example         # Шаблон переменных окружения
└── README.md
```

## Локальный запуск

### Требования

- Node.js 18+
- PostgreSQL (для локальной разработки)

### Установка

```bash
cd telegram-auth
npm install
```

### Запуск

```bash
# Создайте файл .env
cp .env.example .env

# Отредактируйте .env и укажите DATABASE_URL и TELEGRAM_BOT_TOKEN

# Запустите сервер
npm start
```

Откройте в браузере: http://localhost:3000

### Инициализация вопросов тестов

После первого запуска загрузите вопросы тестов в базу данных:

```bash
# Убедитесь, что сервер запущен и DATABASE_URL настроен
node init_quiz.js
```

Скрипт очистит таблицу `quiz_questions` и загрузит вопросы из папки `Должности/`.

## Деплой на Render.com

### Шаг 1: Подготовка

1. Создайте репозиторий на GitHub и запушьте проект:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/telegram-auth.git
   git push -u origin main
   ```

### Шаг 2: Создание базы данных в Neon DB

1. Перейдите на [neon.tech](https://neon.tech) и зарегистрируйтесь
2. Нажмите **Create a project**
3. Введите название проекта (например, `pavepo-db`)
4. После создания скопируйте **Connection string** из раздела **Connection Details**
   - Формат: `postgresql://user:password@ep-xxx-xxx.region.aws.neon.tech/dbname?sslmode=require`

### Шаг 3: Создание сервиса на Render

1. Зарегистрируйтесь на [render.com](https://render.com)
2. Нажмите **New +** → **Web Service**
3. Подключите ваш GitHub репозиторий
4. Заполните настройки:
   - **Name:** `pavepo-auth`
   - **Region:** Frankfurt (или ближайший к вам)
   - **Plan:** Free
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`

### Шаг 4: Настройка переменных окружения

В панели Render перейдите в ваш сервис → **Environment** и добавьте переменные:

| Ключ | Значение |
|------|----------|
| `DATABASE_URL` | Connection string из Neon DB |
| `TELEGRAM_BOT_TOKEN` | Токен бота от @BotFather |
| `WEBAPP_URL` | https://pavepo-auth.onrender.com (ваш URL) |
| `ADMIN_USER_ID` | 5093303797 |
| `NODE_ENV` | production |
| `PORT` | 3000 |

**Примечание:** `DATABASE_URL` нужно указать вручную (Neon DB), Render не предоставляет бесплатную БД.

### Шаг 5: Деплой

1. Нажмите **Create Web Service**
2. Перейдите во вкладку **Logs** и дождитесь завершения сборки
3. После успешного деплоя скопируйте URL сервиса

### Шаг 6: Инициализация вопросов тестов

После первого деплоя загрузите вопросы тестов в базу данных:

1. Перейдите во вкладку **Shell** в панели Render
2. Выполните команду:
   ```bash
   node init_quiz.js
   ```
3. Дождитесь сообщения об успешной загрузке вопросов

### Шаг 7: Настройка Webhook (опционально)

Если вы хотите, чтобы бот работал через webhook вместо polling:

1. Выполните в Shell:
   ```bash
   curl -X POST "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook?url=https://pavepo-auth.onrender.com/"
   ```

Но для бесплатного тарифа лучше оставить polling (уже настроено).

## Функционал

### Авторизация
1. Пользователь нажимает "Войти через Telegram"
2. Генерируется уникальный токен сессии
3. Открывается бот @pavepobot с командой /start TOKEN
4. Бот подтверждает личность пользователя
5. Пользователь автоматически перенаправляется в личный кабинет

### Личный кабинет
- Заполнение профиля (компания, отдел, должность)
- Сохранение данных в PostgreSQL
- Просмотр статуса заполнения профиля

### Админ-панель (доступна только @bypopov)
- Просмотр всех зарегистрированных пользователей
- Информация о каждом пользователе
- Поиск и сортировка

## Настройки бота

- **Имя бота:** @pavepobot
- **ID администратора:** 5093303797 (@bypopov)

## База данных

PostgreSQL хранит:
- `users` - пользователи (telegram_id, username, first_name, last_name)
- `profiles` - профили пользователей (company, department, job_title)
- `business_processes` - бизнес-процессы пользователей
- `quiz_questions` - вопросы тестов
- `quiz_answers` - ответы пользователей

## Технологии

- Node.js
- pg (PostgreSQL клиент)
- node-telegram-bot-api
- Нативный HTTP сервер

## Важные замечания

### Бесплатные тарифы

**Neon DB:**
- Бесплатно: 0.5 GB хранилища, 90 часов вычислений в неделю
- Отлично подходит для небольших проектов
- Бессрочный бесплатный тариф

**Render:**
- **Web Service:** 750 часов/месяц бесплатно (достаточно для одного сервиса)
- **Сон сервиса:** На бесплатном тарифе сервис "засыпает" после 15 минут бездействия. Первый запрос после простоя будет обрабатываться ~30-50 секунд.

### Рекомендации

1. Для продакшена рассмотрите платный тариф Render ($7/мес) чтобы избежать "сна" сервиса
2. Альтернативы: Railway.app, Fly.io
3. Регулярно делайте бэкапы базы данных через панель Neon

## Лицензия

MIT
