/**
 * Сервер для авторизации через Telegram бота + профили пользователей
 * Версия для Render.com с PostgreSQL
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const TelegramBot = require('node-telegram-bot-api');

const PORT = process.env.PORT || 3000;
const STATIC_DIR = path.join(__dirname, 'src');

// ID администратора
const ADMIN_USER_ID = parseInt(process.env.ADMIN_USER_ID) || 5093303797;

// Инициализация PostgreSQL
console.log('🔍 [DB] Проверка подключения к PostgreSQL...');
console.log('🔍 [DB] DATABASE_URL:', process.env.DATABASE_URL ? 'задан (длина: ' + process.env.DATABASE_URL.length + ' симв.)' : 'НЕ задан');
console.log('🔍 [DB] NODE_ENV:', process.env.NODE_ENV || 'not set');

// Проверка, является ли DATABASE_URL ссылкой на Neon DB
const isNeonDb = process.env.DATABASE_URL && process.env.DATABASE_URL.includes('neon.tech');
if (isNeonDb) {
    console.log('🔵 [DB] Обнаружен Neon DB - включаем SSL с rejectUnauthorized=false');
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

// Проверка подключения к БД
pool.on('error', (err) => {
    console.error('❌ [DB] Ошибка пула подключений:', err.message);
});

// Инициализация таблиц
async function initDatabase() {
    try {
        // Проверяем подключение к БД
        console.log('🔍 [DB] Проверка подключения...');
        const client = await pool.connect();
        await client.query('SELECT NOW()');
        console.log('✅ [DB] Подключение к PostgreSQL успешно');
        client.release();
        
        console.log('📝 [DB] Создание таблиц...');
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

        console.log('✅ [DB] База данных инициализирована');
    } catch (error) {
        console.error('❌ [DB] Ошибка инициализации БД:', error.message);
        console.error('❌ [DB] Код ошибки:', error.code);
        console.error('❌ [DB] Убедитесь, что DATABASE_URL задан в панели Render');
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
    if (!TELEGRAM_BOT_TOKEN) {
        console.warn('⚠️ TELEGRAM_BOT_TOKEN не задан, бот не будет работать');
        return;
    }
    
    if (botInitialized) {
        console.log('ℹ️ Telegram бот уже инициализирован');
        return;
    }

    console.log('🔧 Инициализация Telegram бота...');
    console.log('🔧 TELEGRAM_BOT_TOKEN:', TELEGRAM_BOT_TOKEN ? 'задан (длина: ' + TELEGRAM_BOT_TOKEN.length + ')' : 'НЕ задан');
    console.log('🔧 WEBAPP_URL:', WEBAPP_URL);

    try {
        bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { 
            polling: { 
                interval: 300,
                autoStart: true,
                timeout: 10
            }
        });

        bot.on('polling_error', (error) => {
            console.error('❌ [Polling Error]:', error.code, error.message);
            
            // Обработка ошибки 409 Conflict - другой экземпляр бота запущен
            if (error.code === 409 || (error.message && error.message.includes('409'))) {
                console.warn('⚠️ Бот уже запущен в другом экземпляре. Останавливаем polling...');
                // Не останавливаем polling - Render сам управляет экземплярами
            }
        });

        setupBotHandlers();
        botInitialized = true;
        console.log('✅ Бот успешно инициализирован');
    } catch (error) {
        console.error('❌ Ошибка инициализации бота:', error.message);
    }
}

function setupBotHandlers() {
    bot.onText(/\/start (.+)/, async (msg, match) => {
        const chatId = msg.chat.id;
        const userId = msg.from.id;
        const authToken = match[1];

        const userData = {
            username: msg.from.username,
            first_name: msg.from.first_name,
            last_name: msg.from.last_name
        };

        console.log(`🔔 Получена команда /start от пользователя ${userId} (@${userData.username}) с токеном ${authToken}`);

        try {
            // Проверяем токен и сохраняем пользователя напрямую в БД
            if (authToken && authToken.startsWith('auth_')) {
                // Сохраняем пользователя в БД
                await pool.query(`
                    INSERT INTO users (telegram_id, username, first_name, last_name)
                    VALUES ($1, $2, $3, $4)
                    ON CONFLICT (telegram_id) DO UPDATE SET
                        username = EXCLUDED.username,
                        first_name = EXCLUDED.first_name,
                        last_name = EXCLUDED.last_name
                `, [userId, userData.username, userData.first_name, userData.last_name]);

                // Сохраняем сессию в БД (вместо памяти)
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

                console.log(`✅ Пользователь ${userId} (@${userData.username}) успешно авторизован`);

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
            console.error('Ошибка при авторизации:', error);
            await bot.sendMessage(chatId,
                '❌ *Произошла ошибка*\n\n' +
                'Попробуйте позже.',
                { parse_mode: 'Markdown' }
            );
        }
    });

    bot.onText(/\/start$/, (msg) => {
        const chatId = msg.chat.id;
        bot.sendMessage(chatId,
            '👋 *Добро пожаловать в PAVEPO!*\n\n' +
            'Для авторизации нажмите кнопку "Войти через Telegram" на сайте.',
            { parse_mode: 'Markdown' }
        );
    });

    bot.on('message', (msg) => {
        if (msg.text && msg.text.startsWith('/')) return;
        const chatId = msg.chat.id;
        bot.sendMessage(chatId,
            '📩 *PAVEPO Bot*\n\n' +
            'Для авторизации перейдите на сайт и нажмите "Войти через Telegram".',
            { parse_mode: 'Markdown' }
        );
    });

    console.log('✅ Telegram бот запущен (@pavepobot)');
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
    try {
        let filePath = req.url.split('?')[0];
        if (filePath === '/') filePath = '/index.html';
        const fullPath = path.join(STATIC_DIR, filePath);

        if (!fs.existsSync(fullPath)) {
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
        res.end(content);
    } catch (error) {
        console.error('Ошибка при обработке статики:', error);
        res.writeHead(500, { 'Content-Type': 'text/html' });
        res.end('<h1>500 - Ошибка сервера</h1>');
    }
}

async function handleAuthAPI(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    // Проверка авторизации
    if (req.method === 'GET' && req.url.startsWith('/api/auth/check/')) {
        const token = req.url.split('/api/auth/check/')[1];

        try {
            // Читаем сессию из БД
            // JOIN с users для получения telegram_id
            const result = await pool.query(`
                SELECT s.user_id, s.username, s.first_name, s.last_name, s.authorized, u.telegram_id
                FROM auth_sessions s
                LEFT JOIN users u ON s.user_id = u.id
                WHERE s.token = $1 AND s.authorized = true
            `, [token]);

            if (result.rows.length > 0) {
                const session = result.rows[0];
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: true,
                    authorized: true,
                    user_id: session.telegram_id, // Возвращаем telegram_id для проверки админ-прав
                    username: session.username,
                    first_name: session.first_name,
                    last_name: session.last_name
                }));
            } else {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, authorized: false }));
            }
        } catch (error) {
            console.error('Ошибка проверки авторизации:', error);
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

                console.log(`🔔 [API] Получен запрос авторизации: user_id=${user_id}, token=${auth_token}`);
                console.log(`🔔 [API] Данные пользователя: username=${username}, first_name=${first_name}, last_name=${last_name}`);

                if (auth_token && auth_token.startsWith('auth_')) {
                    await pool.query(`
                        INSERT INTO users (telegram_id, username, first_name, last_name)
                        VALUES ($1, $2, $3, $4)
                        ON CONFLICT (telegram_id) DO UPDATE SET
                            username = EXCLUDED.username,
                            first_name = EXCLUDED.first_name,
                            last_name = EXCLUDED.last_name
                    `, [user_id, username, first_name, last_name]);

                    authSessions.set(auth_token, {
                        user_id: user_id,
                        username: username,
                        first_name: first_name,
                        last_name: last_name,
                        authorized: true,
                        timestamp: Date.now()
                    });

                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        success: true,
                        message: 'Авторизация успешна',
                        user_id: user_id,
                        username: username,
                        first_name: first_name
                    }));

                    console.log(`Авторизация подтверждена для user_id=${user_id}, username=@${username}`);
                } else {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, error: 'Неверный токен' }));
                }
            } catch (error) {
                console.error('Ошибка при обработке авторизации:', error);
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
                    if (telegramId === ADMIN_USER_ID) {
                        isAdmin = true;
                    }
                }
            }
        } catch (error) {
            console.error('Ошибка проверки прав администратора:', error);
        }

        if (!isAdmin) {
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
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ users: result.rows }));
        } catch (err) {
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
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, profile: null }));
            }
        } catch (err) {
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

                console.log(`Сохранение профиля: user_id=${user_id}, company=${company}, department=${department}, job=${job_title}`);

                const userResult = await pool.query('SELECT id FROM users WHERE telegram_id = $1', [user_id]);
                if (userResult.rows.length === 0) {
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

                console.log('Профиль сохранён для user_id=' + user_id);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true }));
            } catch (error) {
                console.error('Ошибка при сохранении профиля:', error);
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
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Ошибка базы данных' }));
                return;
            }

            const internalId = userResult.rows[0].id;
            const result = await pool.query('SELECT * FROM business_processes WHERE user_id = $1', [internalId]);

            if (result.rows[0]) {
                const row = result.rows[0];
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
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, process: null }));
            }
        } catch (err) {
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

                console.log('Бизнес-процесс сохранён для user_id=' + user_id);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true }));
            } catch (error) {
                console.error('Ошибка при сохранении бизнес-процесса:', error);
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

                const userResult = await pool.query('SELECT id FROM users WHERE telegram_id = $1', [user_id]);
                if (userResult.rows.length === 0) {
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

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true }));
            } catch (error) {
                console.error('Ошибка при сохранении ответа:', error);
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
                    if (telegramId === ADMIN_USER_ID) {
                        isAdmin = true;
                    }
                }
            }
        } catch (error) {
            console.error('Ошибка проверки прав администратора:', error);
        }

        if (!isAdmin) {
            res.writeHead(403, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Доступ запрещён' }));
            return;
        }

        const telegramUserId = req.url.split('/api/admin/quiz-answers/')[1];

        try {
            const userResult = await pool.query('SELECT id FROM users WHERE telegram_id = $1', [telegramUserId]);
            if (userResult.rows.length === 0) {
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
    // Тестовый endpoint для проверки версии
    if (req.url === '/version.json') {
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
        handleAuthAPI(req, res);
        return;
    }
    serveStatic(req, res);
}

// Инициализация и запуск сервера
async function startServer() {
    console.log('🔧 Запуск сервера...');
    console.log('🔧 NODE_ENV:', process.env.NODE_ENV || 'not set');
    console.log('🔧 PORT:', process.env.PORT || PORT);
    console.log('🔧 DATABASE_URL:', process.env.DATABASE_URL ? 'задан (длина: ' + process.env.DATABASE_URL.length + ')' : 'НЕ задан');
    console.log('🔧 WEBAPP_URL:', process.env.WEBAPP_URL || 'not set');

    await initDatabase();
    
    // Инициализируем Telegram бота после подключения к БД
    initTelegramBot();

    const server = http.createServer(handleRequest);

    // Render устанавливает PORT, используем его вместо локальной константы
    const listenPort = process.env.PORT || PORT;
    server.listen(listenPort, '0.0.0.0', () => {
        const actualUrl = process.env.WEBAPP_URL || `http://localhost:${listenPort}`;
        console.log('='.repeat(50));
        console.log('✅ Сервер авторизации запущен!');
        console.log('='.repeat(50));
        console.log('URL:', actualUrl);
        console.log('Остановить: Ctrl+C');
        console.log('='.repeat(50));
    });
}

startServer();
