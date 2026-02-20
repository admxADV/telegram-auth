/**
 * Скрипт для загрузки вопросов тестов в базу данных PostgreSQL
 * Запустить: node init_quiz.js
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Инициализация PostgreSQL
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Маппинг файлов к отделам
const files = {
    'general': 'Должности/Для всех остальных.txt',
    'sales': 'Должности/менеджерам по продажам.txt',
    'hr': 'Должности/Менеджеры по подбору персонала.txt',
    'training': 'Должности/Обучение персонала.txt',
    'marketing': 'Должности/Отдел маркетинга.txt',
    'legal': 'Должности/Юридический отдел.txt'
};

function parseQuestions(text, department) {
    const questions = [];
    const lines = text.split('\n');

    let currentSection = '';
    let questionNumber = 0;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // Пропускаем пустые строки и заголовки секций
        if (!line || line.startsWith('')) continue;

        // Это заголовок раздела (например "1. Мой поток задач")
        if (/^\d+\.\s+[А-Яа-я]/.test(line)) {
            currentSection = line;
            continue;
        }

        // Это вопрос (например "5. Кто/что запускает мою работу?" или "    5. Кто...")
        // Также обрабатываем вопросы с отступами
        const questionMatch = line.match(/^(\d+)\.\s+(.+)$/);
        if (questionMatch) {
            questionNumber = parseInt(questionMatch[1]);
            let questionText = questionMatch[2].trim();

            // Собираем варианты ответов
            const options = [];
            let j = i + 1;
            while (j < lines.length) {
                const nextLine = lines[j].trim();
                if (!nextLine) { j++; continue; }

                // Если это следующий вопрос или раздел - stop
                if (/^\d+\.\s+/.test(nextLine)) {
                    break;
                }

                // Если это вариант ответа (начинается с ◦ или - или ( ))
                if (nextLine.startsWith('◦') || nextLine.startsWith('- ')) {
                    let optionText = nextLine.replace(/^[◦\- ]+/, '').trim();
                    if (optionText) options.push(optionText);
                } else if (nextLine.startsWith('( )') || nextLine.startsWith('(x)')) {
                    let optionText = nextLine.replace(/^[\(\)x ]+/, '').trim();
                    if (optionText) options.push(optionText);
                }
                j++;
            }

            questions.push({
                department: department,
                question_number: questionNumber,
                question_text: questionText + (currentSection ? ` (${currentSection})` : ''),
                question_type: options.length > 0 ? 'choice' : 'text',
                options: options.length > 0 ? JSON.stringify(options) : null
            });
        }
    }

    return questions;
}

async function loadQuestions() {
    console.log('Начинаем загрузку вопросов...');

    let totalQuestions = 0;

    // Очищаем старые вопросы
    try {
        await pool.query('DELETE FROM quiz_questions');
        console.log('Старые вопросы удалены');
    } catch (err) {
        console.error('Ошибка очистки вопросов:', err.message);
    }

    for (const [dept, filepath] of Object.entries(files)) {
        const fullPath = path.join(__dirname, filepath);

        if (!fs.existsSync(fullPath)) {
            console.log(`Файл не найден: ${filepath}`);
            continue;
        }

        try {
            let content = fs.readFileSync(fullPath, 'utf8');
            // Удаляем BOM маркер
            content = content.replace(/^\uFEFF/, '');

            const questions = parseQuestions(content, dept);

            console.log(`Загружаем ${questions.length} вопросов для отдела: ${dept}`);

            for (const q of questions) {
                await pool.query(`
                    INSERT INTO quiz_questions (department, question_number, question_text, question_type, options)
                    VALUES ($1, $2, $3, $4, $5)
                `, [q.department, q.question_number, q.question_text, q.question_type, q.options]);
            }

            totalQuestions += questions.length;
            console.log(`Загружено для ${dept}: ${questions.length} вопросов`);

        } catch (err) {
            console.error(`Ошибка чтения файла ${filepath}:`, err.message);
        }
    }

    // Получаем итоговое количество
    const result = await pool.query('SELECT COUNT(*) as count FROM quiz_questions');
    console.log(`\n✅ Всего вопросов в базе: ${result.rows[0].count}`);
    
    await pool.end();
    process.exit(0);
}

// Запуск
console.log('🔍 [DB] Проверка подключения к PostgreSQL...');
console.log('🔍 [DB] DATABASE_URL:', process.env.DATABASE_URL ? 'задан' : 'НЕ задан');

loadQuestions().catch(err => {
    console.error('Ошибка при загрузке вопросов:', err.message);
    process.exit(1);
});
