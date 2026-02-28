type AdminPageHeaderProps = {
    onOpenImport: () => void;
};

export function AdminPageHeader({ onOpenImport }: AdminPageHeaderProps) {
    return (
        <div className="admin-page-header">
            <h1>Админка</h1>
            <button type="button" className="admin-primary-button" onClick={onOpenImport}>
                Импорт расписания
            </button>
        </div>
    );
}

