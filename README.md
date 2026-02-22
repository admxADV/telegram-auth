# Trend Platform

Платформа Trend - проект с авторизацией через Telegram.

## Архитектура

Согласно PDF "УниверсальныеПравила":
- **SOLID принципы**
- **DRY** (Don't Repeat Yourself)
- **KISS** (Keep It Simple, Stupid)
- Структурированное логирование
- Явная типизация

## Структура проекта

```
trend/
├── backend/                   # Серверная часть (Node.js)
│   ├── src/
│   │   └── server.js         # Основной сервер
│   ├── .env.example         # Пример конфигурации
│   └── package.json
│
├── frontend/                  # Клиентская часть
│   ├── index.html            # Первый экран авторизации
│   ├── styles.css           # Стили
│   └── script.js            # Логика авторизации
│
└── README.md
```

## Технологический стек

- **Backend**: Node.js, PostgreSQL
- **Frontend**: HTML, CSS, JavaScript (ванильный)
- **Авторизация**: Telegram Bot API

## Установка и запуск

### Требования

- Node.js >= 18.0.0
- PostgreSQL

### Backend

```bash
cd trend/backend
cp .env.example .env
# Отредактируйте .env файл

npm install
npm start
```

### Конфигурация .env

```env
PORT=3000
DATABASE_URL=postgres://user:password@localhost:5432/trend
TELEGRAM_BOT_TOKEN=your_bot_token_here
ADMIN_USER_ID=5093303797
```

## API Endpoints

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/auth/check/:token` | Проверка статуса авторизации |
| POST | `/api/auth/start` | Начало сессии авторизации |
| POST | `/api/auth/verify` | Верификация от Telegram бота |

## Первый экран

Дизайн взят из проекта `telegram-auth`:
- Логотип TREND
- Заголовок "Добро пожаловать"
- Кнопка "Войти через Telegram"
- Адаптивный дизайн

## Разработка

```bash
# Запуск backend
cd backend
npm run dev

# Frontend не требует сборки - используется статика
# Просто откройте index.html через сервер
```
