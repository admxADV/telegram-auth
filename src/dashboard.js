/**
 * Личный кабинет - управление профилем пользователя
 */

const AUTH_CHECK_INTERVAL = 2000;

// ID администратора
const ADMIN_USER_ID = 5093303797;

// Данные профиля
let profileData = {
    company: '',
    department: '',
    jobTitle: ''
};

// Список отделов и должностей
const departments = {
    'sales': {
        name: 'Отдел продаж',
        jobs: [
            'Руководитель отдела продаж (РОП)',
            'Старший менеджер / Ведущий специалист',
            'Агент по недвижимости (стажер)',
            'Агент по недвижимости (младший)',
            'Агент по недвижимости (опытный)',
            'Специалист по сопровождению сделок',
            'Другое'
        ]
    },
    'legal': {
        name: 'Юридический отдел',
        jobs: [
            'Главный юрисконсульт',
            'Юрист по сделкам',
            'Специалист по договорам',
            'Помощник юриста',
            'Другое'
        ]
    },
    'hr': {
        name: 'Отдел подбора сотрудников',
        jobs: [
            'Руководитель отдела',
            'HR менеджер',
            'Другое'
        ]
    },
    'marketing': {
        name: 'Маркетинг',
        jobs: [
            'Руководитель отдела маркетинга',
            'SMM-менеджер',
            'Таргетолог / контекстолог',
            'Дизайнер',
            'Фотограф / Видеограф',
            'Копирайтер',
            'PR-менеджер',
            'Другое'
        ]
    },
    'finance': {
        name: 'Финансы',
        jobs: [
            'Главный бухгалтер',
            'Бухгалтер',
            'Другое'
        ]
    },
    'training': {
        name: 'Обучение персонала',
        jobs: [
            'Руководитель учебного центра',
            'Бизнес-тренер (продажи)',
            'Бизнес-тренер (переговоры)',
            'Наставник (куратор стажеров)',
            'Другое'
        ]
    },
    'other': {
        name: 'Другое',
        jobs: [
            'Администратор офиса (Ресепшен)',
            'IT-специалист / Системный администратор',
            'Секретарь / Помощник руководителя',
            'Курьер (документы / ключи)',
            'Клининг-менеджер',
            'Ассистент',
            'Другое'
        ]
    }
};

/**
 * Проверяет статус авторизации
 */
function checkAuth() {
    const authToken = sessionStorage.getItem('auth_session');

    if (!authToken) {
        window.location.href = '/';
        return false;
    }

    fetch('/api/auth/check/' + authToken)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (!data.authorized) {
                sessionStorage.removeItem('auth_session');
                window.location.href = '/';
            } else {
                updateUserInfo(data);
                loadProfile(data.user_id);
                // Показываем ссылку на админ панель только для админа
                showAdminLink(data.user_id);
            }
        })
        .catch(error => {
            console.error('Ошибка проверки авторизации:', error);
            // При ошибке сети (сервер спит или недоступен) — не перенаправляем сразу,
            // а пробуем позже. Но если сессия явно невалидна — на главную
            if (error.message.includes('Failed to fetch') || error.message.includes('Network')) {
                console.warn('Сервер временно недоступен. Повторная попытка через 2 сек...');
                // Не перенаправляем, даём серверу время проснуться
            } else {
                // Другая ошибка — возможно сессия устарела
                sessionStorage.removeItem('auth_session');
                window.location.href = '/';
            }
        });

    return true;
}

/**
 * Показывает/скрывает ссылку на админ панель
 */
function showAdminLink(userId) {
    const adminLink = document.getElementById('admin-nav-link');
    if (adminLink) {
        // Сравниваем как числа, т.к. userId может быть строкой
        const userIdNum = parseInt(userId);
        console.log('[Dashboard] showAdminLink: userId =', userId, 'ADMIN_USER_ID =', ADMIN_USER_ID, 'match =', userIdNum === ADMIN_USER_ID);
        adminLink.style.display = (userIdNum === ADMIN_USER_ID) ? 'inline-block' : 'none';
    }
}

/**
 * Обновляет информацию о пользователе в шапке
 */
function updateUserInfo(data) {
    const nameEl = document.getElementById('user-name');
    
    if (nameEl) {
        let displayName = '';
        
        if (data.username) {
            displayName = '@' + data.username;
        } else if (data.first_name) {
            displayName = data.first_name;
        } else {
            displayName = 'User #' + data.user_id;
        }
        
        nameEl.textContent = displayName;
    }
}

/**
 * Загружает профиль пользователя
 */
function loadProfile(userId) {
    fetch('/api/profile/' + userId)
        .then(response => response.json())
        .then(data => {
            // Если профиль полностью заполнен - показываем профиль
            if (data.profile && data.profile.company && data.profile.department && data.profile.jobTitle) {
                showProfileView(data.profile);
            }
            // Если профиль частично заполнен - показываем форму с данными
            else if (data.profile) {
                if (data.profile.company) {
                    document.getElementById('company-name').value = data.profile.company;
                    profileData.company = data.profile.company;
                    document.querySelector('.step[data-step="1"]').classList.add('completed');
                    document.querySelector('.step[data-step="1"]').classList.remove('active');
                    document.querySelector('.step[data-step="2"]').classList.add('active');
                    document.querySelector('.step-content[data-step="1"]').classList.remove('active');
                    document.querySelector('.step-content[data-step="2"]').classList.add('active');
                    
                    // Выбираем отдел
                    if (data.profile.department) {
                        document.getElementById('department').value = data.profile.department;
                        updateJobTitles();
                        
                        // После обновления должностей выбираем сохраненную
                        setTimeout(() => {
                            if (data.profile.jobTitle) {
                                const jobSelect = document.getElementById('job-title-select');
                                jobSelect.value = data.profile.jobTitle;
                                if (jobSelect.value !== data.profile.jobTitle) {
                                    // Должность не найдена в списке - показываем свое
                                    jobSelect.value = 'Другое';
                                    document.getElementById('custom-job-group').style.display = 'block';
                                    document.getElementById('custom-job-title').value = data.profile.jobTitle;
                                }
                            }
                        }, 100);
                    }
                }
            }
        })
        .catch(error => {
            console.error('Ошибка загрузки профиля:', error);
        });
}

/**
 * Показывает вид профиля
 */
function showProfileView(profile) {
    document.querySelectorAll('.step-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.step').forEach(el => {
        el.classList.add('completed');
        el.classList.remove('active');
    });
    
    document.getElementById('success-message').classList.add('active');
    document.getElementById('progress-info').style.display = 'none';
    document.getElementById('view-company').textContent = profile.company || '—';
    document.getElementById('view-department').textContent = departments[profile.department]?.name || profile.department || '—';
    document.getElementById('view-job').textContent = profile.jobTitle || '—';
    document.getElementById('progress-percent').textContent = '100%';
}

/**
 * Обновляет список должностей при выборе отдела
 */
function updateJobTitles() {
    const department = document.getElementById('department').value;
    const jobSelect = document.getElementById('job-title-select');
    const jobGroup = document.getElementById('job-title-group');
    const customJobGroup = document.getElementById('custom-job-group');
    
    // Скрываем поля должностей
    jobGroup.style.display = 'none';
    customJobGroup.style.display = 'none';
    
    // Очищаем текущий список
    jobSelect.innerHTML = '<option value="">Выберите должность...</option>';
    
    if (department && departments[department]) {
        // Добавляем должности для выбранного отдела
        departments[department].jobs.forEach(job => {
            const option = document.createElement('option');
            option.value = job;
            option.textContent = job;
            jobSelect.appendChild(option);
        });
        
        // Показываем поле для выбора должности
        jobGroup.style.display = 'block';
    }
}

/**
 * Переход к следующему шагу
 */
function nextStep(currentStep) {
    // Валидация
    if (currentStep === 1) {
        const company = document.getElementById('company-name').value.trim();
        if (!company) {
            alert('Пожалуйста, введите название компании');
            return;
        }
        profileData.company = company;
    } else if (currentStep === 2) {
        const department = document.getElementById('department').value;
        if (!department) {
            alert('Пожалуйста, выберите отдел');
            return;
        }
        profileData.department = department;
        
        // Получаем должность
        const jobSelect = document.getElementById('job-title-select');
        const customJobInput = document.getElementById('custom-job-title');
        const selectedJob = jobSelect.value;
        const customJob = customJobInput.value.trim();
        
        if (selectedJob === 'Другое' && customJob) {
            profileData.jobTitle = customJob;
        } else if (selectedJob && selectedJob !== 'Другое') {
            profileData.jobTitle = selectedJob;
        } else if (selectedJob === 'Другое' && !customJob) {
            alert('Пожалуйста, введите свою должность');
            return;
        } else {
            alert('Пожалуйста, выберите должность');
            return;
        }
    }
    
    // Переход
    document.querySelector(`.step-content[data-step="${currentStep}"]`).classList.remove('active');
    document.querySelector(`.step-content[data-step="${currentStep + 1}"]`).classList.add('active');
    
    // Обновление прогресс бара
    document.querySelector(`.step[data-step="${currentStep}"]`).classList.add('completed');
    document.querySelector(`.step[data-step="${currentStep}"]`).classList.remove('active');
    document.querySelector(`.step[data-step="${currentStep + 1}"]`).classList.add('active');
    
    // Обновление текста прогресса
    const nextStepNum = currentStep + 1;
    const percent = Math.round((nextStepNum / 3) * 100);
    document.getElementById('progress-text').textContent = `Шаг ${nextStepNum} из 3`;
    document.getElementById('progress-percent-form').textContent = `(${percent}%)`;
    
    // Заполнение полей подтверждения на шаге 3
    if (currentStep === 2) {
        document.getElementById('confirm-company').value = profileData.company;
        document.getElementById('confirm-department').value = departments[profileData.department]?.name || profileData.department;
        document.getElementById('confirm-job').value = profileData.jobTitle;
    }
}

/**
 * Переход к предыдущему шагу
 */
function prevStep(currentStep) {
    document.querySelector(`.step-content[data-step="${currentStep}"]`).classList.remove('active');
    document.querySelector(`.step-content[data-step="${currentStep - 1}"]`).classList.add('active');
    
    // Обновление прогресс бара
    document.querySelector(`.step[data-step="${currentStep}"]`).classList.remove('active');
    document.querySelector(`.step[data-step="${currentStep - 1}"]`).classList.add('active');
    document.querySelector(`.step[data-step="${currentStep - 1}"]`).classList.remove('completed');
    
    // Обновление текста прогресса
    const prevStepNum = currentStep - 1;
    const percent = Math.round((prevStepNum / 3) * 100);
    document.getElementById('progress-text').textContent = `Шаг ${prevStepNum} из 3`;
    document.getElementById('progress-percent-form').textContent = `(${percent}%)`;
}

/**
 * Сохраняет профиль на сервере
 */
function saveProfile() {
    const saveBtn = document.getElementById('save-btn');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Сохранение...';
    
    const authToken = sessionStorage.getItem('auth_session');
    
    // Сначала получаем user_id
    fetch('/api/auth/check/' + authToken)
        .then(response => response.json())
        .then(data => {
            if (data.user_id) {
                return fetch('/api/profile', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        user_id: data.user_id,
                        company: profileData.company,
                        department: profileData.department,
                        job_title: profileData.jobTitle
                    })
                });
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showSuccess();
            } else {
                alert('Ошибка сохранения: ' + data.error);
            }
        })
        .catch(error => {
            console.error('Ошибка сохранения:', error);
            alert('Произошла ошибка при сохранении');
        })
        .finally(() => {
            saveBtn.disabled = false;
            saveBtn.textContent = 'Сохранить';
        });
}

/**
 * Показывает сообщение об успехе
 */
function showSuccess() {
    document.querySelectorAll('.step-content').forEach(el => el.classList.remove('active'));
    document.getElementById('success-message').classList.add('active');
    document.getElementById('progress-info').style.display = 'none';
    
    // Все шаги Completed
    document.querySelectorAll('.step').forEach(el => {
        el.classList.add('completed');
        el.classList.remove('active');
    });
    
    // Загружаем данные профиля для отображения
    loadProfileForView();
}

/**
 * Загружает профиль для отображения
 */
function loadProfileForView() {
    const authToken = sessionStorage.getItem('auth_session');
    
    fetch('/api/auth/check/' + authToken)
        .then(response => response.json())
        .then(data => {
            if (data.user_id) {
                return fetch('/api/profile/' + data.user_id);
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.profile) {
                document.getElementById('view-company').textContent = data.profile.company || '—';
                document.getElementById('view-department').textContent = departments[data.profile.department]?.name || data.profile.department || '—';
                document.getElementById('view-job').textContent = data.profile.jobTitle || '—';
                
                // Обновляем прогресс
                document.getElementById('progress-percent').textContent = '100%';
            }
        })
        .catch(error => {
            console.error('Ошибка загрузки профиля:', error);
        });
}

/**
 * Редактировать профиль
 */
function editProfile() {
    document.getElementById('progress-info').style.display = 'block';
    document.getElementById('business-process-form').style.display = 'none';
    
    // Сбрасываем форму
    document.querySelectorAll('.step').forEach(el => {
        el.classList.remove('completed', 'active');
    });
    document.querySelector('.step[data-step="1"]').classList.add('active');
    
    document.getElementById('success-message').classList.remove('active');
    document.querySelector('.step-content[data-step="1"]').classList.add('active');
    document.querySelector('.step-content[data-step="2"]').classList.remove('active');
    document.querySelector('.step-content[data-step="3"]').classList.remove('active');
}

/**
 * Показать форму бизнес-процесса
 */
function showBusinessProcessForm() {
    document.getElementById('success-message').classList.remove('active');
    document.getElementById('business-process-form').style.display = 'block';
    
    // Очищаем поля
    document.getElementById('bp-main-tasks').value = '';
    document.getElementById('bp-work-process').value = '';
    document.getElementById('bp-systems').value = '';
    document.getElementById('bp-description').value = '';
}

/**
 * Сброс формы бизнес-процесса
 */
function resetBusinessProcessForm() {
    // Сбрасываем шаги
    document.querySelectorAll('.bp-step-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('#bp-progress-bar .step').forEach(el => {
        el.classList.remove('completed', 'active');
    });
    
    // Первый шаг активен
    document.querySelector('.bp-step-content[data-bp-step="1"]').classList.add('active');
    document.querySelector('#bp-progress-bar .step[data-bp-step="1"]').classList.add('active');
    
    // Скрываем сообщение об успехе
    document.getElementById('bp-success').classList.remove('active');
    document.getElementById('bp-success').style.display = 'none';
    
    // Показываем прогресс-бар
    document.getElementById('bp-progress-bar').style.display = 'flex';
    document.getElementById('bp-progress-info').style.display = 'block';
    
    // Обновляем прогресс
    updateBpProgress(1);
}

/**
 * Обновить прогресс бизнес-процесса
 */
function updateBpProgress(step) {
    const totalSteps = 4;
    const percent = Math.round((step / totalSteps) * 100);
    
    document.getElementById('bp-progress-text').textContent = `Шаг ${step} из ${totalSteps}`;
    document.getElementById('bp-progress-percent').textContent = `(${percent}%)`;
}

// Флаг для предотвращения повторных кликов
let bpNavigating = false;

// ID элементов шагов
const BP_STEP_IDS = ['bp-step-1', 'bp-step-2', 'bp-step-3', 'bp-step-4'];
const BP_PROGRESS_IDS = ['bp-progress-1', 'bp-progress-2', 'bp-progress-3', 'bp-progress-4'];

/**
 * Переход к следующему шагу бизнес-процесса
 */
function nextBpStep(currentStep) {
    // Защита от повторных кликов
    if (bpNavigating) return;
    bpNavigating = true;
    
    setTimeout(() => { bpNavigating = false; }, 300);
    
    // Валидация
    if (currentStep === 1) {
        const mainTasks = document.getElementById('bp-main-tasks').value.trim();
        if (!mainTasks) {
            alert('Пожалуйста, опишите ваши основные задачи');
            bpNavigating = false;
            return;
        }
    } else if (currentStep === 2) {
        const workProcess = document.getElementById('bp-work-process').value.trim();
        if (!workProcess) {
            alert('Пожалуйста, опишите как вы выполняете работу');
            bpNavigating = false;
            return;
        }
    } else if (currentStep === 3) {
        const systems = document.getElementById('bp-systems').value.trim();
        if (!systems) {
            alert('Пожалуйста, укажите какие системы используете');
            bpNavigating = false;
            return;
        }
    }
    
    if (currentStep >= 4) {
        bpNavigating = false;
        return;
    }
    
    // Скрываем текущий шаг
    const currentStepEl = document.getElementById(BP_STEP_IDS[currentStep - 1]);
    const nextStepEl = document.getElementById(BP_STEP_IDS[currentStep]);
    
    if (currentStepEl) {
        currentStepEl.classList.remove('active');
        currentStepEl.style.display = 'none';
    }
    if (nextStepEl) {
        nextStepEl.classList.add('active');
        nextStepEl.style.display = 'block';
    }
    
    // Обновляем прогресс
    const currentProgressEl = document.getElementById(BP_PROGRESS_IDS[currentStep - 1]);
    const nextProgressEl = document.getElementById(BP_PROGRESS_IDS[currentStep]);
    
    if (currentProgressEl) {
        currentProgressEl.classList.remove('active');
        currentProgressEl.classList.add('completed');
    }
    if (nextProgressEl) {
        nextProgressEl.classList.add('active');
    }
    
    updateBpProgress(currentStep + 1);
    bpNavigating = false;
}

/**
 * Переход к предыдущему шагу
 */
function prevBpStep(currentStep) {
    if (bpNavigating) return;
    bpNavigating = true;
    setTimeout(() => { bpNavigating = false; }, 300);
    
    if (currentStep <= 1) {
        bpNavigating = false;
        return;
    }
    
    const currentStepEl = document.getElementById(BP_STEP_IDS[currentStep - 1]);
    const prevStepEl = document.getElementById(BP_STEP_IDS[currentStep - 2]);
    
    if (currentStepEl) {
        currentStepEl.classList.remove('active');
        currentStepEl.style.display = 'none';
    }
    if (prevStepEl) {
        prevStepEl.classList.add('active');
        prevStepEl.style.display = 'block';
    }
    
    const currentProgressEl = document.getElementById(BP_PROGRESS_IDS[currentStep - 1]);
    const prevProgressEl = document.getElementById(BP_PROGRESS_IDS[currentStep - 2]);
    
    if (currentProgressEl) {
        currentProgressEl.classList.remove('active');
    }
    if (prevProgressEl) {
        prevProgressEl.classList.add('active');
        prevProgressEl.classList.remove('completed');
    }
    
    updateBpProgress(currentStep - 1);
    bpNavigating = false;
}

/**
 * Назад к профилю
 */
function backToProfile() {
    document.getElementById('business-process-form').style.display = 'none';
    document.getElementById('success-message').classList.add('active');
}

/**
 * Сохранить бизнес-процесс (упрощенная версия)
 */
function saveBusinessProcessSimple() {
    const authToken = sessionStorage.getItem('auth_session');
    
    fetch('/api/auth/check/' + authToken)
        .then(response => response.json())
        .then(data => {
            if (data.user_id) {
                const businessProcess = {
                    user_id: data.user_id,
                    main_tasks: document.getElementById('bp-main-tasks').value.trim(),
                    work_process: document.getElementById('bp-work-process').value.trim(),
                    systems_used: document.getElementById('bp-systems').value.trim(),
                    process_description: document.getElementById('bp-description').value.trim()
                };
                
                return fetch('/api/business-process', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(businessProcess)
                });
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Бизнес-процесс сохранён!');
                backToProfile();
            } else {
                alert('Ошибка сохранения: ' + data.error);
            }
        })
        .catch(error => {
            console.error('Ошибка сохранения:', error);
            alert('Произошла ошибка при сохранении');
        });
}

/**
 * Загрузить бизнес-процесс
 */
function loadBusinessProcess() {
    const authToken = sessionStorage.getItem('auth_session');
    if (!authToken) return;
    
    fetch('/api/auth/check/' + authToken)
        .then(response => response.json())
        .then(data => {
            if (data.user_id) {
                return fetch('/api/business-process/' + data.user_id);
            }
        })
        .then(response => response.json())
        .then(data => {
            // Только заполняем поля данными, не меняем шаги
            if (data.process) {
                const mainTasksEl = document.getElementById('bp-main-tasks');
                const workProcessEl = document.getElementById('bp-work-process');
                const systemsEl = document.getElementById('bp-systems');
                const descriptionEl = document.getElementById('bp-description');
                
                if (mainTasksEl) mainTasksEl.value = data.process.mainTasks || '';
                if (workProcessEl) workProcessEl.value = data.process.workProcess || '';
                if (systemsEl) systemsEl.value = data.process.systemsUsed || '';
                if (descriptionEl) descriptionEl.value = data.process.processDescription || '';
            }
        })
        .catch(error => {
            console.error('Ошибка загрузки бизнес-процесса:', error);
        });
}

/**
 * Сохранить бизнес-процесс
 */
function saveBusinessProcess() {
    // Валидация последнего поля
    const description = document.getElementById('bp-description').value.trim();
    if (!description) {
        alert('Пожалуйста, опишите ваш бизнес-процесс');
        return;
    }
    
    const authToken = sessionStorage.getItem('auth_session');
    const saveBtn = document.querySelector('.bp-step-content[data-bp-step="4"] .btn-primary');
    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.textContent = 'Сохранение...';
    }
    
    fetch('/api/auth/check/' + authToken)
        .then(response => response.json())
        .then(data => {
            if (data.user_id) {
                const businessProcess = {
                    user_id: data.user_id,
                    main_tasks: document.getElementById('bp-main-tasks').value.trim(),
                    work_process: document.getElementById('bp-work-process').value.trim(),
                    systems_used: document.getElementById('bp-systems').value.trim(),
                    process_description: document.getElementById('bp-description').value.trim()
                };
                
                return fetch('/api/business-process', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(businessProcess)
                });
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Скрываем прогресс-бар и показываем сообщение об успехе
                document.getElementById('bp-progress-bar').style.display = 'none';
                document.getElementById('bp-progress-info').style.display = 'none';
                
                // Скрываем все шаги
                document.querySelectorAll('.bp-step-content').forEach(el => el.classList.remove('active'));
                
                // Показываем сообщение об успехе
                document.getElementById('bp-success').classList.add('active');
            } else {
                alert('Ошибка сохранения: ' + data.error);
                if (saveBtn) {
                    saveBtn.disabled = false;
                    saveBtn.textContent = 'Сохранить';
                }
            }
        })
        .catch(error => {
            console.error('Ошибка сохранения:', error);
            alert('Произошла ошибка при сохранении');
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.textContent = 'Сохранить';
            }
        });
}

/**
 * Обрабатывает выход из системы
 */
function handleLogout() {
    sessionStorage.removeItem('auth_session');
    sessionStorage.removeItem('auth_start_time');
    window.location.href = '/';
}

// Данные текущего теста
let quizData = {
    department: null,
    questions: [],
    currentIndex: 0,
    answers: []
};

const departmentNames = {
    'general': 'Для всех остальных',
    'sales': 'Менеджеры по продажам',
    'hr': 'Менеджеры по подбору персонала',
    'training': 'Обучение персонала',
    'marketing': 'Отдел маркетинга',
    'legal': 'Юридический отдел'
};

/**
 * Показать форму теста
 */
function showQuizForm() {
    const authToken = sessionStorage.getItem('auth_session');
    
    fetch('/api/auth/check/' + authToken)
        .then(response => response.json())
        .then(data => {
            if (data.user_id) {
                // Сначала получаем профиль пользователя, чтобы узнать отдел
                return fetch('/api/profile/' + data.user_id);
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.profile && data.profile.department) {
                const department = data.profile.department;
                loadQuiz(department);
            } else {
                // Если отдел не выбран - используем общий
                loadQuiz('general');
            }
        })
        .catch(error => {
            console.error('Ошибка:', error);
            loadQuiz('general');
        });
}

/**
 * Загрузить тест для отдела
 */
function loadQuiz(department) {
    document.getElementById('success-message').classList.remove('active');
    document.getElementById('business-process-form').style.display = 'none';
    document.getElementById('quiz-form').style.display = 'block';
    
    document.getElementById('quiz-title').textContent = 'Тест: ' + (departmentNames[department] || department);
    
    quizData.department = department;
    quizData.currentIndex = 0;
    quizData.answers = [];
    
    fetch('/api/quiz/questions/' + department)
        .then(response => response.json())
        .then(data => {
            if (data.questions && data.questions.length > 0) {
                quizData.questions = data.questions;
                renderQuizQuestion();
            } else {
                // Если нет вопросов для этого отдела - пробуем общие
                if (department !== 'general') {
                    loadQuiz('general');
                } else {
                    alert('Вопросы не найдены. Сначала загрузите вопросы.');
                    backToProfile();
                }
            }
        })
        .catch(error => {
            console.error('Ошибка загрузки теста:', error);
            alert('Ошибка загрузки теста');
        });
}

/**
 * Отобразить текущий вопрос
 */
function renderQuizQuestion() {
    const index = quizData.currentIndex;
    const question = quizData.questions[index];
    const total = quizData.questions.length;
    
    // Обновляем прогресс
    document.getElementById('quiz-progress').textContent = `Вопрос ${index + 1} из ${total}`;
    
    // Кнопка
    const nextBtn = document.getElementById('quiz-next-btn');
    if (index === total - 1) {
        nextBtn.textContent = 'Завершить';
    } else {
        nextBtn.textContent = 'Далее';
    }
    
    // Формируем HTML вопроса
    let html = `
        <div class="quiz-question">
            <div class="quiz-question-number">Вопрос ${question.question_number}</div>
            <div class="quiz-question-text">${question.question_text}</div>
    `;
    
    if (question.question_type === 'choice' && question.options) {
        // Варианты ответов
        question.options.forEach((option, i) => {
            const optionId = `q${question.id}_opt${i}`;
            html += `
                <label class="quiz-option">
                    <input type="radio" name="quiz_answer_${question.id}" value="${option}">
                    ${option}
                </label>
            `;
        });
        
        // Поле для комментария
        html += `
            <div class="quiz-comment">
                <div class="quiz-comment-label">Комментарий (необязательно):</div>
                <textarea class="quiz-textarea" id="quiz_comment_${question.id}" placeholder="Ваш комментарий..."></textarea>
            </div>
        `;
    } else {
        // Текстовое поле
        html += `
            <textarea class="quiz-textarea" id="quiz_answer_${question.id}" placeholder="Ваш ответ..."></textarea>
        `;
    }
    
    html += '</div>';
    
    document.getElementById('quiz-questions').innerHTML = html;
}

/**
 * Перейти к следующему вопросу
 */
function nextQuizQuestion() {
    const question = quizData.questions[quizData.currentIndex];
    
    // Сохраняем ответ
    let answerText = '';
    let commentText = '';
    
    if (question.question_type === 'choice' && question.options) {
        const selected = document.querySelector(`input[name="quiz_answer_${question.id}"]:checked`);
        if (selected) {
            answerText = selected.value;
        }
        const commentEl = document.getElementById(`quiz_comment_${question.id}`);
        if (commentEl) {
            commentText = commentEl.value;
        }
    } else {
        const answerEl = document.getElementById(`quiz_answer_${question.id}`);
        if (answerEl) {
            answerText = answerEl.value;
        }
    }
    
    // Проверяем, что ответ дан
    if (!answerText.trim()) {
        alert('Пожалуйста, дайте ответ на вопрос');
        return;
    }
    
    // Сохраняем локально
    quizData.answers[quizData.currentIndex] = {
        question_id: question.id,
        answer_text: answerText,
        comment_text: commentText
    };
    
    // Если это последний вопрос - сохраняем все
    if (quizData.currentIndex === quizData.questions.length - 1) {
        saveQuizAnswers();
    } else {
        // Переходим к следующему
        quizData.currentIndex++;
        renderQuizQuestion();
    }
}

/**
 * Сохранить все ответы
 */
function saveQuizAnswers() {
    const authToken = sessionStorage.getItem('auth_session');
    
    fetch('/api/auth/check/' + authToken)
        .then(response => response.json())
        .then(data => {
            if (!data.user_id) {
                alert('Ошибка авторизации');
                return;
            }
            
            const userId = data.user_id;
            let saved = 0;
            
            // Сохраняем каждый ответ
            const savePromises = quizData.answers.map(answer => {
                return fetch('/api/quiz/answer', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        user_id: userId,
                        question_id: answer.question_id,
                        answer_text: answer.answer_text,
                        comment_text: answer.comment_text
                    })
                })
                .then(res => res.json())
                .then(data => {
                    if (data.success) saved++;
                });
            });
            
            return Promise.all(savePromises).then(() => saved);
        })
        .then(savedCount => {
            alert(`Сохранено ${savedCount} ответов!`);
            backToProfile();
        })
        .catch(error => {
            console.error('Ошибка сохранения ответов:', error);
            alert('Ошибка сохранения ответов');
        });
}

// Инициализация
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    setInterval(checkAuth, AUTH_CHECK_INTERVAL);
    
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // Обработчик изменения должности
    const jobSelect = document.getElementById('job-title-select');
    if (jobSelect) {
        jobSelect.addEventListener('change', function() {
            const customJobGroup = document.getElementById('custom-job-group');
            if (this.value === 'Другое') {
                customJobGroup.style.display = 'block';
            } else {
                customJobGroup.style.display = 'none';
                document.getElementById('custom-job-title').value = '';
            }
        });
    }
});
