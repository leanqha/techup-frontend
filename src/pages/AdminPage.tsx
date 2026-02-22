import { useState } from 'react';
import { useAuth } from '../context/useAuth';
import Papa from 'papaparse';
import { addDays, format } from 'date-fns';

export type LessonType = 'lecture' | 'practice' | 'laboratory' | 'other';

export type Teacher = {
    id: number;
    name: string;
};

export type Group = {
    id: number;
    name: string;
};

export type Lesson = {
    id: number;
    date: string; // YYYY-MM-DD
    start_time: string; // HH:MM
    end_time: string;   // HH:MM
    subject: string;
    type: LessonType;
    classroom: string;
    group: Group;
    teacher: Teacher;
};

type LessonRequest = {
    group: number;
    teacher_id: number;
    date: string;
    start_time: string;
    end_time: string;
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

            let idCounter = 1;
            const endDate = new Date(semesterEnd);

            const lessons: Lesson[] = rows.flatMap(row => {
                if (!row.date || !row.group) return [];

                const [d, m, y] = row.date.split('.');
                let currentDate = new Date(`${y}-${m}-${d}`);
                const lessonType: LessonType =
                    ['lecture', 'practice', 'laboratory'].includes(row.type)
                        ? (row.type as LessonType)
                        : 'other';

                const teacher: Teacher = {
                    id: Number(row.teacher_id || 0),
                    name: row.teacher_name || '—',
                };

                const group: Group = {
                    id: Number(row.group),
                    name: row.group_name || '—',
                };

                const lessonInstances: Lesson[] = [];
                while (currentDate <= endDate) {
                    lessonInstances.push({
                        id: idCounter++,
                        date: format(currentDate, 'yyyy-MM-dd'),
                        start_time: normalizeTime(row.start_time),
                        end_time: normalizeTime(row.end_time),
                        subject: row.subject || '—',
                        type: lessonType,
                        classroom: row.classroom || '—',
                        teacher,
                        group,
                    });

                    currentDate = addDays(currentDate, 14);
                }

                return lessonInstances;
            });

            if (!lessons.length) {
                setMessage('Не удалось сформировать занятия');
                setLoading(false);
                return;
            }

            // Преобразуем в LessonRequest для API
            const lessonRequests: LessonRequest[] = lessons.map(l => ({
                group: l.group.id,
                teacher_id: l.teacher.id,
                date: l.date,
                start_time: l.start_time,
                end_time: l.end_time,
                subject: l.subject,
                type: l.type,
                classroom: l.classroom,
            }));

            const res = await fetch('/api/v1/admin/schedule/import', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(lessonRequests),
            });

            if (res.status === 201) {
                setMessage(`Импортировано занятий: ${lessonRequests.length}`);
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