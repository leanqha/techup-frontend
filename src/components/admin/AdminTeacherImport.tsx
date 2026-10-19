import { useState } from 'react';
import { importTeachers, type TeacherImportResult } from '../../api/adminSchedule';
import './AdminImportForm.css';

export function AdminTeacherImport() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<TeacherImportResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleImport = async () => {
        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const summary = await importTeachers();
            setResult(summary);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Не удалось импортировать преподавателей');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-import-form">
            <p className="admin-import-label">
                Загружает список преподавателей с сайта СПбГТИ(ТУ) и синхронизирует его с базой:
                существующие записи остаются на своих ID, обновляются ФИО, новые преподаватели
                добавляются в конец. Ничего не удаляется.
            </p>

            <button
                type="button"
                className="admin-primary-button"
                onClick={handleImport}
                disabled={loading}
            >
                {loading ? 'Загрузка…' : 'Загрузить с сайта'}
            </button>

            {result && (
                <div className="admin-import-message" aria-live="polite">
                    <p>Найдено на сайте: {result.fetched}</p>
                    <p>Добавлено новых: {result.created}</p>
                    <p>Обновлено: {result.updated}</p>
                    <p>Без изменений: {result.skipped}</p>
                </div>
            )}

            {error && (
                <p className="admin-import-message" aria-live="polite">
                    {error}
                </p>
            )}
        </div>
    );
}
