import { useState } from 'react';
import { importSPbTISchedule, type ScheduleImportResult } from '../../api/adminSchedule';
import './AdminImportForm.css';

export function AdminScheduleImport() {
    const [group, setGroup] = useState('');
    const [weeks, setWeeks] = useState(2);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<ScheduleImportResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleImport = async () => {
        const trimmed = group.trim();
        if (!trimmed) {
            setError('Укажите номер группы');
            return;
        }

        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const summary = await importSPbTISchedule(trimmed, weeks);
            setResult(summary);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Не удалось загрузить расписание');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-import-form">
            <p className="admin-import-label">
                Загружает расписание группы с сайта СПбГТИ(ТУ) и заменяет занятия группы на
                загруженные недели. Преподаватели сопоставляются с аккаунтами по фамилии и
                инициалам — сначала загрузите список преподавателей, иначе занятия без совпадения
                будут пропущены.
            </p>

            <div className="admin-import-row">
                <label className="admin-import-label" htmlFor="spbti-group">
                    Номер группы
                </label>
                <input
                    id="spbti-group"
                    type="text"
                    value={group}
                    placeholder="например, 1030"
                    onChange={event => setGroup(event.target.value)}
                />
            </div>

            <div className="admin-import-row">
                <label className="admin-import-label" htmlFor="spbti-weeks">
                    Недель с текущей
                </label>
                <input
                    id="spbti-weeks"
                    type="number"
                    min={1}
                    max={8}
                    value={weeks}
                    onChange={event => setWeeks(Number(event.target.value))}
                />
            </div>

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
                    <p>
                        Группа {result.group}, недель: {result.weeks}
                    </p>
                    <p>Найдено занятий: {result.parsed}</p>
                    <p>Загружено: {result.imported}</p>
                    <p>Пропущено (нет преподавателя): {result.skipped_no_teacher}</p>
                    {result.from_date && result.to_date && (
                        <p>
                            Период: {result.from_date} — {result.to_date}
                        </p>
                    )}
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
