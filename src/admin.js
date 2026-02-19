/**
 * Админ панель - загрузка пользователей
 */

const AUTH_CHECK_INTERVAL = 2000;

// ID администратора (только этот пользователь может访问 админ панель)
const ADMIN_USER_ID = 5093303797;

// Хранилище данных
let allUsers = [];
let currentSort = { column: 'created_at', direction: 'desc' };
let searchQuery = '';

// Перевод отделов
const departmentNames = {
    'sales': 'Отдел продаж',
    'legal': 'Юридический отдел',
    'hr': 'Отдел подбора сотрудников',
    'marketing': 'Маркетинг',
    'finance': 'Финансы',
    'training': 'Обучение персонала',
    'other': 'Другое',
    'general': 'Для всех остальных'
};

/**
 * Проверка авторизации и прав администратора
 */
function checkAuth() {
    const authToken = sessionStorage.getItem('auth_session');
    
    if (!authToken) {
        window.location.href = '/';
        return false;
    }
    
    fetch('/api/auth/check/' + authToken)
        .then(response => response.json())
        .then(data => {
            if (!data.authorized) {
                sessionStorage.removeItem('auth_session');
                window.location.href = '/';
            } else {
                // Проверяем, является ли пользователь админом
                if (data.user_id !== ADMIN_USER_ID) {
                    // Не админ - перенаправляем на личный кабинет
                    window.location.href = '/dashboard.html';
                    return;
                }
                loadUsers();
            }
        })
        .catch(error => {
            console.error('Ошибка проверки авторизации:', error);
        });
    
    return true;
}

/**
 * Загрузка списка пользователей
 */
function loadUsers() {
    const tbody = document.getElementById('users-body');
    tbody.innerHTML = '<tr><td colspan="7" class="loading">Загрузка...</td></tr>';
    
    const authToken = sessionStorage.getItem('auth_session');
    
    fetch('/api/admin/users', {
        headers: {
            'Authorization': 'Bearer ' + authToken
        }
    })
        .then(response => response.json())
        .then(data => {
            if (data.users) {
                allUsers = data.users;
                updateUserCount();
                applyFiltersAndSort();
            } else {
                tbody.innerHTML = '<tr><td colspan="7" class="no-users">Ошибка загрузки</td></tr>';
            }
        })
        .catch(error => {
            console.error('Ошибка загрузки пользователей:', error);
            tbody.innerHTML = '<tr><td colspan="7" class="no-users">Ошибка загрузки</td></tr>';
        });
}

/**
 * Обновление счетчика пользователей
 */
function updateUserCount() {
    const countElement = document.getElementById('user-count');
    if (countElement) {
        countElement.textContent = allUsers.length;
    }
}

/**
 * Применение фильтров и сортировки
 */
function applyFiltersAndSort() {
    let filtered = [...allUsers];
    
    // Фильтр поиска
    if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(user => {
            const fullName = (user.first_name + ' ' + (user.last_name || '')).toLowerCase();
            const username = (user.username || '').toLowerCase();
            const company = (user.company || '').toLowerCase();
            const jobTitle = (user.job_title || '').toLowerCase();
            const dept = (user.department || '').toLowerCase();
            
            return fullName.includes(query) || 
                   username.includes(query) || 
                   company.includes(query) ||
                   jobTitle.includes(query) ||
                   dept.includes(query) ||
                   String(user.telegram_id).includes(query);
        });
    }
    
    // Сортировка
    filtered.sort((a, b) => {
        let valA, valB;
        
        switch (currentSort.column) {
            case 'name':
                valA = (a.first_name || '').toLowerCase();
                valB = (b.first_name || '').toLowerCase();
                break;
            case 'telegram_id':
                valA = a.telegram_id;
                valB = b.telegram_id;
                break;
            case 'company':
                valA = (a.company || '').toLowerCase();
                valB = (b.company || '').toLowerCase();
                break;
            case 'department':
                valA = (a.department || '').toLowerCase();
                valB = (b.department || '').toLowerCase();
                break;
            case 'job_title':
                valA = (a.job_title || '').toLowerCase();
                valB = (b.job_title || '').toLowerCase();
                break;
            case 'created_at':
                valA = new Date(a.created_at || 0);
                valB = new Date(b.created_at || 0);
                break;
            default:
                return 0;
        }
        
        if (valA < valB) return currentSort.direction === 'asc' ? -1 : 1;
        if (valA > valB) return currentSort.direction === 'asc' ? 1 : -1;
        return 0;
    });
    
    renderUsers(filtered);
}

/**
 * Сортировка по столбцу
 */
function sortBy(column) {
    if (currentSort.column === column) {
        currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
    } else {
        currentSort.column = column;
        currentSort.direction = 'asc';
    }
    
    // Обновление иконок
    document.querySelectorAll('th[data-sortable]').forEach(th => {
        th.classList.remove('sort-asc', 'sort-desc');
        if (th.dataset.column === column) {
            th.classList.add(currentSort.direction === 'asc' ? 'sort-asc' : 'sort-desc');
        }
    });
    
    applyFiltersAndSort();
}

/**
 * Поиск пользователей
 */
function handleSearch(event) {
    searchQuery = event.target.value.trim();
    applyFiltersAndSort();
}

/**
 * Отрисовка пользователей
 */
function renderUsers(users) {
    const tbody = document.getElementById('users-body');
    const filteredCount = document.getElementById('filtered-count');
    
    if (filteredCount) {
        filteredCount.textContent = users.length;
    }
    
    if (users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="no-users">' + 
            (searchQuery ? 'По вашему запросу ничего не найдено' : 'Нет пользователей') + 
            '</td></tr>';
        return;
    }
    
    tbody.innerHTML = users.map(user => {
        const avatar = user.first_name ? user.first_name.charAt(0).toUpperCase() : '@';
        const username = user.username ? '@' + user.username : '—';
        const company = user.company || '—';
        const department = user.department ? (departmentNames[user.department] || user.department) : '—';
        const jobTitle = user.job_title || '—';
        const date = user.created_at ? new Date(user.created_at).toLocaleDateString('ru') : '—';
        
        return `
            <tr>
                <td>
                    <div class="user-cell">
                        <div class="user-avatar">${avatar}</div>
                        <div>
                            <div>${user.first_name || 'Пользователь'} ${user.last_name || ''}</div>
                            <div style="color: #666; font-size: 12px;">${username}</div>
                        </div>
                    </div>
                </td>
                <td>${user.telegram_id}</td>
                <td>${company}</td>
                <td><span class="badge badge-department">${department}</span></td>
                <td>${jobTitle}</td>
                <td>${date}</td>
                <td>
                    <button class="btn-action" onclick="viewQuizAnswers(${user.telegram_id})">📝</button>
                </td>
            </tr>
        `;
    }).join('');
}

/**
 * Просмотр ответов тестов пользователя
 */
function viewQuizAnswers(telegramId) {
    const modal = document.getElementById('quiz-modal');
    const content = document.getElementById('quiz-modal-content');
    
    content.innerHTML = '<div class="loading">Загрузка ответов...</div>';
    modal.style.display = 'block';
    
    fetch('/api/admin/quiz-answers/' + telegramId)
        .then(response => response.json())
        .then(data => {
            if (data.answers && data.answers.length > 0) {
                let html = '<h3>Ответы на тест</h3>';
                let currentDept = '';
                
                data.answers.forEach(answer => {
                    // Заголовок раздела
                    if (answer.department !== currentDept) {
                        currentDept = answer.department;
                        html += `<h4 style="margin: 20px 0 10px; color: #667eea;">${departmentNames[currentDept] || currentDept}</h4>`;
                    }
                    
                    html += `
                        <div style="margin-bottom: 15px; padding: 10px; background: #f8f9fa; border-radius: 8px;">
                            <div style="font-weight: 600; margin-bottom: 5px;">${answer.question_number}. ${answer.question_text}</div>
                            <div style="color: #333;">${answer.answer_text || '—'}</div>
                            ${answer.comment_text ? `<div style="color: #666; font-size: 12px; margin-top: 5px;"><em>Комментарий: ${answer.comment_text}</em></div>` : ''}
                        </div>
                    `;
                });
                
                content.innerHTML = html;
            } else {
                content.innerHTML = '<p>Ответов пока нет</p>';
            }
        })
        .catch(error => {
            console.error('Ошибка загрузки ответов:', error);
            content.innerHTML = '<p>Ошибка загрузки ответов</p>';
        });
}

/**
 * Закрыть модальное окно
 */
function closeQuizModal() {
    document.getElementById('quiz-modal').style.display = 'none';
}

/**
 * Выход
 */
function handleLogout() {
    sessionStorage.removeItem('auth_session');
    sessionStorage.removeItem('auth_start_time');
    window.location.href = '/';
}

// Инициализация
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    setInterval(checkAuth, AUTH_CHECK_INTERVAL);
    
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }
    
    // Обработчики сортировки
    document.querySelectorAll('th[data-sortable]').forEach(th => {
        th.addEventListener('click', () => sortBy(th.dataset.column));
    });
});
