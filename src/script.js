/**
 * Модуль авторизации через Telegram бота
 */

const TELEGRAM_BOT_USERNAME = 'pavepobot';

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
        const data = await response.json();
        return data.authorized === true;
    } catch (error) {
        console.error('Ошибка проверки:', error);
        return false;
    }
}

/**
 * Обрабатывает нажатие кнопки
 */
async function handleAuthClick(event) {
    const button = event.currentTarget;
    const originalText = button.innerHTML;
    
    // Показываем загрузку
    button.disabled = true;
    button.innerHTML = 'Ожидание авторизации...';
    
    // Генерируем токен
    const sessionToken = generateSessionToken();
    sessionStorage.setItem('auth_session', sessionToken);
    
    // Открываем Telegram
    const telegramUrl = createTelegramDeepLink(sessionToken);
    window.open(telegramUrl, '_blank');
    
    // Начинаем проверку
    let attempts = 0;
    const maxAttempts = 90; // 3 минуты
    
    const checkInterval = setInterval(async () => {
        attempts++;
        
        const isAuthorized = await checkAuthStatus(sessionToken);
        
        if (isAuthorized) {
            clearInterval(checkInterval);
            // Успех - перенаправляем
            window.location.href = '/dashboard.html';
        } else if (attempts >= maxAttempts) {
            clearInterval(checkInterval);
            button.disabled = false;
            button.innerHTML = originalText;
            alert('Время ожидания истекло. Попробуйте ещё раз.');
        }
    }, 2000);
}

/**
 * Проверяет уже авторизован
 */
async function checkAlreadyAuthorized() {
    const authToken = sessionStorage.getItem('auth_session');
    if (authToken) {
        const isAuthorized = await checkAuthStatus(authToken);
        if (isAuthorized) {
            window.location.href = '/dashboard.html';
        }
    }
}

/**
 * Инициализация
 */
function initAuth() {
    checkAlreadyAuthorized();
    
    const authButton = document.getElementById('telegram-auth-btn');
    if (authButton) {
        authButton.addEventListener('click', handleAuthClick);
    }
}

document.addEventListener('DOMContentLoaded', initAuth);
