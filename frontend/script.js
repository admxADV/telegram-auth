/**
 * Trend Platform - Frontend Auth Module
 * Модуль авторизации через Telegram бота
 * 
 * Согласно PDF "УниверсальныеПравила":
 * - KISS (Keep It Simple, Stupid)
 * - DRY (Don't Repeat Yourself)
 * - Явная типизация
 * - Обработка ошибок
 */

const TELEGRAM_BOT_USERNAME = 'pavepobot'; // Trend bot
const ADMIN_USER_ID = 5093303797; // ID администратора

/**
 * Генерирует токен авторизации
 */
function generateSessionToken() {
    return 'auth_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);
}

/**
 * Создает URL для Telegram
 */
function createTelegramDeepLink(sessionToken) {
    return 'https://t.me/' + TELEGRAM_BOT_USERNAME + '?start=' + sessionToken;
}

/**
 * Проверяет статус авторизации
 */
async function checkAuthStatus(authToken) {
    try {
        const response = await fetch('/api/auth/check/' + authToken);
        if (!response.ok) {
            throw new Error('Network response was not ok: ' + response.status);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Ошибка проверки:', error);
        // При ошибке сети возвращаем null (не false), чтобы отличать от "не авторизован"
        return null;
    }
}

/**
 * Начинает сессию авторизации на сервере
 */
async function startAuthSession(sessionToken) {
    try {
        const response = await fetch('/api/auth/start', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ token: sessionToken })
        });
        
        if (!response.ok) {
            throw new Error('Failed to start auth session');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Ошибка начала сессии:', error);
        return null;
    }
}

/**
 * Обрабатывает нажатие кнопки авторизации
 */
async function handleAuthClick(event) {
    const button = event.currentTarget;
    const originalText = button.innerHTML;

    // Показываем загрузку
    button.disabled = true;
    button.innerHTML = '<span class="loading">Ожидание авторизации...</span>';

    // Генерируем токен
    const sessionToken = generateSessionToken();
    sessionStorage.setItem('auth_session', sessionToken);

    // Начинаем сессию на сервере
    await startAuthSession(sessionToken);

    // Открываем Telegram
    const telegramUrl = createTelegramDeepLink(sessionToken);
    window.open(telegramUrl, '_blank');

    // Начинаем проверку статуса
    let attempts = 0;
    const maxAttempts = 90; // 3 минуты
    let networkErrors = 0;

    const checkInterval = setInterval(async () => {
        attempts++;

        const authData = await checkAuthStatus(sessionToken);

        if (authData && authData.authorized === true) {
            clearInterval(checkInterval);
            // Сохраняем данные пользователя
            sessionStorage.setItem('user_id', authData.user_id);
            sessionStorage.setItem('first_name', authData.first_name || 'Пользователь');
            sessionStorage.setItem('username', authData.username || '');
            // Успех - перенаправляем
            window.location.href = '/dashboard.html';
        } else if (authData === null) {
            // Ошибка сети - возможно сервер спит
            networkErrors++;
            console.warn(`Ошибка сети (${networkErrors}/${maxAttempts}). Сервер может быть недоступен...`);

            if (networkErrors > 10) {
                // Много ошибок сети - пробуем позже
                clearInterval(checkInterval);
                button.disabled = false;
                button.innerHTML = originalText;
                alert('Сервер временно недоступен. Попробуйте через минуту.');
            }
        } else if (attempts >= maxAttempts) {
            clearInterval(checkInterval);
            button.disabled = false;
            button.innerHTML = originalText;
            alert('Время ожидания истекло. Попробуйте ещё раз.');
        }
    }, 2000);
}

/**
 * Проверяет уже авторизован и показываем кнопку админки если нужно
 */
async function checkAlreadyAuthorized() {
    const authToken = sessionStorage.getItem('auth_session');
    if (authToken) {
        const authData = await checkAuthStatus(authToken);
        if (authData && authData.authorized === true) {
            // Сохраняем данные пользователя
            sessionStorage.setItem('user_id', authData.user_id);
            sessionStorage.setItem('first_name', authData.first_name || 'Пользователь');
            sessionStorage.setItem('username', authData.username || '');
            // Показываем кнопку админки если это админ
            showAdminLinkIfAdmin(authData.user_id);
            window.location.href = '/dashboard.html';
        } else if (authData === null) {
            // Ошибка сети - не перенаправляем, даём серверу время проснуться
            console.warn('Сервер временно недоступен при проверке сессии');
        } else {
            // Сессия невалидна - очищаем
            sessionStorage.removeItem('auth_session');
        }
    }
}

/**
 * Показывает кнопку админки если пользователь - администратор
 */
function showAdminLinkIfAdmin(userId) {
    const adminLink = document.getElementById('admin-link');
    if (adminLink && userId === ADMIN_USER_ID) {
        adminLink.style.display = 'inline-flex';
    }
}

/**
 * Проверяет админ ли текущий пользователь
 */
async function checkAdminStatus() {
    const authToken = sessionStorage.getItem('auth_session');
    const userId = sessionStorage.getItem('user_id');
    
    if (authToken && userId) {
        if (parseInt(userId) === ADMIN_USER_ID) {
            const adminLink = document.getElementById('admin-link');
            if (adminLink) {
                adminLink.style.display = 'inline-flex';
            }
        }
    }
}

/**
 * Инициализация
 */
function initAuth() {
    // Очищаем старую сессию при загрузке страницы авторизации
    // Это гарантирует fresh login каждый раз
    const currentPath = window.location.pathname;
    if (currentPath === '/' || currentPath === '/index.html' || currentPath.endsWith('index.html')) {
        sessionStorage.clear();
    }
    
    checkAlreadyAuthorized();
    
    // Проверяем админа даже без перенаправления
    setTimeout(() => checkAdminStatus(), 500);

    const authButton = document.getElementById('telegram-auth-btn');
    if (authButton) {
        authButton.addEventListener('click', handleAuthClick);
    }
}

// Запуск при загрузке DOM
document.addEventListener('DOMContentLoaded', initAuth);

