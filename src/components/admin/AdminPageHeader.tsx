import { UsersIcon, CalendarIcon, UploadIcon, DownloadIcon, ChevronRightIcon, GridIcon } from '../icons';

type AdminPageHeaderProps = {
    onOpenImport: () => void;
    onOpenAccounts: () => void;
    onOpenScheduleCrud: () => void;
    onOpenTeacherImport: () => void;
    onOpenScheduleImport: () => void;
    onOpenPlanner: () => void;
};

type Card = {
    key: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    action: string;
    onClick: () => void;
};

export function AdminPageHeader({
    onOpenImport,
    onOpenAccounts,
    onOpenScheduleCrud,
    onOpenTeacherImport,
    onOpenScheduleImport,
    onOpenPlanner,
}: AdminPageHeaderProps) {
    const cards: Card[] = [
        {
            key: 'accounts',
            title: 'Аккаунты',
            description: 'Поиск, редактирование и удаление пользователей, смена ролей и групп.',
            icon: <UsersIcon size={22} />,
            action: 'Управлять аккаунтами',
            onClick: onOpenAccounts,
        },
        {
            key: 'planner',
            title: 'Конструктор расписания',
            description: 'Соберите расписание группы перетаскиванием: чётная и нечётная недели, учебный план.',
            icon: <GridIcon size={22} />,
            action: 'Открыть конструктор',
            onClick: onOpenPlanner,
        },
        {
            key: 'schedule',
            title: 'Расписание',
            description: 'Факультеты, группы и занятия — добавление, изменение и удаление.',
            icon: <CalendarIcon size={22} />,
            action: 'Открыть редактор',
            onClick: onOpenScheduleCrud,
        },
        {
            key: 'import',
            title: 'Импорт из CSV',
            description: 'Массовая загрузка занятий на семестр из файла расписания.',
            icon: <UploadIcon size={22} />,
            action: 'Импортировать',
            onClick: onOpenImport,
        },
        {
            key: 'teachers',
            title: 'Преподаватели',
            description: 'Загрузка и синхронизация списка преподавателей с сайта СПбГТИ(ТУ).',
            icon: <DownloadIcon size={22} />,
            action: 'Загрузить с сайта',
            onClick: onOpenTeacherImport,
        },
        {
            key: 'schedule-import',
            title: 'Расписание с сайта',
            description: 'Загрузка расписания группы с сайта СПбГТИ(ТУ) в базу занятий.',
            icon: <DownloadIcon size={22} />,
            action: 'Загрузить с сайта',
            onClick: onOpenScheduleImport,
        },
    ];

    return (
        <div className="admin-dashboard">
            <header className="admin-dashboard__head">
                <h1>Админка</h1>
                <p>Управление данными портала — выберите раздел.</p>
            </header>

            <div className="admin-dashboard__grid">
                {cards.map(card => (
                    <button
                        key={card.key}
                        type="button"
                        className="admin-card"
                        onClick={card.onClick}
                    >
                        <span className="admin-card__icon">{card.icon}</span>
                        <span className="admin-card__title">{card.title}</span>
                        <span className="admin-card__desc">{card.description}</span>
                        <span className="admin-card__action">
                            {card.action}
                            <ChevronRightIcon size={16} />
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
}
