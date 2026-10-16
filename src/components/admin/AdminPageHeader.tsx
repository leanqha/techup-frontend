import { UsersIcon, CalendarIcon, UploadIcon, ChevronRightIcon } from '../icons';

type AdminPageHeaderProps = {
    onOpenImport: () => void;
    onOpenAccounts: () => void;
    onOpenScheduleCrud: () => void;
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
