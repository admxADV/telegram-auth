/**
 * PostgreSQL Database Module
 * Автоматическое создание таблиц и миграция данных
 */

const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL;

let pool = null;

// Инициализация подключения
async function init() {
    if (!DATABASE_URL) {
        console.log('[DB] DATABASE_URL не установлен, используется JSON-файл');
        return null;
    }

    try {
        pool = new Pool({
            connectionString: DATABASE_URL,
            ssl: {
                rejectUnauthorized: false
            }
        });

        // Проверка подключения
        const client = await pool.connect();
        await client.query('SELECT NOW()');
        client.release();

        console.log('[DB] Подключение к PostgreSQL установлено');

        // Создание таблиц
        await createTables();

        return pool;
    } catch (error) {
        console.error('[DB] Ошибка подключения к PostgreSQL:', error.message);
        return null;
    }
}

// Создание таблиц
async function createTables() {
    const queries = [
        `CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            "telegramId" TEXT UNIQUE,
            username TEXT,
            firstName TEXT,
            lastName TEXT,
            "createdAt" TIMESTAMP DEFAULT NOW()
        )`,
        `CREATE TABLE IF NOT EXISTS sessions (
            token TEXT PRIMARY KEY,
            "telegramId" TEXT,
            authorized BOOLEAN DEFAULT false,
            "createdAt" TIMESTAMP DEFAULT NOW(),
            "expiresAt" TIMESTAMP
        )`,
        `CREATE TABLE IF NOT EXISTS "testResults" (
            id SERIAL PRIMARY KEY,
            "userId" TEXT,
            "testId" INTEGER,
            answers JSONB,
            progress INTEGER DEFAULT 0,
            "completedAt" TIMESTAMP
        )`,
        `CREATE TABLE IF NOT EXISTS "chatMessages" (
            id BIGSERIAL PRIMARY KEY,
            "userId" TEXT,
            text TEXT,
            type TEXT,
            "timestamp" TIMESTAMP DEFAULT NOW()
        )`,
        `CREATE INDEX IF NOT EXISTS idx_testResults_userId ON "testResults" ("userId")`,
        `CREATE INDEX IF NOT EXISTS idx_chatMessages_userId ON "chatMessages" ("userId")`
    ];

    for (const query of queries) {
        await pool.query(query);
    }

    console.log('[DB] Таблицы созданы');
}

// Операции с пользователями
async function getUser(id) {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0];
}

async function createUser(user) {
    await pool.query(
        `INSERT INTO users (id, "telegramId", username, firstName, lastName, "createdAt")
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO NOTHING`,
        [user.id, user.telegramId, user.username, user.firstName, user.lastName, user.createdAt]
    );
}

async function getAllUsers() {
    const result = await pool.query('SELECT * FROM users ORDER BY "createdAt" DESC');
    return result.rows;
}

// Операции с сессиями
async function createSession(session) {
    await pool.query(
        `INSERT INTO sessions (token, "telegramId", authorized, "createdAt", "expiresAt")
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (token) DO UPDATE SET authorized = $3`,
        [session.token, session.telegramId, session.authorized, session.createdAt, session.expiresAt]
    );
}

async function getSession(token) {
    const result = await pool.query('SELECT * FROM sessions WHERE token = $1', [token]);
    return result.rows[0];
}

async function updateSession(token, updates) {
    const fields = [];
    const values = [];
    let i = 1;

    for (const [key, value] of Object.entries(updates)) {
        fields.push(`${key} = $${i++}`);
        values.push(value);
    }

    values.push(token);
    await pool.query(
        `UPDATE sessions SET ${fields.join(', ')} WHERE token = $${i}`,
        values
    );
}

// Операции с результатами тестов
async function saveTestResult(result) {
    const key = `${result.userId}_${result.testId}`;
    await pool.query(
        `INSERT INTO "testResults" ("userId", "testId", answers, progress, "completedAt")
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id) DO UPDATE SET answers = $3, progress = $4, "completedAt" = $5`,
        [result.userId, result.testId, JSON.stringify(result.answers), result.progress, result.completedAt]
    );
}

async function getTestResults(userId) {
    const result = await pool.query(
        'SELECT * FROM "testResults" WHERE "userId" = $1 ORDER BY "testId"',
        [userId]
    );
    return result.rows;
}

// Операции с сообщениями чата
async function addChatMessage(message) {
    await pool.query(
        `INSERT INTO "chatMessages" ("userId", text, type, "timestamp")
         VALUES ($1, $2, $3, $4)`,
        [message.userId, message.text, message.type, message.timestamp]
    );
}

async function getChatMessages(userId) {
    const result = await pool.query(
        'SELECT * FROM "chatMessages" WHERE "userId" = $1 ORDER BY "timestamp"',
        [userId]
    );
    return result.rows;
}

// Миграция данных из JSON
async function migrateFromJSON(jsonData) {
    console.log('[DB] Начало миграции данных из JSON...');

    // Миграция пользователей
    for (const [id, user] of Object.entries(jsonData.users || {})) {
        await createUser(user);
    }

    // Миграция сессий
    for (const [token, session] of Object.entries(jsonData.sessions || {})) {
        await pool.query(
            `INSERT INTO sessions (token, "telegramId", authorized, "createdAt", "expiresAt")
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (token) DO NOTHING`,
            [token, session.telegramId, session.authorized, session.createdAt, session.expiresAt]
        );
    }

    // Миграция результатов тестов
    for (const [key, result] of Object.entries(jsonData.testResults || {})) {
        await pool.query(
            `INSERT INTO "testResults" ("userId", "testId", answers, progress, "completedAt")
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (id) DO UPDATE SET answers = $3, progress = $4, "completedAt" = $5`,
            [result.userId, result.testId, JSON.stringify(result.answers), result.progress, result.completedAt]
        );
    }

    // Миграция сообщений
    for (const [id, message] of Object.entries(jsonData.chatMessages || {})) {
        await pool.query(
            `INSERT INTO "chatMessages" (id, "userId", text, type, "timestamp")
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (id) DO NOTHING`,
            [id, message.userId, message.text, message.type, message.timestamp]
        );
    }

    console.log('[DB] Миграция данных завершена');
}

// Закрытие подключения
async function close() {
    if (pool) {
        await pool.end();
        console.log('[DB] Подключение закрыто');
    }
}

module.exports = {
    init,
    createTables,
    getUser,
    createUser,
    getAllUsers,
    createSession,
    getSession,
    updateSession,
    saveTestResult,
    getTestResults,
    addChatMessage,
    getChatMessages,
    migrateFromJSON,
    close,
    getPool: () => pool
};
