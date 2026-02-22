/**
 * Trend Platform - Dashboard
 * Личный кабинет с тестами
 */

// Demo data for tests
const TESTS = [
    {
        id: 1,
        title: 'Отдел и Должность',
        description: 'Определение отдела и должности',
        progress: 0,
        questions: [
            {
                id: 'dept',
                text: 'Выберите отдел',
                type: 'select',
                options: [
                    { value: 'sales', label: 'Отдел продаж' },
                    { value: 'recruitment', label: 'Подбор персонала' },
                    { value: 'training', label: 'Обучение персонала' },
                    { value: 'marketing', label: 'Маркетинг' },
                    { value: 'legal', label: 'Юридический отдел' },
                    { value: 'other', label: 'Другое' }
                ]
            },
            {
                id: 'position',
                text: 'Какая у вас должность?',
                type: 'text',
                placeholder: 'Напишите вашу должность'
            },
            {
                id: 'tasks',
                text: 'Откуда берутся ваши задачи?',
                type: 'select',
                options: [
                    { value: 'crm', label: 'Задачи в CRM' },
                    { value: 'meeting', label: 'Планерки / устные указания' },
                    { value: 'self', label: 'Сам планирую' },
                    { value: 'clients', label: 'От клиентов' },
                    { value: 'other', label: 'Другое' }
                ]
            },
            {
                id: 'systems',
                text: 'Какими системами пользуетесь ежедневно?',
                type: 'multiselect',
                options: [
                    { value: 'crm', label: 'CRM система' },
                    { value: 'excel', label: 'Excel / Google Таблицы' },
                    { value: 'messaging', label: 'Telegram / WhatsApp' },
                    { value: 'realty', label: 'Авито / Циан / Домклик' },
                    { value: '1c', label: '1С / финансы' }
                ]
            },
            {
                id: 'pain',
                text: 'Что больше всего тормозит вашу работу?',
                type: 'textarea',
                placeholder: 'Опишите проблему'
            }
        ]
    },
    {
        id: 2,
        title: 'Общие вопросы',
        description: 'Базовые вопросы о вашей работе',
        progress: 0,
        questions: [
            {
                id: 'experience',
                text: 'Сколько лет вы работаете в компании?',
                type: 'select',
                options: [
                    { value: 'less1', label: 'Менее 1 года' },
                    { value: '1_3', label: '1-3 года' },
                    { value: '3_5', label: '3-5 лет' },
                    { value: 'more5', label: 'Более 5 лет' }
                ]
            },
            {
                id: 'goals',
                text: 'Какие у вас основные KPI?',
                type: 'textarea',
                placeholder: 'Перечислите ваши KPI'
            },
            {
                id: 'achievements',
                text: 'Какой ваш главный профессиональный успех?',
                type: 'textarea',
                placeholder: 'Опишите ваш успех'
            },
            {
                id: 'improvements',
                text: 'Что бы вы изменили в своей работе?',
                type: 'textarea',
                placeholder: 'Ваши предложения'
            }
        ]
    },
    {
        id: 3,
        title: 'Тест знаний',
        description: '20 вопросов с выбором ответа',
        progress: 0,
        questions: [
            {
                id: 'q1',
                text: '1. Что такое KPI?',
                type: 'radio',
                options: [
                    { value: 'a', label: 'Ключевой показатель эффективности' },
                    { value: 'b', label: 'Компьютерная программа' },
                    { value: 'c', label: 'Кадровый процесс' },
                    { value: 'd', label: 'Корпоративная культура' }
                ],
                correct: 'a'
            },
            {
                id: 'q2',
                text: '2. Какая CRM используется в компании?',
                type: 'radio',
                options: [
                    { value: 'a', label: 'amoCRM' },
                    { value: 'b', label: 'Битрикс24' },
                    { value: 'c', label: 'Salesforce' },
                    { value: 'd', label: 'Не знаю' }
                ],
                correct: 'b'
            },
            {
                id: 'q3',
                text: '3. Какой документ подтверждает сделку?',
                type: 'radio',
                options: [
                    { value: 'a', label: 'Договор' },
                    { value: 'b', label: 'Скриншот' },
                    { value: 'c', label: 'Сообщение в WhatsApp' },
                    { value: 'd', label: 'Звонок' }
                ],
                correct: 'a'
            },
            {
                id: 'q4',
                text: '4. Что такое холодный звонок?',
                type: 'radio',
                options: [
                    { value: 'a', label: 'Звонок без предварительной договорённости' },
                    { value: 'b', label: 'Звонок зимой' },
                    { value: 'c', label: 'Звонок клиенту' },
                    { value: 'd', label: 'Звонок руководителю' }
                ],
                correct: 'a'
            },
            {
                id: 'q5',
                text: '5. Что такое конверсия?',
                type: 'radio',
                options: [
                    { value: 'a', label: 'Процент успешных действий' },
                    { value: 'b', label: 'Количество клиентов' },
                    { value: 'c', label: 'Сумма сделки' },
                    { value: 'd', label: 'Время разговора' }
                ],
                correct: 'a'
            },
            {
                id: 'q6',
                text: '6. Какой канал коммуникации предпочтительнее?',
                type: 'radio',
                options: [
                    { value: 'a', label: 'Telegram' },
                    { value: 'b', label: 'Телефонный звонок' },
                    { value: 'c', label: 'Email' },
                    { value: 'd', label: 'Личная встреча' }
                ],
                correct: 'b'
            },
            {
                id: 'q7',
                text: '7. Что такое возражение клиента?',
                type: 'radio',
                options: [
                    { value: 'a', label: 'Отказ от покупки' },
                    { value: 'b', label: 'Вопрос или сомнение' },
                    { value: 'c', label: 'Жалоба' },
                    { value: 'd', label: 'Просьба о скидке' }
                ],
                correct: 'b'
            },
            {
                id: 'q8',
                text: '8. Какой этап воронки продаж первый?',
                type: 'radio',
                options: [
                    { value: 'a', label: 'Сделка' },
                    { value: 'b', label: 'Первичный контакт' },
                    { value: 'c', label: 'Презентация' },
                    { value: 'd', label: 'Квалификация' }
                ],
                correct: 'b'
            },
            {
                id: 'q9',
                text: '9. Что такое метрика "средний чек"?',
                type: 'radio',
                options: [
                    { value: 'a', label: 'Средняя сумма одной сделки' },
                    { value: 'b', label: 'Количество сделок' },
                    { value: 'c', label: 'Время сделки' },
                    { value: 'd', label: 'Число клиентов' }
                ],
                correct: 'a'
            },
            {
                id: 'q10',
                text: '10. Что такое апселл?',
                type: 'radio',
                options: [
                    { value: 'a', label: 'Увеличение суммы сделки' },
                    { value: 'b', label: 'Поиск нового клиента' },
                    { value: 'c', label: 'Возврат клиента' },
                    { value: 'd', label: 'Скидка клиенту' }
                ],
                correct: 'a'
            },
            {
                id: 'q11',
                text: '11. Какой документ нужен для проверки объекта?',
                type: 'radio',
                options: [
                    { value: 'a', label: 'Паспорт' },
                    { value: 'b', label: 'Выписка из ЕГРН' },
                    { value: 'c', label: 'Справка о доходах' },
                    { value: 'd', label: 'Трудовой договор' }
                ],
                correct: 'b'
            },
            {
                id: 'q12',
                text: '12. Что такое скрипт продаж?',
                type: 'radio',
                options: [
                    { value: 'a', label: 'Текст разговора' },
                    { value: 'b', label: 'Программа для звонков' },
                    { value: 'c', label: 'Таблица с данными' },
                    { value: 'd', label: 'Договор' }
                ],
                correct: 'a'
            },
            {
                id: 'q13',
                text: '13. Какой срок годности лида?',
                type: 'radio',
                options: [
                    { value: 'a', label: 'Бессрочно' },
                    { value: 'b', label: '24-72 часа' },
                    { value: 'c', label: '1 неделя' },
                    { value: 'd', label: '1 месяц' }
                ],
                correct: 'b'
            },
            {
                id: 'q14',
                text: '14. Что такое "теплый" лид?',
                type: 'radio',
                options: [
                    { value: 'a', label: 'Лид, который уже интересовался' },
                    { value: 'b', label: 'Лид с горячим предложением' },
                    { value: 'c', label: 'Лид из холодных звонков' },
                    { value: 'd', label: 'Лид без интереса' }
                ],
                correct: 'a'
            },
            {
                id: 'q15',
                text: '15. Какой показатель показывает успешность отдела?',
                type: 'radio',
                options: [
                    { value: 'a', label: 'Конверсия' },
                    { value: 'b', label: 'Количество звонков' },
                    { value: 'c', label: 'Время работы' },
                    { value: 'd', label: 'Количество писем' }
                ],
                correct: 'a'
            },
            {
                id: 'q16',
                text: '16. Что делать при отказе клиента?',
                type: 'radio',
                options: [
                    { value: 'a', label: 'Спросить причину и предложить альтернативу' },
                    { value: 'b', label: 'Сразу завершить разговор' },
                    { value: 'c', label: 'Начать уговаривать' },
                    { value: 'd', label: 'Переключить на другого менеджера' }
                ],
                correct: 'a'
            },
            {
                id: 'q17',
                text: '17. Что такое CJM (карта пути клиента)?',
                type: 'radio',
                options: [
                    { value: 'a', label: 'Маршрут клиента' },
                    { value: 'b', label: 'Список клиентов' },
                    { value: 'c', label: 'График встреч' },
                    { value: 'd', label: 'База данных' }
                ],
                correct: 'a'
            },
            {
                id: 'q18',
                text: '18. Какой этап следует после квалификации?',
                type: 'radio',
                options: [
                    { value: 'a', label: 'Презентация' },
                    { value: 'b', label: 'Закрытие сделки' },
                    { value: 'c', label: 'Работа с возражениями' },
                    { value: 'd', label: 'Поиск клиента' }
                ],
                correct: 'a'
            },
            {
                id: 'q19',
                text: '19. Что такое чек-лист?',
                type: 'radio',
                options: [
                    { value: 'a', label: 'Список проверки' },
                    { value: 'b', label: 'Список покупок' },
                    { value: 'c', label: 'Договор' },
                    { value: 'd', label: 'Отчёт' }
                ],
                correct: 'a'
            },
            {
                id: 'q20',
                text: '20. Какой самый важный навык продавца?',
                type: 'radio',
                options: [
                    { value: 'a', label: 'Коммуникабельность' },
                    { value: 'b', label: 'Знание продукта' },
                    { value: 'c', label: 'Работа с возражениями' },
                    { value: 'd', label: 'Все вышеперечисленные' }
                ],
                correct: 'd'
            }
        ]
    }
];

// State
let currentUser = null;
let currentTest = null;
let testResults = {};
let userAnswers = {};

/**
 * Logout - выход из системы
 */
function logout() {
    if (confirm('Вы уверены, что хотите выйти?')) {
        sessionStorage.clear();
        window.location.href = '/index.html';
    }
}

/**
 * Save test results to server
 */
async function saveToServer(testId, answers, progress) {
    const userId = sessionStorage.getItem('user_id');
    if (!userId) return;
    
    try {
        await fetch('/api/tests/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId,
                testId,
                answers,
                progress
            })
        });
    } catch (error) {
        console.error('Error saving to server:', error);
    }
}

/**
 * Initialize dashboard
 */
async function initDashboard() {
    // Check auth
    const authToken = sessionStorage.getItem('auth_session');
    const userId = sessionStorage.getItem('user_id');
    
    if (!authToken) {
        window.location.href = '/index.html';
        return;
    }

    // Show admin link only for allowed users
    const adminIds = ['5093303797', '7579436'];
    if (userId && adminIds.includes(userId)) {
        const adminLinkWrapper = document.getElementById('admin-link-wrapper');
        if (adminLinkWrapper) {
            adminLinkWrapper.style.display = 'block';
        }
    }

    // Get user data from session
    // Если данных нет в sessionStorage, пробуем получить с сервера
    let firstName = sessionStorage.getItem('first_name');
    let username = sessionStorage.getItem('username');
    
    // Если нет данных в sessionStorage, пробуем получить с сервера
    if (!firstName && authToken) {
        try {
            const response = await fetch('/api/auth/check/' + authToken);
            const authData = await response.json();
            if (authData.authorized) {
                firstName = authData.first_name || 'Пользователь';
                username = authData.username || '';
                // Сохраняем для последующих загрузок
                sessionStorage.setItem('first_name', firstName);
                sessionStorage.setItem('username', username);
            }
        } catch (e) {
            console.error('Ошибка получения данных пользователя:', e);
            firstName = 'Пользователь';
            username = '';
        }
    } else if (!firstName) {
        firstName = 'Пользователь';
        username = '';
    }
    
    currentUser = {
        id: userId,
        firstName: firstName,
        username: username
    };

    // Update UI
    document.getElementById('user-name').textContent = firstName;
    document.getElementById('user-avatar').textContent = firstName.charAt(0).toUpperCase();
    if (username) {
        document.getElementById('user-status').textContent = '@' + username;
    }

    // Load tests
    await loadTests();
}

/**
 * Load tests list
 */
async function loadTests() {
    const testsList = document.getElementById('tests-list');
    testsList.innerHTML = '';

    // Simulate loading from API
    const tests = await getTests();

    tests.forEach((test, index) => {
        const testItem = document.createElement('div');
        testItem.className = 'test-item';
        
        // Проверяем, доступен ли тест (последовательная разблокировка)
        const isLocked = index > 0 && tests[index - 1].progress < 100;
        
        if (isLocked) {
            testItem.classList.add('locked');
            testItem.style.cursor = 'not-allowed';
            testItem.style.opacity = '0.5';
        } else {
            testItem.style.cursor = 'pointer';
            testItem.style.opacity = '1';
        }
        
        if (test.progress > 0) {
            testItem.classList.add('completed');
        }
        
        testItem.innerHTML = `
            <div class="test-title">${test.title}${isLocked ? ' 🔒' : ''}</div>
            <div class="test-progress">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${test.progress}%"></div>
                </div>
                <span class="progress-text">${test.progress}%</span>
            </div>
        `;
        
        if (isLocked) {
            testItem.addEventListener('click', () => {
                alert('Сначала пройдите предыдущий тест!');
            });
        } else {
            testItem.addEventListener('click', () => selectTest(test));
        }
        testsList.appendChild(testItem);
    });

    // Show welcome state
    showWelcomeState();
}

/**
 * Get tests (simulated API)
 */
async function getTests() {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Get saved progress
    const saved = localStorage.getItem('test_progress');
    if (saved) {
        const progress = JSON.parse(saved);
        TESTS.forEach(test => {
            if (progress[test.id]) {
                test.progress = progress[test.id];
            }
        });
    }
    
    return TESTS;
}

/**
 * Show welcome state
 */
function showWelcomeState() {
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `
        <div class="welcome-state">
            <div class="welcome-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                </svg>
            </div>
            <h2>Добро пожаловать!</h2>
            <p>Выберите тест из списка слева, чтобы начать</p>
        </div>
    `;
}

/**
 * Select a test
 */
function selectTest(test) {
    currentTest = test;
    
    // Update active state in sidebar
    document.querySelectorAll('.test-item').forEach((item, index) => {
        item.classList.remove('active');
        if (TESTS[index].id === test.id) {
            item.classList.add('active');
        }
    });

    // Render test form
    renderTestForm(test);
}

/**
 * Render test form
 */
function renderTestForm(test) {
    const mainContent = document.getElementById('main-content');
    
    let questionsHTML = '';
    
    test.questions.forEach((question, index) => {
        let inputHTML = '';
        
        if (question.type === 'select') {
            inputHTML = `
                <select class="select-input" data-question="${question.id}">
                    <option value="">Выберите...</option>
                    ${question.options.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join('')}
                </select>
            `;
        } else if (question.type === 'radio') {
            inputHTML = `
                <div class="options">
                    ${question.options.map(opt => `
                        <label class="option">
                            <input type="radio" name="${question.id}" value="${opt.value}">
                            <span class="option-text">${opt.label}</span>
                        </label>
                    `).join('')}
                </div>
            `;
        } else if (question.type === 'multiselect') {
            inputHTML = `
                <div class="options">
                    ${question.options.map(opt => `
                        <label class="option">
                            <input type="checkbox" name="${question.id}" value="${opt.value}">
                            <span class="option-text">${opt.label}</span>
                        </label>
                    `).join('')}
                </div>
            `;
        } else if (question.type === 'text') {
            inputHTML = `
                <input type="text" class="text-input" data-question="${question.id}" placeholder="${question.placeholder || ''}">
            `;
        } else if (question.type === 'textarea') {
            inputHTML = `
                <textarea class="text-input" data-question="${question.id}" placeholder="${question.placeholder || ''}"></textarea>
            `;
        }
        
        questionsHTML += `
            <div class="question">
                <div class="question-number">Вопрос ${index + 1}</div>
                <div class="question-text">${question.text}</div>
                ${inputHTML}
            </div>
        `;
    });
    
    mainContent.innerHTML = `
        <div class="content-header">
            <h1>${test.title}</h1>
            <p>${test.description}</p>
        </div>
        <div class="test-form">
            ${questionsHTML}
            <div class="form-actions">
                <button class="btn btn-secondary" onclick="resetTest()">Сбросить</button>
                <button class="btn btn-primary" onclick="saveTest()">Сохранить</button>
            </div>
        </div>
    `;

    // Add event listeners for options
    document.querySelectorAll('.option').forEach(option => {
        option.addEventListener('click', function(e) {
            if (e.target.tagName === 'INPUT') return;
            
            const input = this.querySelector('input');
            if (input.type === 'radio') {
                // Deselect all in this group
                this.parentElement.querySelectorAll('.option').forEach(opt => opt.classList.remove('selected'));
            }
            
            this.classList.toggle('selected');
            input.checked = input.checked ? false : true;
        });
    });

    // Load saved answers
    loadSavedAnswers(test.id);
}

/**
 * Load saved answers
 */
function loadSavedAnswers(testId) {
    const saved = localStorage.getItem('test_answers_' + testId);
    if (!saved) return;
    
    const answers = JSON.parse(saved);
    
    Object.keys(answers).forEach(questionId => {
        const value = answers[questionId];
        
        // Select
        const select = document.querySelector(`select[data-question="${questionId}"]`);
        if (select) {
            select.value = value;
        }
        
        // Text / Textarea
        const textInput = document.querySelector(`input[data-question="${questionId}"], textarea[data-question="${questionId}"]`);
        if (textInput) {
            textInput.value = value;
        }
        
        // Radio / Checkbox
        if (Array.isArray(value)) {
            value.forEach(v => {
                const checkbox = document.querySelector(`input[name="${questionId}"][value="${v}"]`);
                if (checkbox) {
                    checkbox.checked = true;
                    checkbox.closest('.option').classList.add('selected');
                }
            });
        } else {
            const radio = document.querySelector(`input[name="${questionId}"][value="${value}"]`);
            if (radio) {
                radio.checked = true;
                radio.closest('.option').classList.add('selected');
            }
        }
    });
}

/**
 * Save test answers
 */
function saveTest() {
    if (!currentTest) return;
    
    const answers = {};
    
    // Get all answers
    currentTest.questions.forEach(question => {
        if (question.type === 'multiselect') {
            const checked = document.querySelectorAll(`input[name="${question.id}"]:checked`);
            answers[question.id] = Array.from(checked).map(c => c.value);
        } else if (question.type === 'radio') {
            const checked = document.querySelector(`input[name="${question.id}"]:checked`);
            answers[question.id] = checked ? checked.value : '';
        } else if (question.type === 'select') {
            const select = document.querySelector(`select[data-question="${question.id}"]`);
            answers[question.id] = select ? select.value : '';
        } else if (question.type === 'text' || question.type === 'textarea') {
            const input = document.querySelector(`[data-question="${question.id}"]`);
            answers[question.id] = input ? input.value : '';
        }
    });
    
    // Save answers
    localStorage.setItem('test_answers_' + currentTest.id, JSON.stringify(answers));
    
    // Calculate progress
    let answered = 0;
    currentTest.questions.forEach(question => {
        const answer = answers[question.id];
        if (answer && (typeof answer === 'string' ? answer.trim() : answer.length > 0)) {
            answered++;
        }
    });
    
    const progress = Math.round((answered / currentTest.questions.length) * 100);
    
    // Save progress
    const allProgress = JSON.parse(localStorage.getItem('test_progress') || '{}');
    allProgress[currentTest.id] = progress;
    localStorage.setItem('test_progress', JSON.stringify(allProgress));
    
    // Send to server
    saveToServer(currentTest.id, answers, progress);
    
    // Update UI
    currentTest.progress = progress;
    loadTests();
    
    alert('Ответы сохранены! Прогресс: ' + progress + '%');
}

/**
 * Reset test
 */
function resetTest() {
    if (!currentTest || !confirm('Вы уверены, что хотите сбросить все ответы?')) return;
    
    // Clear saved answers
    localStorage.removeItem('test_answers_' + currentTest.id);
    
    // Update progress
    const allProgress = JSON.parse(localStorage.getItem('test_progress') || '{}');
    allProgress[currentTest.id] = 0;
    localStorage.setItem('test_progress', JSON.stringify(allProgress));
    
    // Reload test form
    currentTest.progress = 0;
    renderTestForm(currentTest);
    loadTests();
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initDashboard);
