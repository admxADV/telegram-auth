/**
 * Trend Platform Backend
 * Сервер для авторизации через Telegram бота
 *
 * Архитектура согласно PDF "УниверсальныеПравила":
 * - SOLID принципы
 * - DRY (Don't Repeat Yourself)
 * - KISS (Keep It Simple, Stupid)
 * - Structured Logging
 *
 * Поддержка PostgreSQL и JSON-файла
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const https = require('https');

// PostgreSQL support
const dbModule = require('./db');

// Адаптер для поддержки JSON и PostgreSQL
let usePostgreSQL = false;

const db = {
    users: {
        get: (id) => usePostgreSQL ? null : db.users._map.get(id),
        set: (id, user) => {
            if (usePostgreSQL) {
                dbModule.createUser(user);
            } else {
                db.users._map.set(id, user);
            }
        },
        has: (id) => usePostgreSQL ? false : db.users._map.has(id),
        forEach: (fn) => { if (!usePostgreSQL) db.users._map.forEach(fn); },
        keys: () => usePostgreSQL ? [] : db.users._map.keys(),
        _map: new Map()
    },
    sessions: {
        get: (token) => usePostgreSQL ? null : db.sessions._map.get(token),
        set: (token, session) => {
            if (usePostgreSQL) {
                dbModule.createSession(session);
            } else {
                db.sessions._map.set(token, session);
            }
        },
        has: (token) => usePostgreSQL ? false : db.sessions._map.has(token),
        delete: (token) => { if (!usePostgreSQL) db.sessions._map.delete(token); },
        forEach: (fn) => { if (!usePostgreSQL) db.sessions._map.forEach(fn); },
        keys: () => usePostgreSQL ? [] : db.sessions._map.keys(),
        _map: new Map()
    },
    testResults: {
        set: (key, result) => {
            if (usePostgreSQL) {
                dbModule.saveTestResult(result);
            } else {
                db.testResults._map.set(key, result);
            }
        },
        forEach: (fn) => { if (!usePostgreSQL) db.testResults._map.forEach(fn); },
        keys: () => usePostgreSQL ? [] : db.testResults._map.keys(),
        _map: new Map()
    },
    chatMessages: {
        set: (id, msg) => {
            if (usePostgreSQL) {
                dbModule.addChatMessage(msg);
            } else {
                db.chatMessages._map.set(id, msg);
            }
        },
        get: (id) => usePostgreSQL ? null : db.chatMessages._map.get(id),
        has: (id) => usePostgreSQL ? false : db.chatMessages._map.has(id),
        forEach: (fn) => { if (!usePostgreSQL) db.chatMessages._map.forEach(fn); },
        keys: () => usePostgreSQL ? [] : db.chatMessages._map.keys(),
        _map: new Map()
    }
};

const PORT = process.env.PORT || 3000;
const STATIC_DIR = path.join(__dirname, '../../frontend');

// Telegram Bot Token
const TELEGRAM_BOT_TOKEN = '8286036956:AAE57ugY_eIjfumrY7ng76i-dqTuRrw909w';
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

// ID администратора
const ADMIN_USER_ID = parseInt(process.env.ADMIN_USER_ID) || 5093303797;

// ============================================
// LOAD DATA INTO MAPS (для PostgreSQL режима)
// ============================================

async function loadDataIntoMaps() {
    try {
        const users = await dbModule.getAllUsers();
        users.forEach(user => db.users._map.set(user.id, user));

        const testResults = await dbModule.getTestResults();
        testResults.forEach(result => {
            const key = `${result.userId}_${result.testId}`;
            db.testResults._map.set(key, result);
        });

        logger.info('SERVER', 'Данные загружены в Maps из PostgreSQL', {
            usersCount: db.users._map.size,
            testResultsCount: db.testResults._map.size
        });
    } catch (error) {
        logger.error('SERVER', 'Ошибка загрузки в Maps', { error: error.message });
    }
}

// ============================================
// IN-MEMORY DATABASE WITH FILE PERSISTENCE
// ============================================

const DATA_FILE = path.join(__dirname, '../../data.json');

// Load data from file if exists
function loadData() {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
            Object.entries(data.users || {}).forEach(([k, v]) => db.users._map.set(k, v));
            Object.entries(data.sessions || {}).forEach(([k, v]) => db.sessions._map.set(k, v));
            Object.entries(data.testResults || {}).forEach(([k, v]) => db.testResults._map.set(k, v));
            Object.entries(data.chatMessages || {}).forEach(([k, v]) => db.chatMessages._map.set(k, v));
            logger.info('SERVER', 'Данные загружены из файла', {
                usersCount: db.users._map.size,
                sessionsCount: db.sessions._map.size,
                testResultsCount: db.testResults._map.size,
                chatMessagesCount: db.chatMessages._map.size
            });
        } else {
            logger.info('SERVER', 'Файл данных не найден, используем пустую базу');
        }
    } catch (error) {
        logger.error('SERVER', 'Ошибка загрузки данных', { error: error.message });
    }
}

// Save data to file
function saveData() {
    try {
        logger.info('SERVER', 'Сохранение данных');

        const data = {
            users: Object.fromEntries(db.users._map),
            sessions: Object.fromEntries(db.sessions._map),
            testResults: Object.fromEntries(db.testResults._map),
            chatMessages: Object.fromEntries(db.chatMessages._map)
        };
        
        if (!usePostgreSQL) {
            fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
            logger.info('SERVER', 'Данные сохранены в файл', { users: data.users ? Object.keys(data.users).length : 0 });
        } else {
            logger.info('SERVER', 'Данные сохранены в PostgreSQL', { users: data.users ? Object.keys(data.users).length : 0 });
        }
    } catch (error) {
        logger.error('SERVER', 'Ошибка сохранения данных', { error: error.message });
    }
}

// Database version counter
let databaseVersion = 1;

// ============================================
// DATABASE BACKUP AND TELEGRAM NOTIFY
// ============================================

async function sendDatabaseToAdmin() {
    try {
        logger.info('BACKUP', 'Начало отправки базы', { version: databaseVersion });

        const data = {
            users: Object.fromEntries(db.users._map),
            sessions: Object.fromEntries(db.sessions._map),
            testResults: Object.fromEntries(db.testResults._map),
            chatMessages: Object.fromEntries(db.chatMessages._map)
        };

        const jsonData = JSON.stringify(data, null, 2);
        const filePath = path.join(__dirname, `../../backup_v${databaseVersion}.json`);
        fs.writeFileSync(filePath, jsonData);
        logger.info('BACKUP', 'Файл сохранён', { path: filePath, size: jsonData.length });

        // Send text message first
        const caption = `🗄️ Версия базы №${databaseVersion}\n\nПользователей: ${db.users.size}\nСессий: ${db.sessions.size}\nТестов: ${db.testResults.size}\nСообщений: ${db.chatMessages.size}`;
        
        const msgBody = JSON.stringify({
            chat_id: String(ADMIN_USER_ID),
            text: caption
        });
        
        logger.info('BACKUP', 'Отправка сообщения', { chat_id: ADMIN_USER_ID, caption_length: caption.length });
        
        await new Promise((resolve, reject) => {
            const req = https.request(`${TELEGRAM_API_URL}/sendMessage`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': msgBody.length
                }
            }, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    logger.info('BACKUP', 'Ответ Telegram', { 
                        status: res.statusCode, 
                        response: data.substring(0, 500) 
                    });
                    try {
                        const result = JSON.parse(data);
                        logger.info('BACKUP', 'Текстовое сообщение', { ok: result.ok, message_id: result.result?.message_id });
                        resolve(result);
                    } catch (e) {
                        logger.error('BACKUP', 'Не удалось распарсить ответ Telegram', { 
                            response: data.substring(0, 200),
                            status: res.statusCode 
                        });
                        resolve({ ok: false, error: 'Invalid JSON', raw: data.substring(0, 200) });
                    }
                });
            });
            req.on('error', reject);
            req.write(msgBody);
            req.end();
        });
        
        // Send file
        const fileBody = Buffer.concat([
            Buffer.from(`------WebKitFormBoundary7MA4YWxkTrZu0gW\r\n`),
            Buffer.from(`Content-Disposition: form-data; name="chat_id"\r\n\r\n`),
            Buffer.from(`${ADMIN_USER_ID}\r\n`),
            Buffer.from(`------WebKitFormBoundary7MA4YWxkTrZu0gW\r\n`),
            Buffer.from(`Content-Disposition: form-data; name="document"; filename="database_v${databaseVersion}.json"\r\n`),
            Buffer.from(`Content-Type: application/json\r\n\r\n`),
            fs.readFileSync(filePath),
            Buffer.from(`\r\n------WebKitFormBoundary7MA4YWxkTrZu0gW--\r\n`)
        ]);
        
        const fileResult = await new Promise((resolve, reject) => {
            const req = https.request(`${TELEGRAM_API_URL}/sendDocument`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW',
                    'Content-Length': fileBody.length
                }
            }, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        const result = JSON.parse(data);
                        resolve(result);
                    } catch (e) {
                        logger.error('BACKUP', 'Не удалось распарсить ответ Telegram', { 
                            response: data.substring(0, 200),
                            status: res.statusCode 
                        });
                        resolve({ ok: false, error: 'Invalid JSON response', raw: data.substring(0, 200) });
                    }
                });
            });
            req.on('error', (err) => {
                logger.error('BACKUP', 'Ошибка запроса', { error: err.message });
                reject(err);
            });
            req.write(fileBody);
            req.end();
        });
        
        logger.info('BACKUP', 'Файл отправлен', { ok: fileResult.ok, file_id: fileResult.result?.document?.file_id });
        
        // Clean up old backup files (keep last 5)
        const backupDir = path.join(__dirname, '../../');
        const backupFiles = fs.readdirSync(backupDir)
            .filter(f => f.startsWith('backup_v') && f.endsWith('.json'))
            .sort()
            .reverse();
        
        backupFiles.slice(5).forEach(file => {
            fs.unlinkSync(path.join(backupDir, file));
        });
        
        databaseVersion++;
    } catch (error) {
        logger.error('BACKUP', 'Критическая ошибка отправки', { error: error.message, stack: error.stack });
    }
}

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

logger.info('SERVER', 'Запуск сервера (режим: in-memory DB)', {
    PORT,
    static_dir: STATIC_DIR,
    bot_token: TELEGRAM_BOT_TOKEN ? 'configured' : 'not set'
});

// ============================================
// TELEGRAM BOT POLLING
// ============================================

let lastUpdateId = 0;

/**
 * Отправляет запрос к Telegram Bot API
 */
function telegramRequest(method, data = {}) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify(data);
        const url = new URL(`${TELEGRAM_API_URL}/${method}`);
        
        const options = {
            hostname: url.hostname,
            port: 443,
            path: url.pathname,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => { body += chunk; });
            res.on('end', () => {
                try {
                    const json = JSON.parse(body);
                    resolve(json);
                } catch (e) {
                    reject(e);
                }
            });
        });

        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

/**
 * Обрабатывает входящие обновления от Telegram
 */
async function handleTelegramUpdate(update) {
    if (!update.message || !update.message.text) return;
    
    const message = update.message;
    const chatId = message.chat.id;
    const text = message.text;
    const user = message.from;
    
    logger.info('TELEGRAM', 'Получено сообщение', {
        chat_id: chatId,
        text,
        username: user.username,
        first_name: user.first_name
    });
    
    // Проверяем /start команду с токеном
    if (text.startsWith('/start ')) {
        let authToken = text.substring(7).trim(); // Убираем "/start "
        
        // Декодируем токен (если был закодирован)
        try {
            authToken = decodeURIComponent(authToken);
        } catch (e) {
            // Если декодирование не удалось, используем как есть
        }

        if (authToken.startsWith('auth_')) {
            // Проверяем, что сессия существует
            const session = usePostgreSQL ? await dbModule.getSession(authToken) : db.sessions.get(authToken);
            if (session) {
                // Авторизуем пользователя
                const userId = 'user_' + user.id;
                if (usePostgreSQL) {
                    await dbModule.createUser({
                        id: userId,
                        telegramId: user.id,
                        username: user.username,
                        firstName: user.first_name,
                        lastName: user.last_name,
                        createdAt: new Date().toISOString()
                    });
                    await dbModule.updateSession(authToken, {
                        authorized: true,
                        userId: userId,
                        telegramId: user.id
                    });
                } else {
                    db.users.set(userId, {
                        id: userId,
                        telegramId: user.id,
                        username: user.username,
                        firstName: user.first_name,
                        lastName: user.last_name,
                        createdAt: new Date().toISOString()
                    });

                    session.authorized = true;
                    session.userId = userId;
                    session.telegramId = user.id; // Добавляем telegramId для проверки админа
                    db.sessions.set(authToken, session);
                }

                saveData(); // Сохраняем в файл

                // Отправляем подтверждение пользователю
                await telegramRequest('sendMessage', {
                    chat_id: chatId,
                    text: '✅ Авторизация успешна! Теперь вернитесь на сайт и нажмите "Проверить".'
                });

                logger.info('TELEGRAM', 'Пользователь авторизован', {
                    chat_id: chatId,
                    telegram_id: user.id,
                    auth_token: authToken.substring(0, 20) + '...'
                });
            } else {
                await telegramRequest('sendMessage', {
                    chat_id: chatId,
                    text: '❌ Сессия не найдена или истекла. Попробуйте войти на сайте заново.'
                });
            }
        } else {
            await telegramRequest('sendMessage', {
                chat_id: chatId,
                text: '👋 Привет! Для авторизации нажмите кнопку "Войти через Telegram" на сайте Trend.'
            });
        }
    } else if (text === '/start') {
        // Создаем или обновляем пользователя
        const userId = 'user_' + user.id;
        
        if (usePostgreSQL) {
            const existingUser = await dbModule.getUser(userId);
            if (!existingUser) {
                await dbModule.createUser({
                    id: userId,
                    telegramId: user.id,
                    username: user.username,
                    firstName: user.first_name,
                    lastName: user.last_name,
                    createdAt: new Date().toISOString()
                });
                logger.info('TELEGRAM', 'Новый пользователь зарегистрирован', {
                    chat_id: chatId,
                    telegram_id: user.id,
                    username: user.username
                });
            }
        } else {
            const existingUser = db.users.get(userId);

            if (!existingUser) {
                // Новый пользователь - регистрируем
                db.users.set(userId, {
                    id: userId,
                    telegramId: user.id,
                    username: user.username,
                    firstName: user.first_name,
                    lastName: user.last_name,
                    createdAt: new Date().toISOString()
                });

                saveData(); // Сохраняем в файл

                logger.info('TELEGRAM', 'Новый пользователь зарегистрирован', {
                    chat_id: chatId,
                    telegram_id: user.id,
                    username: user.username
                });
            }
        }
        
        await telegramRequest('sendMessage', {
            chat_id: chatId,
            text: '👋 Привет! Для авторизации нажмите кнопку "Войти через Telegram" на сайте Trend.'
        });
    }
}

/**
 * Запускает polling Telegram бота
 */
async function startTelegramPolling() {
    logger.info('TELEGRAM', 'Запуск polling бота...');
    
    while (true) {
        try {
            const response = await telegramRequest('getUpdates', {
                offset: lastUpdateId + 1,
                timeout: 30
            });
            
            if (response.ok && response.result) {
                for (const update of response.result) {
                    await handleTelegramUpdate(update);
                    lastUpdateId = update.update_id;
                }
            }
        } catch (error) {
            logger.error('TELEGRAM', 'Ошибка polling', { error: error.message });
            await new Promise(r => setTimeout(r, 5000)); // Ждём 5 секунд при ошибке
        }
    }
}

// ============================================
// AUTH SERVICE
// ============================================

/**
 * Создает новую сессию авторизации
 */
function createAuthSession(userId, token) {
    const request_id = generateRequestId();
    
    // Удаляем старые сессии для этого пользователя
    for (const [key, session] of db.sessions) {
        if (session.userId === userId) {
            db.sessions.delete(key);
        }
    }
    
    // Создаем новую сессию
    db.sessions.set(token, {
        userId,
        token,
        authorized: false,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString()
    });
    
    logger.info('AUTH', 'Сессия создана', {
        request_id,
        userId,
        token: token.substring(0, 20) + '...'
    });
    
    return { token };
}

/**
 * Проверяет статус авторизации по токену
 */
async function checkAuthStatus(token) {
    const request_id = generateRequestId();
    const session = usePostgreSQL ? await dbModule.getSession(token) : db.sessions.get(token);

    if (session && session.authorized === true) {
        const user = usePostgreSQL ? await dbModule.getUser(session.userId) : db.users.get(session.userId);

        logger.info('API', 'Auth check success', {
            request_id,
            user_id: user?.telegramId || session.userId
        });

        return {
            success: true,
            authorized: true,
            user_id: user?.telegramId || session.userId,
            telegram_id: user?.telegramId,
            username: user?.username,
            first_name: user?.firstName,
            last_name: user?.lastName
        };
    } else {
        logger.info('API', 'Auth check: not authorized', { request_id });
        return { success: true, authorized: false };
    }
}

/**
 * Верифицирует авторизацию от бота
 */
function verifyAuth(telegramId, authToken, username, firstName, lastName) {
    const request_id = generateRequestId();
    
    try {
        // Создаем или обновляем пользователя
        const userId = 'user_' + telegramId;
        
        db.users.set(userId, {
            id: userId,
            telegramId,
            username,
            firstName,
            lastName,
            createdAt: new Date().toISOString()
        });

        saveData(); // Сохраняем в файл

        // Обновляем сессию
        const session = db.sessions.get(authToken);
        if (session) {
            session.authorized = true;
            session.userId = userId;
            session.telegramId = telegramId; // Добавляем telegramId для проверки админа
            db.sessions.set(authToken, session);
        }

        logger.info('API', 'Авторизация подтверждена', {
            request_id,
            telegramId,
            username
        });

        return {
            success: true,
            message: 'Авторизация успешна',
            user_id: telegramId,
            username: username,
            first_name: firstName
        };
    } catch (error) {
        logger.error('API', 'Ошибка при обработке авторизации', {
            request_id,
            error: error.message,
            stack: error.stack
        });
        throw error;
    }
}

/**
 * Создает сессию для токена (начало авторизации)
 */
function createSessionForToken(authToken) {
    const request_id = generateRequestId();
    
    if (!db.sessions.has(authToken)) {
        db.sessions.set(authToken, {
            token: authToken,
            authorized: false,
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString()
        });
        
        logger.info('AUTH', 'Сессия создана для токена', {
            request_id,
            token: authToken.substring(0, 20) + '...'
        });
    }
    
    return true;
}

// ============================================
// HTTP SERVER
// ============================================

const server = http.createServer(async (req, res) => {
    const request_id = generateRequestId();
    const startTime = Date.now();
    
    // CORS заголовки
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    logger.debug('SERVER', 'Получен запрос', {
        request_id,
        method: req.method,
        url: req.url
    });

    // Статические файлы
    if (req.method === 'GET' && !req.url.startsWith('/api/')) {
        let filePath = req.url === '/' ? '/index.html' : req.url;
        const fullPath = path.join(STATIC_DIR, filePath);
        
        logger.info('SERVER', 'Попытка отдать файл', {
            request_id,
            url: req.url,
            filePath,
            fullPath,
            staticDir: STATIC_DIR,
            exists: fs.existsSync(fullPath),
            isFile: fs.existsSync(fullPath) ? fs.statSync(fullPath).isFile() : false
        });
        
        // Проверяем существование файла
        if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
            const ext = path.extname(fullPath);
            const contentTypes = {
                '.html': 'text/html',
                '.css': 'text/css',
                '.js': 'application/javascript',
                '.png': 'image/png',
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.svg': 'image/svg+xml'
            };
            
            const contentType = contentTypes[ext] || 'application/octet-stream';
            const content = fs.readFileSync(fullPath);
            
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content);
            
            logger.debug('SERVER', 'Файл отдан', {
                request_id,
                file: filePath,
                size: content.length
            });
            return;
        }
        
        // 404 для статики
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
        return;
    }

    // ============================================
    // API ROUTES
    // ============================================

    // Проверка авторизации
    if (req.method === 'GET' && req.url.startsWith('/api/auth/check/')) {
        const token = req.url.split('/api/auth/check/')[1];

        try {
            const result = await checkAuthStatus(token);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(result));
        } catch (error) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: 'Ошибка сервера' }));
        }
        return;
    }

    // Создание сессии (начало авторизации)
    if (req.method === 'POST' && req.url === '/api/auth/start') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', async () => {
            try {
                const data = JSON.parse(body);
                const { token } = data;
                
                if (!token || !token.startsWith('auth_')) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, error: 'Неверный токен' }));
                    return;
                }
                
                createSessionForToken(token);
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true }));
            } catch (error) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: 'Ошибка сервера' }));
            }
        });
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
                    const result = verifyAuth(user_id, auth_token, username, first_name, last_name);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(result));
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

    // Сохранение результатов теста
    if (req.method === 'POST' && req.url === '/api/tests/save') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                const { userId, testId, answers, progress } = data;

                // Создаем пользователя если его нет (для совместимости со старыми данными)
                const dbUserId = 'user_' + userId;
                if (!db.users.has(dbUserId)) {
                    db.users.set(dbUserId, {
                        id: dbUserId,
                        telegramId: userId,
                        username: null,
                        firstName: null,
                        lastName: null,
                        createdAt: new Date().toISOString()
                    });
                    logger.info('API', 'Создан пользователь при сохранении теста', { request_id, userId });
                }

                const resultKey = `${userId}_${testId}`;
                db.testResults.set(resultKey, {
                    userId,
                    testId,
                    answers,
                    progress,
                    completedAt: new Date().toISOString()
                });
                
                saveData(); // Сохраняем в файл
                
                logger.info('API', 'Результаты теста сохранены', {
                    request_id,
                    userId,
                    testId,
                    progress
                });

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true }));
            } catch (error) {
                logger.error('API', 'Ошибка сохранения результатов', {
                    request_id,
                    error: error.message
                });
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: 'Ошибка сервера' }));
            }
        });
        return;
    }

    // Chat - получение сообщений пользователя
    if (req.method === 'GET' && req.url.startsWith('/api/chat/messages')) {
        const url = new URL(req.url, `http://localhost:${PORT}`);
        const userId = url.searchParams.get('userId');
        
        if (!userId) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'userId required' }));
            return;
        }
        
        // Получаем все сообщения для пользователя
        const messages = [];
        db.chatMessages.forEach((msg, key) => {
            if (msg.userId === userId) {
                messages.push(msg);
            }
        });
        
        // Сортируем по времени
        messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        
        // Mark received messages as read
        let hasUnread = false;
        const updatedMessages = messages.map(msg => {
            if (msg.type === 'sent' && !msg.read) {
                hasUnread = true;
                return { ...msg, read: true };
            }
            return msg;
        });
        
        // Update in database if there were unread messages
        if (hasUnread) {
            const key = `chat_${userId}`;
            if (db.chatMessages.has(key)) {
                db.chatMessages.set(key, updatedMessages);
                saveData();
            }
        }
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(messages));
        return;
    }

    // Chat - отправка сообщения
    if (req.method === 'POST' && req.url === '/api/chat/send') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                const { userId, text, type } = data;
                
                if (!userId || !text) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'userId and text required' }));
                    return;
                }
                
                // Создаем сообщение
                const message = {
                    id: Date.now(),
                    userId,
                    text,
                    type: type || 'sent',
                    timestamp: new Date().toISOString()
                };
                
                // Сохраняем сообщение
                db.chatMessages.set(message.id.toString(), message);
                saveData();
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true }));
            } catch (error) {
                logger.error('API', 'Ошибка отправки сообщения', {
                    request_id,
                    error: error.message
                });
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: 'Ошибка сервера' }));
            }
        });
        return;
    }

    // Отправка напоминания пользователю (кнопки Чат и Тест в админке)
    if (req.method === 'POST' && req.url === '/api/admin/send-reminder') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', async () => {
            try {
                const data = JSON.parse(body);
                const { telegramId, type } = data;
                
                if (!telegramId || !type) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'telegramId and type required' }));
                    return;
                }
                
                // Определяем текст сообщения в зависимости от типа
                let messageText = '';
                if (type === 'chat') {
                    messageText = 'Вам пришло сообщение на сайт, мы очень ждем вашего ответа';
                } else if (type === 'test') {
                    messageText = 'Администратор напоминает вам про прохождение теста, заполните его как можно быстрее';
                }
                
                // Отправляем сообщение в Telegram
                await telegramRequest('sendMessage', {
                    chat_id: telegramId,
                    text: messageText
                });
                
                logger.info('API', 'Напоминание отправлено', {
                    request_id,
                    telegramId,
                    type
                });
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true }));
            } catch (error) {
                logger.error('API', 'Ошибка отправки напоминания', {
                    request_id,
                    error: error.message
                });
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: 'Ошибка сервера' }));
            }
        });
        return;
    }

    // Получение всех пользователей и их результатов (для админа)
    if (req.method === 'GET' && req.url === '/api/admin/users') {
        const users = [];

        // Получаем пользователей из PostgreSQL или JSON
        const allUsers = usePostgreSQL ? await dbModule.getAllUsers() : Array.from(db.users._map.values());

        // Debug: логируем содержимое базы данных
        logger.info('DEBUG', 'Админ API - данные в БД', {
            usersCount: allUsers.length,
            isPostgreSQL: usePostgreSQL
        });

        for (const user of allUsers) {
            const userResults = [];
            
            // Получаем результаты тестов
            const testResults = usePostgreSQL ? await dbModule.getTestResults(user.telegramId) : Array.from(db.testResults._map.values()).filter(r => String(r.userId) === String(user.telegramId));
            
            testResults.forEach(result => {
                userResults.push({
                    testId: result.testId,
                    progress: result.progress,
                    answers: result.answers,
                    completedAt: result.completedAt
                });
            });

            // Count unanswered messages for this user
            let lastReceivedTimestamp = 0;
            const userMessages = usePostgreSQL ? await dbModule.getChatMessages(user.telegramId) : Array.from(db.chatMessages._map.values()).filter(msg => String(msg.userId) === String(user.telegramId));
            
            // Track the latest admin reply timestamp
            userMessages.forEach(msg => {
                if (msg.type === 'received') {
                    const msgTime = new Date(msg.timestamp).getTime();
                    if (msgTime > lastReceivedTimestamp) {
                        lastReceivedTimestamp = msgTime;
                    }
                }
            });

            // Count messages sent after the last admin reply
            let unreadCount = 0;
            userMessages.forEach(msg => {
                if (msg.type === 'sent') {
                    const msgTime = new Date(msg.timestamp).getTime();
                    if (msgTime > lastReceivedTimestamp) {
                        unreadCount++;
                    }
                }
            });

            users.push({
                id: user.id,
                telegramId: user.telegramId,
                username: user.username,
                firstName: user.firstName,
                lastName: user.lastName,
                createdAt: user.createdAt,
                results: userResults,
                unreadCount: unreadCount
            });
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(users));
        return;
    }

    // 404 для API
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: 'Not Found' }));
});

// ============================================
// START SERVER
// ============================================

async function startServer() {
    // Логирование переменных окружения
    console.log('=== ENV CHECK ===');
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'установлен (' + process.env.DATABASE_URL.substring(0, 30) + '...)' : 'НЕ УСТАНОВЛЕН');
    console.log('TELEGRAM_BOT_TOKEN:', TELEGRAM_BOT_TOKEN ? 'установлен (' + TELEGRAM_BOT_TOKEN.substring(0, 20) + '...)' : 'НЕ УСТАНОВЛЕН');
    console.log('ADMIN_USER_ID:', ADMIN_USER_ID);
    console.log('=================');

    // Инициализация базы данных
    const dbPool = await dbModule.init();
    usePostgreSQL = !!dbPool;

    console.log('[START] usePostgreSQL:', usePostgreSQL);

    // Загружаем данные при старте
    if (!dbPool) {
        // JSON режим
        loadData();
    } else {
        // PostgreSQL режим - проверяем есть ли данные
        const users = await dbModule.getAllUsers();
        if (users.length === 0) {
            // Миграция из JSON если база пустая
            if (fs.existsSync(DATA_FILE)) {
                const jsonData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
                await dbModule.migrateFromJSON(jsonData);
            }
        }
        // Загружаем данные в Map для обратной совместимости
        loadDataIntoMaps();
    }

    server.listen(PORT, () => {
        logger.info('SERVER', `Сервер запущен на порту ${PORT}`, {
            port: PORT,
            static_dir: STATIC_DIR,
            url: `http://localhost:${PORT}`,
            database: dbPool ? 'PostgreSQL' : 'JSON'
        });

        // Запускаем Telegram polling в фоне
        startTelegramPolling().catch(err => {
            logger.error('TELEGRAM', 'Ошибка запуска polling', { error: err.message });
        });
    });
}

startServer();
