/**
 * Скрипт для загрузки вопросов тестов в базу данных
 * Запустить: node init_quiz.js
 */

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// Получаем правильный путь к директории скрипта
const scriptDir = process.cwd();
console.log('Script directory:', scriptDir);

const dbPath = path.join(scriptDir, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

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
        if (!line || line.startsWith('﻿')) continue;
        
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

function loadQuestions() {
    console.log('Начинаем загрузку вопросов...');
    
    let processed = 0;
    let totalQuestions = 0;
    
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
                db.run(`
                    INSERT INTO quiz_questions (department, question_number, question_text, question_type, options)
                    VALUES (?, ?, ?, ?, ?)
                `, [q.department, q.question_number, q.question_text, q.question_type, q.options], (err) => {
                    if (err) {
                        console.error('Ошибка вставки:', err.message);
                    }
                });
            }
            
            processed++;
            totalQuestions += questions.length;
            console.log(`Загружено для ${dept}: ${questions.length} вопросов`);
            
        } catch (err) {
            console.error(`Ошибка чтения файла ${filepath}:`, err.message);
        }
    }
    
    // Даем время на завершение всех вставок
    setTimeout(() => {
        db.get("SELECT COUNT(*) as count FROM quiz_questions", [], (err, row) => {
            console.log(`\nВсего вопросов в базе: ${row.count}`);
            db.close();
            process.exit(0);
        });
    }, 3000);
}

db.serialize(() => {
    // Очищаем старые вопросы
    db.run("DELETE FROM quiz_questions", () => {
        console.log('Старые вопросы удалены');
        loadQuestions();
    });
});
