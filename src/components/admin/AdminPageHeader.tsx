type AdminPageHeaderProps = {
    onOpenImport: () => void;
    onOpenAccounts: () => void;
};

export function AdminPageHeader({ onOpenImport, onOpenAccounts }: AdminPageHeaderProps) {
    return (
        <div className="admin-page-header">
            <h1>Админка</h1>
            <div className="admin-page-actions">
                <button type="button" className="admin-secondary-button" onClick={onOpenAccounts}>
                    Аккаунты
                </button>
                <button type="button" className="admin-primary-button" onClick={onOpenImport}>
                    Импорт расписания
                </button>
            </div>
        </div>
    );
}
