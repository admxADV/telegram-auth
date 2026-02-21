/**
 * Сервер для авторизации через Telegram бота + профили пользователей
 * Версия для Render.com с PostgreSQL
 * 
 * AI DEBUG PROMPT: См. .qwen/AI_DEBUG_PROMPT.txt
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const TelegramBot = require('node-telegram-bot-api');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const STATIC_DIR = path.join(__dirname, 'src');

// ID администратора
const ADMIN_USER_ID = parseInt(process.env.ADMIN_USER_ID) || 5093303797;

// ============================================
// STRUCTURED LOGGING SYSTEM
// ============================================

function generateRequestId() {
    return crypto.randomUUID();
}

function log(level, module, message, context = {}) {
    const logEntry = {
        timestamp: new Date().toISOString(),
        level,
        module,
        request_id: context.request_id || 'N/A',
        user_id: context.user_id || 'N/A',
        message,
        ...context
    };
    console.log(JSON.stringify(logEntry));
    return logEntry;
}

const logger = {
    info: (module, message, context = {}) => log('INFO', module, message, context),
    warn: (module, message, context = {}) => log('WARN', module, message, context),
    error: (module, message, context = {}) => log('ERROR', module, message, context),
    debug: (module, message, context = {}) => log('DEBUG', module, message, context)
};

// Global error handler
process.on('uncaughtException', (err) => {
    logger.error('PROCESS', 'Uncaught Exception', {
        error: err.message,
        stack: err.stack,
        request_id: 'N/A'
    });
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('PROCESS', 'Unhandled Rejection', {
        reason: reason?.message || String(reason),
        stack: reason?.stack || 'N/A',
        request_id: 'N/A'
    });
});

// Инициализация PostgreSQL
logger.info('SERVER', 'Запуск инициализации PostgreSQL', {
    DATABASE_URL: process.env.DATABASE_URL ? 'задан (длина: ' + process.env.DATABASE_URL.length + ' симв.)' : 'НЕ задан',
    NODE_ENV: process.env.NODE_ENV || 'not set'
});

// Проверка, является ли DATABASE_URL ссылкой на Neon DB
const isNeonDb = process.env.DATABASE_URL && process.env.DATABASE_URL.includes('neon.tech');
if (isNeonDb) {
    logger.info('DB', 'Обнаружен Neon DB - включаем SSL с rejectUnauthorized=false');
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

// Проверка подключения к БД
pool.on('error', (err) => {
    logger.error('DB', 'Ошибка пула подключений', {
        error: err.message,
        stack: err.stack
    });
});

// Инициализация таблиц
async function initDatabase() {
    const request_id = generateRequestId();
    try {
        // Проверяем подключение к БД
        logger.info('DB', 'Проверка подключения...', { request_id });
        const client = await pool.connect();
        await client.query('SELECT NOW()');
        logger.info('DB', 'Подключение к PostgreSQL успешно', { request_id });
        client.release();

        logger.info('DB', 'Создание таблиц...', { request_id });
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                telegram_id BIGINT UNIQUE NOT NULL,
                username TEXT,
                first_name TEXT,
                last_name TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS profiles (
                id SERIAL PRIMARY KEY,
                user_id INTEGER UNIQUE NOT NULL REFERENCES users(id),
                company TEXT,
                department TEXT,
                job_title TEXT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS business_processes (
                id SERIAL PRIMARY KEY,
                user_id INTEGER UNIQUE NOT NULL REFERENCES users(id),
                main_tasks TEXT,
                work_process TEXT,
                systems_used TEXT,
                process_description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS quiz_questions (
                id SERIAL PRIMARY KEY,
                department TEXT NOT NULL,
                question_number INTEGER NOT NULL,
                question_text TEXT NOT NULL,
                question_type TEXT DEFAULT 'choice',
                options TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS quiz_answers (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id),
                question_id INTEGER NOT NULL REFERENCES quiz_questions(id),
                answer_text TEXT,
                comment_text TEXT,
                answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS auth_sessions (
                token TEXT PRIMARY KEY,
                user_id BIGINT NOT NULL,
                username TEXT,
                first_name TEXT,
                last_name TEXT,
                authorized BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        logger.info('DB', 'База данных инициализирована', { request_id });
    } catch (error) {
        logger.error('DB', 'Ошибка инициализации БД', {
            request_id,
            error: error.message,
            code: error.code,
            stack: error.stack
        });
        logger.error('DB', 'Убедитесь, что DATABASE_URL задан в панели Render', { request_id });
        throw error;
    }
}

// Инициализация Telegram бота
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
// Для production используем RENDER_EXTERNAL_URL или WEBAPP_URL из env
const WEBAPP_URL = process.env.WEBAPP_URL || process.env.RENDER_EXTERNAL_URL || '';
let bot = null;
let botInitialized = false;

// Функция для инициализации бота (вызывается после подключения к БД)
function initTelegramBot() {
    const request_id = generateRequestId();
    
    if (!TELEGRAM_BOT_TOKEN) {
        logger.warn('BOT', 'TELEGRAM_BOT_TOKEN не задан, бот не будет работать', { request_id });
        return;
    }

    if (botInitialized) {
        logger.info('BOT', 'Telegram бот уже инициализирован', { request_id });
        return;
    }

    logger.info('BOT', 'Инициализация Telegram бота...', {
        request_id,
        TELEGRAM_BOT_TOKEN: TELEGRAM_BOT_TOKEN ? 'задан (длина: ' + TELEGRAM_BOT_TOKEN.length + ')' : 'НЕ задан',
        WEBAPP_URL
    });

    try {
        bot = new TelegramBot(TELEGRAM_BOT_TOKEN, {
            polling: {
                interval: 300,
                autoStart: true,
                timeout: 10
            }
        });

        bot.on('polling_error', (error) => {
            logger.error('BOT', 'Polling Error', {
                request_id,
                code: error.code,
                message: error.message
            });

            // Обработка ошибки 409 Conflict - другой экземпляр бота запущен
            if (error.code === 409 || (error.message && error.message.includes('409'))) {
                logger.warn('BOT', 'Бот уже запущен в другом экземпляре', { request_id });
            }
        });

        setupBotHandlers();
        botInitialized = true;
        logger.info('BOT', 'Бот успешно инициализирован', { request_id });
    } catch (error) {
        logger.error('BOT', 'Ошибка инициализации бота', {
            request_id,
            error: error.message,
            stack: error.stack
        });
    }
}

function setupBotHandlers() {
    bot.onText(/\/start (.+)/, async (msg, match) => {
        const request_id = generateRequestId();
        const chatId = msg.chat.id;
        const userId = msg.from.id;
        const authToken = match[1];

        const userData = {
            username: msg.from.username,
            first_name: msg.from.first_name,
            last_name: msg.from.last_name
        };

        logger.info('BOT', 'Получена команда /start с токеном', {
            request_id,
            user_id: userId,
            username: msg.from.username,
            token: authToken ? authToken.substring(0, 20) + '...' : 'N/A'
        });

        try {
            if (authToken && authToken.startsWith('auth_')) {
                await pool.query(`
                    INSERT INTO users (telegram_id, username, first_name, last_name)
                    VALUES ($1, $2, $3, $4)
                    ON CONFLICT (telegram_id) DO UPDATE SET
                        username = EXCLUDED.username,
                        first_name = EXCLUDED.first_name,
                        last_name = EXCLUDED.last_name
                `, [userId, userData.username, userData.first_name, userData.last_name]);

                await pool.query(`
                    INSERT INTO auth_sessions (token, user_id, username, first_name, last_name, authorized)
                    VALUES ($1, $2, $3, $4, $5, true)
                    ON CONFLICT (token) DO UPDATE SET
                        user_id = EXCLUDED.user_id,
                        username = EXCLUDED.username,
                        first_name = EXCLUDED.first_name,
                        last_name = EXCLUDED.last_name,
                        authorized = true,
                        created_at = CURRENT_TIMESTAMP
                `, [authToken, userId, userData.username, userData.first_name, userData.last_name]);

                logger.info('BOT', 'Пользователь успешно авторизован', {
                    request_id,
                    user_id: userId,
                    username: msg.from.username
                });

                await bot.sendMessage(chatId,
                    '✅ *Авторизация успешна!*\n\n' +
                    'Возвращайтесь на сайт.',
                    { parse_mode: 'Markdown' }
                );
            } else {
                await bot.sendMessage(chatId,
                    '❌ *Ошибка авторизации*\n\n' +
                    'Попробуйте войти через сайт ещё раз.',
                    { parse_mode: 'Markdown' }
                );
            }
        } catch (error) {
            logger.error('BOT', 'Ошибка при авторизации', {
                request_id,
                user_id: userId,
                error: error.message,
                stack: error.stack
            });
            await bot.sendMessage(chatId,
                '❌ *Произошла ошибка*\n\n' +
                'Попробуйте позже.',
                { parse_mode: 'Markdown' }
            );
        }
    });

    bot.onText(/\/start$/, (msg) => {
        const request_id = generateRequestId();
        const chatId = msg.chat.id;
        logger.info('BOT', 'Получена команда /start без токена', {
            request_id,
            user_id: msg.from.id
        });
        bot.sendMessage(chatId,
            '👋 *Добро пожаловать в PAVEPO!*\n\n' +
            'Для авторизации нажмите кнопку "Войти через Telegram" на сайте.',
            { parse_mode: 'Markdown' }
        );
    });

    bot.on('message', (msg) => {
        const request_id = generateRequestId();
        if (msg.text && msg.text.startsWith('/')) return;
        const chatId = msg.chat.id;
        logger.info('BOT', 'Получено сообщение', {
            request_id,
            user_id: msg.from.id
        });
        bot.sendMessage(chatId,
            '📩 *PAVEPO Bot*\n\n' +
            'Для авторизации перейдите на сайт и нажмите "Войти через Telegram".',
            { parse_mode: 'Markdown' }
        );
    });

    logger.info('BOT', 'Telegram бот запущен (@pavepobot)');
}

// Инициализация бота будет выполнена после подключения к БД

// MIME-типы
const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

function getMimeType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    return MIME_TYPES[ext] || 'application/octet-stream';
}

function serveStatic(req, res) {
    const request_id = generateRequestId();
    try {
        let filePath = req.url.split('?')[0];
        if (filePath === '/') filePath = '/index.html';
        const fullPath = path.join(STATIC_DIR, filePath);

        if (!fs.existsSync(fullPath)) {
            logger.warn('HTTP', 'Файл не найден', { request_id, file: filePath });
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end('<h1>404 - Файл не найден</h1>');
            return;
        }

        const content = fs.readFileSync(fullPath);
        const mimeType = getMimeType(fullPath);

        // Запрещаем кэширование для JS и HTML файлов
        const noCache = filePath.endsWith('.js') || filePath.endsWith('.html');
        res.writeHead(200, {
            'Content-Type': mimeType,
            'Cache-Control': noCache ? 'no-store, no-cache, must-revalidate' : 'public, max-age=3600'
        });
        logger.debug('HTTP', 'Static file served', { request_id, file: filePath, mimeType });
        res.end(content);
    } catch (error) {
        logger.error('HTTP', 'Ошибка при обработке статики', {
            request_id,
            error: error.message,
            stack: error.stack
        });
        res.writeHead(500, { 'Content-Type': 'text/html' });
        res.end('<h1>500 - Ошибка сервера</h1>');
    }
}

async function handleAuthAPI(req, res, request_id = null, startTime = null) {
    request_id = request_id || generateRequestId();
    startTime = startTime || Date.now();
    
    logger.info('API', `Request: ${req.method} ${req.url}`, {
        request_id,
        method: req.method,
        url: req.url
    });
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('X-Request-ID', request_id);

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    // Проверка авторизации
    if (req.method === 'GET' && req.url.startsWith('/api/auth/check/')) {
        const token = req.url.split('/api/auth/check/')[1];

        try {
            const result = await pool.query(`
                SELECT s.user_id, s.username, s.first_name, s.last_name, s.authorized, u.telegram_id
                FROM auth_sessions s
                LEFT JOIN users u ON s.user_id = u.id
                WHERE s.token = $1 AND s.authorized = true
            `, [token]);

            if (result.rows.length > 0) {
                const session = result.rows[0];
                const userIdForClient = session.telegram_id || session.user_id;
                logger.info('API', 'Auth check success', {
                    request_id,
                    user_id: userIdForClient,
                    telegram_id: session.telegram_id,
                    user_id_type: typeof userIdForClient
                });
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: true,
                    authorized: true,
                    user_id: userIdForClient,
                    telegram_id: session.telegram_id,
                    username: session.username,
                    first_name: session.first_name,
                    last_name: session.last_name
                }));
            } else {
                logger.info('API', 'Auth check: not authorized', { request_id });
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, authorized: false }));
            }
        } catch (error) {
            logger.error('API', 'Auth check error', {
                request_id,
                error: error.message,
                stack: error.stack
            });
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: 'Ошибка сервера' }));
        }
        return;
    }

    // Верификация авторизации от бота
    if (req.method === 'POST' && req.url === '/api/auth/verify') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', async () => {
            try {
                const data = JSON.parse(body);
                const { user_id, auth_token, username, first_name, last_name } = data;

                logger.info('API', 'Получен запрос авторизации', {
                    request_id,
                    user_id,
                    token: auth_token ? auth_token.substring(0, 20) + '...' : 'N/A'
                });

                if (auth_token && auth_token.startsWith('auth_')) {
                    await pool.query(`
                        INSERT INTO users (telegram_id, username, first_name, last_name)
                        VALUES ($1, $2, $3, $4)
                        ON CONFLICT (telegram_id) DO UPDATE SET
                            username = EXCLUDED.username,
                            first_name = EXCLUDED.first_name,
                            last_name = EXCLUDED.last_name
                    `, [user_id, username, first_name, last_name]);

                    logger.info('API', 'Авторизация подтверждена', {
                        request_id,
                        user_id,
                        username
                    });

                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        success: true,
                        message: 'Авторизация успешна',
                        user_id: user_id,
                        username: username,
                        first_name: first_name
                    }));
                } else {
                    logger.warn('API', 'Неверный токен', { request_id, token: auth_token });
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, error: 'Неверный токен' }));
                }
            } catch (error) {
                logger.error('API', 'Ошибка при обработке авторизации', {
                    request_id,
                    error: error.message,
                    stack: error.stack
                });
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: 'Ошибка сервера' }));
            }
        });
        return;
    }

    // Получение всех пользователей (админ)
    if (req.method === 'GET' && req.url === '/api/admin/users') {
        const token = req.headers.authorization || req.url.split('token=')[1]?.split('&')[0];
        let isAdmin = false;
        const tokenToCheck = token ? token.replace('Bearer ', '') : null;

        try {
            // Проверяем сессию в БД
            if (tokenToCheck) {
                const sessionResult = await pool.query(`
                    SELECT s.user_id, u.telegram_id
                    FROM auth_sessions s
                    LEFT JOIN users u ON s.user_id = u.id
                    WHERE s.token = $1 AND s.authorized = true
                `, [tokenToCheck]);

                if (sessionResult.rows.length > 0) {
                    const telegramId = sessionResult.rows[0].telegram_id;
                    // Проверяем telegram_id если он доступен
                    if (telegramId && telegramId === ADMIN_USER_ID) {
                        isAdmin = true;
                    }
                }
            }
        } catch (error) {
            logger.error('API', 'Ошибка проверки прав администратора', {
                request_id,
                error: error.message,
                stack: error.stack
            });
        }

        if (!isAdmin) {
            logger.warn('API', 'Доступ запрещён - не админ', { request_id });
            res.writeHead(403, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Доступ запрещён' }));
            return;
        }

        try {
            const result = await pool.query(`
                SELECT u.telegram_id, u.username, u.first_name, u.last_name, u.created_at,
                       p.company, p.department, p.job_title,
                       bp.main_tasks, bp.work_process, bp.systems_used, bp.process_description
                FROM users u
                LEFT JOIN profiles p ON u.id = p.user_id
                LEFT JOIN business_processes bp ON u.id = bp.user_id
                ORDER BY u.created_at DESC
            `);
            logger.info('API', 'Получен список пользователей', {
                request_id,
                count: result.rows.length
            });
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ users: result.rows }));
        } catch (err) {
            logger.error('API', 'Ошибка получения пользователей', {
                request_id,
                error: err.message,
                stack: err.stack
            });
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Ошибка базы данных' }));
        }
        return;
    }

    // Получение профиля
    if (req.method === 'GET' && req.url.startsWith('/api/profile/')) {
        const userId = req.url.split('/api/profile/')[1];

        try {
            const result = await pool.query(`
                SELECT u.telegram_id, u.username, u.first_name, u.last_name,
                       p.company, p.department, p.job_title
                FROM users u
                LEFT JOIN profiles p ON u.id = p.user_id
                WHERE u.telegram_id = $1
            `, [userId]);

            const row = result.rows[0];
            if (row) {
                logger.info('API', 'Профиль получен', { request_id, user_id: userId });
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: true,
                    profile: {
                        company: row.company,
                        department: row.department,
                        jobTitle: row.job_title
                    }
                }));
            } else {
                logger.info('API', 'Профиль не найден', { request_id, user_id: userId });
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, profile: null }));
            }
        } catch (err) {
            logger.error('API', 'Ошибка получения профиля', {
                request_id,
                error: err.message,
                stack: err.stack
            });
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Ошибка базы данных' }));
        }
        return;
    }

    // Сохранение профиля
    if (req.method === 'POST' && req.url === '/api/profile') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', async () => {
            try {
                const data = JSON.parse(body);
                const { user_id, company, department, job_title } = data;

                logger.info('API', 'Сохранение профиля', {
                    request_id,
                    user_id,
                    company,
                    department,
                    job_title
                });

                const userResult = await pool.query('SELECT id FROM users WHERE telegram_id = $1', [user_id]);
                if (userResult.rows.length === 0) {
                    logger.warn('API', 'Пользователь не найден', { request_id, user_id });
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, error: 'Пользователь не найден' }));
                    return;
                }

                const internalId = userResult.rows[0].id;

                await pool.query(`
                    INSERT INTO profiles (user_id, company, department, job_title, updated_at)
                    VALUES ($1, $2, $3, $4, NOW())
                    ON CONFLICT (user_id) DO UPDATE SET
                        company = EXCLUDED.company,
                        department = EXCLUDED.department,
                        job_title = EXCLUDED.job_title,
                        updated_at = NOW()
                `, [internalId, company, department, job_title]);

                logger.info('API', 'Профиль сохранён', { request_id, user_id });
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true }));
            } catch (error) {
                logger.error('API', 'Ошибка при сохранении профиля', {
                    request_id,
                    error: error.message,
                    stack: error.stack
                });
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: 'Ошибка сервера' }));
            }
        });
        return;
    }

    // Получение бизнес-процесса
    if (req.method === 'GET' && req.url.startsWith('/api/business-process/')) {
        const userId = req.url.split('/api/business-process/')[1];

        try {
            const userResult = await pool.query('SELECT id FROM users WHERE telegram_id = $1', [userId]);
            if (userResult.rows.length === 0) {
                logger.warn('API', 'Пользователь не найден для бизнес-процесса', { request_id, user_id: userId });
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Пользователь не найден' }));
                return;
            }

            const internalId = userResult.rows[0].id;
            const result = await pool.query('SELECT * FROM business_processes WHERE user_id = $1', [internalId]);

            if (result.rows[0]) {
                const row = result.rows[0];
                logger.info('API', 'Бизнес-процесс получен', { request_id, user_id: userId });
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: true,
                    process: {
                        mainTasks: row.main_tasks,
                        workProcess: row.work_process,
                        systemsUsed: row.systems_used,
                        processDescription: row.process_description
                    }
                }));
            } else {
                logger.info('API', 'Бизнес-процесс не найден', { request_id, user_id: userId });
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, process: null }));
            }
        } catch (err) {
            logger.error('API', 'Ошибка получения бизнес-процесса', {
                request_id,
                error: err.message,
                stack: err.stack
            });
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Ошибка базы данных' }));
        }
        return;
    }

    // Сохранение бизнес-процесса
    if (req.method === 'POST' && req.url === '/api/business-process') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', async () => {
            try {
                const data = JSON.parse(body);
                const { user_id, main_tasks, work_process, systems_used, process_description } = data;

                const userResult = await pool.query('SELECT id FROM users WHERE telegram_id = $1', [user_id]);
                if (userResult.rows.length === 0) {
                    logger.warn('API', 'Пользователь не найден', { request_id, user_id });
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, error: 'Пользователь не найден' }));
                    return;
                }

                const internalId = userResult.rows[0].id;

                await pool.query(`
                    INSERT INTO business_processes
                    (user_id, main_tasks, work_process, systems_used, process_description, updated_at)
                    VALUES ($1, $2, $3, $4, $5, NOW())
                    ON CONFLICT (user_id) DO UPDATE SET
                        main_tasks = EXCLUDED.main_tasks,
                        work_process = EXCLUDED.work_process,
                        systems_used = EXCLUDED.systems_used,
                        process_description = EXCLUDED.process_description,
                        updated_at = NOW()
                `, [internalId, main_tasks, work_process, systems_used, process_description]);

                logger.info('API', 'Бизнес-процесс сохранён', { request_id, user_id });
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true }));
            } catch (error) {
                logger.error('API', 'Ошибка при сохранении бизнес-процесса', {
                    request_id,
                    error: error.message,
                    stack: error.stack
                });
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: 'Ошибка сервера' }));
            }
        });
        return;
    }

    // Получение списка вопросов для отдела
    if (req.method === 'GET' && req.url.startsWith('/api/quiz/questions/')) {
        const department = req.url.split('/api/quiz/questions/')[1];

        try {
            const result = await pool.query(`
                SELECT id, question_number, question_text, question_type, options
                FROM quiz_questions
                WHERE department = $1
                ORDER BY question_number ASC
            `, [department]);

            const questions = result.rows.map(row => ({
                ...row,
                options: row.options ? JSON.parse(row.options) : null
            }));

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, questions }));
        } catch (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Ошибка базы данных' }));
        }
        return;
    }

    // Сохранение ответа на вопрос
    if (req.method === 'POST' && req.url === '/api/quiz/answer') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', async () => {
            try {
                const data = JSON.parse(body);
                const { user_id, question_id, answer_text, comment_text } = data;

                logger.info('API', 'Сохранение ответа на вопрос', {
                    request_id,
                    user_id,
                    question_id
                });

                const userResult = await pool.query('SELECT id FROM users WHERE telegram_id = $1', [user_id]);
                if (userResult.rows.length === 0) {
                    logger.warn('API', 'Пользователь не найден', { request_id, user_id });
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, error: 'Пользователь не найден' }));
                    return;
                }

                const internalId = userResult.rows[0].id;

                await pool.query(`
                    INSERT INTO quiz_answers (user_id, question_id, answer_text, comment_text, answered_at)
                    VALUES ($1, $2, $3, $4, NOW())
                    ON CONFLICT (user_id, question_id) DO UPDATE SET
                        answer_text = EXCLUDED.answer_text,
                        comment_text = EXCLUDED.comment_text,
                        answered_at = NOW()
                `, [internalId, question_id, answer_text, comment_text]);

                logger.info('API', 'Ответ сохранён', { request_id, user_id, question_id });
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true }));
            } catch (error) {
                logger.error('API', 'Ошибка при сохранении ответа', {
                    request_id,
                    error: error.message,
                    stack: error.stack
                });
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: 'Ошибка сервера' }));
            }
        });
        return;
    }

    // Получение ответов пользователя (для админки)
    if (req.method === 'GET' && req.url.startsWith('/api/admin/quiz-answers/')) {
        const token = req.headers.authorization || req.url.split('token=')[1]?.split('&')[0];
        let isAdmin = false;
        const tokenToCheck = token ? token.replace('Bearer ', '') : null;

        try {
            if (tokenToCheck) {
                const sessionResult = await pool.query(`
                    SELECT s.user_id, u.telegram_id
                    FROM auth_sessions s
                    LEFT JOIN users u ON s.user_id = u.id
                    WHERE s.token = $1 AND s.authorized = true
                `, [tokenToCheck]);

                if (sessionResult.rows.length > 0) {
                    const telegramId = sessionResult.rows[0].telegram_id;
                    if (telegramId && telegramId === ADMIN_USER_ID) {
                        isAdmin = true;
                    }
                }
            }
        } catch (error) {
            logger.error('API', 'Ошибка проверки прав администратора', {
                request_id,
                error: error.message,
                stack: error.stack
            });
        }

        if (!isAdmin) {
            logger.warn('API', 'Доступ запрещён - не админ', { request_id });
            res.writeHead(403, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Доступ запрещён' }));
            return;
        }

        const telegramUserId = req.url.split('/api/admin/quiz-answers/')[1];

        try {
            const userResult = await pool.query('SELECT id FROM users WHERE telegram_id = $1', [telegramUserId]);
            if (userResult.rows.length === 0) {
                logger.warn('API', 'Пользователь не найден', { request_id, user_id: telegramUserId });
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Пользователь не найден' }));
                return;
            }

            const internalId = userResult.rows[0].id;

            const result = await pool.query(`
                SELECT qa.*, qq.question_text, qq.question_number, qq.department
                FROM quiz_answers qa
                JOIN quiz_questions qq ON qa.question_id = qq.id
                WHERE qa.user_id = $1
                ORDER BY qq.department, qq.question_number
            `, [internalId]);

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, answers: result.rows }));
        } catch (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Ошибка базы данных' }));
        }
        return;
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
}

function handleRequest(req, res) {
    const request_id = generateRequestId();
    const startTime = Date.now();
    
    // Добавляем request_id в заголовки ответа
    res.setHeader('X-Request-ID', request_id);
    
    // Health check endpoint
    if (req.url === '/health' || req.url === '/api/health') {
        handleHealthCheck(req, res, request_id);
        return;
    }
    
    // Тестовый endpoint для проверки версии
    if (req.url === '/version.json') {
        logger.info('HTTP', 'Request /version.json', { request_id });
        res.writeHead(200, {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store'
        });
        res.end(JSON.stringify({
            version: '2026-02-20-admin-fix',
            timestamp: Date.now()
        }));
        return;
    }

    // Админка через сервер для обхода кэша
    if (req.url === '/admin.html' || req.url === '/admin-new.html') {
        const fs = require('fs');
        const path = require('path');
        const filePath = path.join(STATIC_DIR, 'admin.html');

        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath);
            res.writeHead(200, {
                'Content-Type': 'text/html',
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            });
            res.end(content);
            return;
        }
    }

    if (req.url.startsWith('/api/')) {
        handleAuthAPI(req, res, request_id, startTime);
        return;
    }
    
    // Логируем запрос к статике
    logger.debug('HTTP', `Static request: ${req.url}`, { request_id });
    serveStatic(req, res);
}

// Health check handler
async function handleHealthCheck(req, res, request_id) {
    const startTime = Date.now();
    
    try {
        // Проверяем подключение к БД
        await pool.query('SELECT 1');
        const dbStatus = 'healthy';
        
        // Проверяем бота
        const botStatus = botInitialized ? 'healthy' : 'not_initialized';
        
        const health = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            services: {
                database: dbStatus,
                bot: botStatus
            },
            uptime: process.uptime()
        };
        
        logger.info('HEALTH', 'Health check passed', {
            request_id,
            health_status: health.status,
            response_time_ms: Date.now() - startTime
        });
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(health));
    } catch (error) {
        const health = {
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: error.message,
            uptime: process.uptime()
        };
        
        logger.error('HEALTH', 'Health check failed', {
            request_id,
            error: error.message,
            response_time_ms: Date.now() - startTime
        });
        
        res.writeHead(503, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(health));
    }
}

// Инициализация и запуск сервера
async function startServer() {
    const request_id = generateRequestId();
    
    logger.info('SERVER', 'Запуск сервера...', {
        request_id,
        NODE_ENV: process.env.NODE_ENV || 'not set',
        PORT: process.env.PORT || PORT,
        DATABASE_URL: process.env.DATABASE_URL ? 'задан (длина: ' + process.env.DATABASE_URL.length + ')' : 'НЕ задан',
        WEBAPP_URL: process.env.WEBAPP_URL || 'not set'
    });

    await initDatabase();

    // Инициализируем Telegram бота после подключения к БД
    initTelegramBot();

    const server = http.createServer(handleRequest);

    // Render устанавливает PORT, используем его вместо локальной константы
    const listenPort = process.env.PORT || PORT;
    server.listen(listenPort, '0.0.0.0', () => {
        const actualUrl = process.env.WEBAPP_URL || `http://localhost:${listenPort}`;
        logger.info('SERVER', 'Сервер авторизации запущен!', {
            request_id,
            url: actualUrl,
            port: listenPort
        });
    });
}

startServer();
