import { useState } from 'react';
import { useAuth } from '../context/useAuth';
import Papa from 'papaparse';
import { addDays, format } from 'date-fns';

export type LessonType = 'lecture' | 'practise' | 'laboratory' | 'other';

export type LessonRequest = {
    group: number;
    teacher_id: number;
    date: string;       // YYYY-MM-DD
    start_time: string; // HH:MM
    end_time: string;   // HH:MM
    subject: string;
    type: LessonType;
    classroom: string;
};

export function AdminPage() {
    const { profile } = useAuth();

    const [file, setFile] = useState<File | null>(null);
    const [semesterEnd, setSemesterEnd] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    if (profile?.role !== 'admin') {
        return <p>У вас нет доступа к админке</p>;
    }

    const normalizeTime = (t: string) => {
        if (!t) return '00:00';
        const [h, m] = t.trim().split(':');
        return `${h.padStart(2, '0')}:${m.padStart(2, '0')}`;
    };

    const readFileText = async (file: File) => {
        const buffer = await file.arrayBuffer();
        try {
            return new TextDecoder('utf-8').decode(buffer);
        } catch {
            return new TextDecoder('windows-1251').decode(buffer);
        }
    };

    const handleUpload = async () => {
        if (!file) {
            setMessage('Выберите CSV файл');
            return;
        }

        if (!semesterEnd) {
            setMessage('Выберите дату окончания семестра');
            return;
        }

        setLoading(true);
        setMessage(null);

        try {
            const text = await readFileText(file);

            const parsed = Papa.parse(text, {
                header: true,
                delimiter: ',',
                newline: '\r\n',
                skipEmptyLines: true,
            });

            const rows = (parsed.data as any[]).map(r => {
                const clean: any = {};
                Object.keys(r).forEach(k => {
                    const key = k.replace(/\ufeff/g, '').trim();
                    clean[key] =
                        typeof r[k] === 'string'
                            ? r[k].replace(/\ufeff/g, '').trim()
                            : r[k];
                });
                return clean;
            });

            if (!rows.length) {
                setMessage('CSV пустой или не распознан');
                setLoading(false);
                return;
            }

            const lessons: LessonRequest[] = [];
            const endDate = new Date(semesterEnd);

            rows.forEach(row => {
                if (!row.date) return;

                const teacherId = Number(row.teacher_id || 0); // оставляем 0, если нет

                const [d, m, y] = row.date.split('.');
                let currentDate = new Date(`${y}-${m}-${d}`);

                while (currentDate <= endDate) {
                    lessons.push({
                        group: Number(row.group),
                        teacher_id: teacherId,
                        date: format(currentDate, 'yyyy-MM-dd'),
                        start_time: normalizeTime(row.start_time),
                        end_time: normalizeTime(row.end_time),
                        subject: row.subject || '—',
                        type: (row.type as LessonType) || 'other',
                        classroom: row.classroom || '—',
                    });

                    currentDate = addDays(currentDate, 14);
                }
            });

            if (!lessons.length) {
                setMessage('Не удалось сформировать занятия');
                setLoading(false);
                return;
            }

            const res = await fetch('/api/v1/admin/schedule/import', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(lessons),
            });

            if (res.status === 201) {
                setMessage(`Импортировано занятий: ${lessons.length}`);
            } else {
                const data = await res.json();
                setMessage(data.error || 'Ошибка импорта');
            }
        } catch (err) {
            console.error(err);
            setMessage('Ошибка обработки CSV');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: 24 }}>
            <h1>Админка</h1>

            <div style={{ marginBottom: 12 }}>
                <input
                    type="file"
                    accept=".csv"
                    onChange={e => setFile(e.target.files?.[0] ?? null)}
                />
            </div>

            <div style={{ marginBottom: 12 }}>
                <label>
                    Дата окончания семестра:{' '}
                    <input
                        type="date"
                        value={semesterEnd}
                        onChange={e => setSemesterEnd(e.target.value)}
                    />
                </label>
            </div>

            <button onClick={handleUpload} disabled={loading}>
                {loading ? 'Загрузка...' : 'Импортировать расписание'}
            </button>

            {message && <p style={{ marginTop: 12 }}>{message}</p>}
        </div>
    );
}