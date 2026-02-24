/**
 * Trend Platform - Dashboard
 * Личный кабинет с тестами
 */

// Questions for test 2 based on position
const POSITION_QUESTIONS = {
    ceo: [
        { id: 'q1', text: 'Вспомните случай за последний месяц, когда вы не получили важные данные для решения вовремя. Из-за чего это произошло?', type: 'textarea' },
        { id: 'q2', text: 'Где сейчас скапливаются «бутылочные горлышки», тормозящие работу компании?', type: 'textarea' },
        { id: 'q3', text: 'При принятии решений вам часто не хватает цифр или аналитики? Каких именно?', type: 'textarea' },
        { id: 'q4', text: 'Если бы вы могли убрать одну отчетность, которую вынуждены смотреть, но не используете, что бы это было?', type: 'textarea' }
    ],
    commercial_director: [
        { id: 'q1', text: 'Опишите сделку последнего месяца, которая сорвалась или затянулась. Что стало камнем преткновения?', type: 'textarea' },
        { id: 'q2', text: 'Как часто менеджеры продают «вслепую», не видя реального наличия/цены объекта?', type: 'textarea' },
        { id: 'q3', text: 'Сколько времени вы тратите на согласование спецпредложений или скидок? Что тормозит процесс?', type: 'textarea' },
        { id: 'q4', text: 'Какая информация от смежных отделов приходит к вам с опозданием или в неудобном формате?', type: 'textarea' }
    ],
    hr_bp: [
        { id: 'q1', text: 'Вспомните последний конфликт между отделами или сотрудниками. Из-за какого бизнес-процесса (или его отсутствия) он возник?', type: 'textarea' },
        { id: 'q2', text: 'Какие запросы от руководителей вы получаете чаще всего и на какие из них сложно быстро найти ответ?', type: 'textarea' },
        { id: 'q3', text: 'Где сейчас «теряются» люди на этапе адаптации? В какой момент новый сотрудник чувствует себя брошенным?', type: 'textarea' },
        { id: 'q4', text: 'Какие данные по эффективности персонала вы не можете получить, потому что их просто не считают?', type: 'textarea' }
    ],
    support_sales_director: [
        { id: 'q1', text: 'Вспомните случай, когда отдел продаж сорвал сделку, потому что не получил вовремя поддержку. Что помешало?', type: 'textarea' },
        { id: 'q2', text: 'Какие заявки от руководителей отделов вы считаете избыточными или невыполнимыми?', type: 'textarea' },
        { id: 'q3', text: 'Где в ваших процессах происходит двойной ввод данных вашими сотрудниками?', type: 'textarea' },
        { id: 'q4', text: 'Сколько времени в день уходит у ваших подчиненных на ручное согласование документов?', type: 'textarea' }
    ],
    recruitment_head: [
        { id: 'q1', text: 'Опишите портрет идеального кандидата, которого вы искали дольше всего. Почему поиск занял так много времени?', type: 'textarea' },
        { id: 'q2', text: 'Какой этап найма самый неудобный для вас и кандидата с точки зрения организации?', type: 'textarea' },
        { id: 'q3', text: 'Откуда к вам приходят лучшие кандидаты? Работает ли этот канал стабильно?', type: 'textarea' },
        { id: 'q4', text: 'Сколько времени уходит на проверку «фейковых» резюме или отсев откровенно неподходящих кандидатов?', type: 'textarea' }
    ],
    sales_head: [
        { id: 'q1', text: 'Вспомните лучшего новичка за последний месяц. Что помогло ему быстрее войти в ритм и начать продавать?', type: 'textarea' },
        { id: 'q2', text: 'Как часто ваши менеджеры ошибаются в расчетах или условиях из-за того, что не нашли актуальную информацию?', type: 'textarea' },
        { id: 'q3', text: 'Какие возражения клиентов ваши сотрудники не могут закрыть сами и эскалируют вам?', type: 'textarea' },
        { id: 'q4', text: 'Если бы вы могли автоматизировать один отчет для вашей команды, что бы это было?', type: 'textarea' }
    ],
    support_manager: [
        { id: 'q1', text: 'Вспомните ситуацию, когда клиент был на взводе из-за того, что вы долго искали ответ на его вопрос. Где искали?', type: 'textarea' },
        { id: 'q2', text: 'Сколько открытых вкладок/программ вам нужно держать в голове одновременно, чтобы работать?', type: 'textarea' },
        { id: 'q3', text: 'Как часто вы переспрашиваете коллег, потому что не можете найти инструкцию или ответ в базе знаний?', type: 'textarea' },
        { id: 'q4', text: 'Что вас бесит в системе взаимодействия со смежными отделами?', type: 'textarea' }
    ],
    newbuildings_manager: [
        { id: 'q1', text: 'Вспомните случай, когда актуальность цен/планировок в вашей базе разошлась с реальностью. К чему это привело?', type: 'textarea' },
        { id: 'q2', text: 'Как часто застройщики присылают документы/обновления с опозданием?', type: 'textarea' },
        { id: 'q3', text: 'Сколько времени занимает подготовка одного коммерческого предложения под конкретный запрос?', type: 'textarea' },
        { id: 'q4', text: 'Где сейчас хранится информация по каждому ЖК? Удобно ли ее искать новичкам?', type: 'textarea' }
    ],
    mortgage_specialist: [
        { id: 'q1', text: 'Вспомните последнюю сделку, где клиент отказался от ипотеки из-за того, что ему долго не давали предварительное одобрение. Почему?', type: 'textarea' },
        { id: 'q2', text: 'Сколько времени вы тратите на сбор одних и тех же документов от клиента по несколько раз?', type: 'textarea' },
        { id: 'q3', text: 'От кого из коллег вы чаще всего получаете некорректные вводные для расчета?', type: 'textarea' },
        { id: 'q4', text: 'Как часто банки меняют условия без вашего ведома, и вы узнаете об этом последним?', type: 'textarea' }
    ],
    lawyer: [
        { id: 'q1', text: 'Вспомните сделку, которая зависла на этапе юридической проверки. Что именно тормозило процесс?', type: 'textarea' },
        { id: 'q2', text: 'Какие документы или данные вам приходится «выбивать» из других отделов дольше всего?', type: 'textarea' },
        { id: 'q3', text: 'Какие типовые ошибки в договорах повторяются у коллег из раза в раз?', type: 'textarea' },
        { id: 'q4', text: 'Сколько времени тратится на ручное составление однотипных документов?', type: 'textarea' }
    ],
    advertising_manager: [
        { id: 'q1', text: 'Вспомните удачную рекламную кампанию. Как быстро вы получили обратную связь по лидам от отдела продаж?', type: 'textarea' },
        { id: 'q2', text: 'Что происходит с заявками после того, как вы их передали? Есть ли у вас понимание, какие заявки «качественные», а какие нет?', type: 'textarea' },
        { id: 'q3', text: 'Как часто выделенный бюджет «замораживается» или меняется постфактум?', type: 'textarea' },
        { id: 'q4', text: 'Где хранятся все макеты и креативы? Легко ли их найти через полгода?', type: 'textarea' }
    ],
    administrator: [
        { id: 'q1', text: 'Вспомните последний форс-мажор в офисе (сломалась техника, закончилась вода, пришла проверка). Что было самым сложным в решении?', type: 'textarea' },
        { id: 'q2', text: 'Как часто сотрудники жалуются на работу техники или ПО? В чем обычно проблема?', type: 'textarea' },
        { id: 'q3', text: 'Сколько времени уходит на сбор подписей или информирование всех сотрудников о важном объявлении?', type: 'textarea' },
        { id: 'q4', text: 'Что самое неудобное в процессе заказа канцтоваров или воды?', type: 'textarea' }
    ],
    hr_manager: [
        { id: 'q1', text: 'Вспомните сотрудника, который уволился, и вы подумали: «Жаль, могли бы и не терять». Почему он ушел?', type: 'textarea' },
        { id: 'q2', text: 'Какая часть документооборота по сотрудникам самая запутанная и отнимает много времени?', type: 'textarea' },
        { id: 'q3', text: 'Как часто вы сталкиваетесь с тем, что руководитель не дал обратную связь стажеру, и вы узнаете об этом, когда стажер уже уходит?', type: 'textarea' },
        { id: 'q4', text: 'Что бы вы автоматизировали в процессе адаптации в первую очередь?', type: 'textarea' }
    ],
    accountant: [
        { id: 'q1', text: 'Вспомните последнюю ошибку в первичной документации. От кого она пришла и сколько времени заняло исправление?', type: 'textarea' },
        { id: 'q2', text: 'Какие справки или расчеты вас просят сделать чаще всего, хотя они не входят в ваши прямые обязанности?', type: 'textarea' },
        { id: 'q3', text: 'Сколько раз за день вы переключаетесь между банк-клиентом, 1С и Excel?', type: 'textarea' },
        { id: 'q4', text: 'Кто из отправителей документов присылает их с опозданием, из-за чего вы задерживаетесь на работе?', type: 'textarea' }
    ],
    clerk: [
        { id: 'q1', text: 'Вспомните случай, когда вы полдня искали договор или акт. Где в итоге нашли?', type: 'textarea' },
        { id: 'q2', text: 'Сколько копий одного документа вам приходится снимать и раскладывать по папкам?', type: 'textarea' },
        { id: 'q3', text: 'Как часто к вам приходят и просят: «Найди письмо от такого-то числа»?', type: 'textarea' },
        { id: 'q4', text: 'Где сейчас происходит сбой в нумерации или регистрации документов?', type: 'textarea' }
    ],
    business_trainer: [
        { id: 'q1', text: 'Вспомните тренинг, который провалился (или был неэффективным). Почему материал не зашел?', type: 'textarea' },
        { id: 'q2', text: 'Как вы оцениваете, стал ли продажник продавать лучше после тренинга? Каких цифр вам не хватает?', type: 'textarea' },
        { id: 'q3', text: 'Сколько времени уходит на сбор группы, чтобы провести очное обучение?', type: 'textarea' },
        { id: 'q4', text: 'Какие темы вам приходится повторять одним и тем же сотрудникам по несколько раз?', type: 'textarea' }
    ],
    analyst: [
        { id: 'q1', text: 'Вспомните случай, когда ваши данные назвали «неактуальными». Почему так произошло?', type: 'textarea' },
        { id: 'q2', text: 'Из скольких источников вам приходится собирать информацию для одного стандартного отчета?', type: 'textarea' },
        { id: 'q3', text: 'Что вас бесит в качестве данных, которые вносят коллеги?', type: 'textarea' },
        { id: 'q4', text: 'Как часто руководители просят у вас один отчет, а потом выясняется, что нужны были совсем другие цифры?', type: 'textarea' }
    ],
    photographer: [
        { id: 'q1', text: 'Вспомните съемку, на которой объект был плохо подготовлен (бардак, не готов к съемке). Кто виноват?', type: 'textarea' },
        { id: 'q2', text: 'Сколько времени занимает перенос и сортировка фотографий после съемки?', type: 'textarea' },
        { id: 'q3', text: 'Как часто вы переснимаете объекты, потому что предыдущие фото потерялись/не понравились?', type: 'textarea' },
        { id: 'q4', text: 'Где хранится фотоархив и легко ли найти в нем фото конкретного объекта годичной давности?', type: 'textarea' }
    ],
    other: [
        { id: 'q1', text: 'Опишите проблему, с которой вы сталкиваетесь чаще всего в своей работе.', type: 'textarea' },
        { id: 'q2', text: 'Какой процесс в вашей работе самый неудобный или медленный?', type: 'textarea' },
        { id: 'q3', text: 'Что бы вы изменили в своей ежедневной работе, если бы могли?', type: 'textarea' },
        { id: 'q4', text: 'Какая информация или инструменты вам нужны для эффективной работы?', type: 'textarea' }
    ]
};

// Default questions for test 2 (if position not found)
const DEFAULT_TEST2_QUESTIONS = [
    { id: 'daily_routine', text: 'Опишите ваш обычный рабочий день. Напишите тезисно все какие задачи вы выполняете от самых не значительных до больших', type: 'textarea' },
    { id: 'time_consuming', text: 'Перечислите задачи которые занимают большую часть вашего времени', type: 'textarea' },
    { id: 'magic_helper', text: 'Если бы у вас появился волшебный помощник, какую самую скучную задачу вы бы отдали ему первым делом?', type: 'textarea' },
    { id: 'irritates', text: 'Что вас раздражает в текущих процессах больше всего?', type: 'textarea' }
];

// Get test 2 questions based on selected position
function getTest2Questions(positionValue) {
    return POSITION_QUESTIONS[positionValue] || DEFAULT_TEST2_QUESTIONS;
}
const TESTS = [
    {
        id: 1,
        title: 'Отдел и Должность',
        description: 'Определение отдела и должности',
        progress: 0,
        questions: [
            {
                id: 'position_select',
                text: 'Выберите вашу должность',
                type: 'select',
                options: [
                    { value: 'ceo', label: 'Генеральный директор' },
                    { value: 'commercial_director', label: 'Коммерческий директор' },
                    { value: 'hr_bp', label: 'HR бизнес партнер' },
                    { value: 'support_sales_director', label: 'Директор департамента поддержки продаж' },
                    { value: 'recruitment_head', label: 'Руководитель группы найма' },
                    { value: 'sales_head', label: 'Руководитель группы продаж' },
                    { value: 'support_manager', label: 'Менеджер поддержки продаж' },
                    { value: 'newbuildings_manager', label: 'Управляющий по новостройкам' },
                    { value: 'mortgage_specialist', label: 'Ипотечный специалист' },
                    { value: 'lawyer', label: 'Юрист' },
                    { value: 'advertising_manager', label: 'Рекламный менеджер' },
                    { value: 'administrator', label: 'Администратор' },
                    { value: 'hr_manager', label: 'HR менеджер' },
                    { value: 'accountant', label: 'Бухгалтер' },
                    { value: 'clerk', label: 'Делопроизводитель' },
                    { value: 'business_trainer', label: 'Бизнес-тренер' },
                    { value: 'analyst', label: 'Аналитик' },
                    { value: 'photographer', label: 'Фотограф' },
                    { value: 'other', label: 'Написать свой вариант' }
                ]
            },
            {
                id: 'systems',
                text: 'Какими системами пользуетесь ежедневно? В том числе и бумажные журналы',
                type: 'multiselect',
                options: [
                    { value: 'crm', label: 'CRM система' },
                    { value: 'excel', label: 'Excel / Google Таблицы' },
                    { value: 'messaging', label: 'Telegram / WhatsApp' },
                    { value: 'realty', label: 'Авито / Циан / Домклик' },
                    { value: '1c', label: '1С / финансы' },
                    { value: 'custom', label: 'Написать свои варианты' }
                ]
            },
            {
                id: 'daily_routine',
                text: 'Распишите типичный рабочий день',
                description: 'Опишите максимально подробно ваш рабочий процесс: откуда к вам поступают задачи/данные (от кого или из какой системы), что вы с ними делаете вручную, куда вносите результат и кому передаете дальше. Какие отчеты, справки или таблицы вы обязаны заполнять? С представителями каких отделов вы контактируете ежедневно/еженедельно и по какому поводу?',
                type: 'textarea',
                placeholder: 'Опишите ваш рабочий процесс...'
            },
            {
                id: 'pain',
                text: 'Перечислите, что больше всего усложняет или замедляет вашу работу',
                type: 'textarea',
                placeholder: 'Опишите проблему'
            }
        ]
    },
    {
        id: 2,
        title: 'Общие вопросы',
        description: 'Вопросы о вашей работе',
        progress: 0,
        questions: [
            {
                id: 'time_consuming',
                text: 'Перечислите задачи которые занимают большую часть вашего времени',
                type: 'textarea',
                placeholder: 'Перечислите задачи...'
            },
            {
                id: 'magic_helper',
                text: 'Если бы у вас появился волшебный помощник, какую самую скучную задачу вы бы отдали ему первым делом?',
                type: 'textarea',
                placeholder: 'Опишите задачу...'
            },
            {
                id: 'irritates',
                text: 'Что вас раздражает в текущих процессах больше всего?',
                type: 'textarea',
                placeholder: 'Опишите, что раздражает...'
            }
        ]
    },
    {
        id: 3,
        title: 'Тест',
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
        // Тест 3 (index 2) всегда заблокирован
        const isLocked = index === 2 || (index > 0 && tests[index - 1].progress < 100);
        
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
    
    // Get saved answers from test 1 to determine position
    const test1Answers = localStorage.getItem('test_1_answers');
    let positionValue = 'other';
    
    if (test1Answers) {
        try {
            const answers = JSON.parse(test1Answers);
            // Get position from test 1 (either position_select or position)
            positionValue = answers.position_select || answers.position || 'other';
        } catch (e) {
            console.error('Error parsing test answers:', e);
        }
    }
    
    // Update test 2 questions based on position
    const test2Index = TESTS.findIndex(t => t.id === 2);
    if (test2Index !== -1) {
        TESTS[test2Index].questions = getTest2Questions(positionValue);
    }
    
    return TESTS;
}

/**
 * Show welcome state
 */
function showWelcomeState() {
    const mainContent = document.getElementById('test-area');
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
    const mainContent = document.getElementById('test-area');
    
    let questionsHTML = '';
    
    test.questions.forEach((question, index) => {
        let inputHTML = '';
        let customInputHTML = '';
        
        if (question.type === 'select') {
            inputHTML = `
                <select class="select-input" data-question="${question.id}" onchange="handleSelectChange(this, '${question.id}')">
                    <option value="">Выберите...</option>
                    ${question.options.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join('')}
                </select>
                <div id="custom-${question.id}" class="custom-input-wrapper" style="display: none; margin-top: 10px;">
                    <input type="text" class="text-input" data-question="${question.id}_custom" placeholder="Напишите ваш вариант">
                </div>
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
                            <input type="checkbox" name="${question.id}" value="${opt.value}" onchange="handleMultiselectChange(this, '${question.id}')">
                            <span class="option-text">${opt.label}</span>
                        </label>
                    `).join('')}
                </div>
                <div id="custom-${question.id}" class="custom-input-wrapper" style="display: none; margin-top: 10px;">
                    <input type="text" class="text-input" data-question="${question.id}_custom" placeholder="Напишите ваши варианты">
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
                ${question.description ? `<div class="question-description">${question.description}</div>` : ''}
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
            const input = this.querySelector('input');
            if (!input) return;
            
            // Если кликнули на сам checkbox/radio, браузер сам обработает
            if (e.target === input) {
                // Для radio: снять selected со всех в группе
                if (input.type === 'radio') {
                    this.parentElement.querySelectorAll('.option').forEach(opt => opt.classList.remove('selected'));
                }
                // Добавить/убрать класс selected
                this.classList.toggle('selected', input.checked);
                return;
            }
            
            // Если кликнули на текст или область label - переключаем вручную
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
    
    // For test 1, also save position specifically for test 2 questions
    if (currentTest.id === 1) {
        localStorage.setItem('test_1_answers', JSON.stringify(answers));
    }
    
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
document.addEventListener('DOMContentLoaded', () => {
    initDashboard();
    loadChatMessages();
    // Auto-refresh chat every 3 seconds
    setInterval(loadChatMessages, 3000);
});

// ==================== CHAT FUNCTIONS ====================

let chatMessages = [];

// Load chat messages from server
async function loadChatMessages() {
    const userId = sessionStorage.getItem('user_id');
    if (!userId) return;
    
    try {
        const response = await fetch('/api/chat/messages?userId=' + userId);
        if (response.ok) {
            chatMessages = await response.json();
            renderChatMessages();
        }
    } catch (error) {
        console.error('Error loading chat messages:', error);
    }
}

// Render chat messages
function renderChatMessages() {
    const container = document.getElementById('chat-messages');
    if (!container) return;
    
    if (chatMessages.length === 0) {
        container.innerHTML = '<div class="chat-empty">Пока нет сообщений</div>';
        return;
    }
    
    container.innerHTML = chatMessages.map(msg => `
        <div class="message ${msg.type}">
            ${msg.text}
            <div class="message-time">${formatMessageTime(msg.timestamp)}</div>
        </div>
    `).join('');
    
    // Scroll to bottom
    container.scrollTop = container.scrollHeight;
}

// Format message time
function formatMessageTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

// Send message
async function sendMessage() {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    const userId = sessionStorage.getItem('user_id');
    
    if (!text || !userId) return;
    
    // Add message to local array
    const message = {
        id: Date.now(),
        text: text,
        type: 'sent',
        timestamp: new Date().toISOString(),
        userId: userId
    };
    
    chatMessages.push(message);
    renderChatMessages();
    
    // Clear input
    input.value = '';
    
    // Send to server
    try {
        await fetch('/api/chat/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: userId,
                text: text
            })
        });
    } catch (error) {
        console.error('Error sending message:', error);
    }
}

// Handle Enter key in chat input
function handleChatKeyPress(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
}

// Handle select change - show custom input for 'other' option
function handleSelectChange(selectElement, questionId) {
    const customWrapper = document.getElementById('custom-' + questionId);
    if (!customWrapper) return;
    
    if (selectElement.value === 'other') {
        customWrapper.style.display = 'block';
        customWrapper.querySelector('input').focus();
    } else {
        customWrapper.style.display = 'none';
        customWrapper.querySelector('input').value = '';
    }
}

// Handle multiselect change - show custom input for 'custom' option
function handleMultiselectChange(checkboxElement, questionId) {
    const customWrapper = document.getElementById('custom-' + questionId);
    if (!customWrapper) return;
    
    // Check if 'custom' option is selected
    const checkboxes = document.querySelectorAll(`input[name="${questionId}"]`);
    let isCustomSelected = false;
    
    checkboxes.forEach(cb => {
        if (cb.value === 'custom' && cb.checked) {
            isCustomSelected = true;
        }
    });
    
    if (isCustomSelected) {
        customWrapper.style.display = 'block';
        customWrapper.querySelector('input').focus();
    } else {
        customWrapper.style.display = 'none';
        customWrapper.querySelector('input').value = '';
    }
}
