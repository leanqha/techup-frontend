import './AdminImportForm.css';

type AdminImportFormProps = {
    semesterEnd: string;
    loading: boolean;
    message: string | null;
    onFileChange: (file: File | null) => void;
    onSemesterEndChange: (value: string) => void;
    onSubmit: () => void;
};

export function AdminImportForm({
    semesterEnd,
    loading,
    message,
    onFileChange,
    onSemesterEndChange,
    onSubmit,
}: AdminImportFormProps) {
    return (
        <div className="admin-import-form">
            <div className="admin-import-row">
                <label className="admin-import-label">CSV файл</label>
                <input
                    type="file"
                    accept=".csv"
                    onChange={event => onFileChange(event.target.files?.[0] ?? null)}
                />
            </div>

            <div className="admin-import-row">
                <label className="admin-import-label" htmlFor="semester-end">
                    Дата окончания семестра
                </label>
                <input
                    id="semester-end"
                    type="date"
                    value={semesterEnd}
                    onChange={event => onSemesterEndChange(event.target.value)}
                />
            </div>

            <button type="button" className="admin-primary-button" onClick={onSubmit} disabled={loading}>
                {loading ? 'Загрузка...' : 'Импортировать расписание'}
            </button>

            {message && (
                <p className="admin-import-message" aria-live="polite">
                    {message}
                </p>
            )}
        </div>
    );
}

