import { useState } from 'react';
import { useAuth } from '../context/useAuth';
import Papa from 'papaparse';
import { addDays, format } from 'date-fns';

type Lesson = {
    id: number;
    group_id: number;
    date: string;
    start_time: string;
    end_time: string;
    subject: string;
    teacher_id: number;
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
        const [h, m] = t.trim().split(':');
        return `${h.padStart(2, '0')}:${m.padStart(2, '0')}:00`;
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
            const text = await file.text();

            const parsed = Papa.parse(text, {
                header: true,
                delimiter: '\t',
                skipEmptyLines: true,
            });

            const rows = (parsed.data as any[]).map(r => {
                const clean: any = {};
                Object.keys(r).forEach(k => {
                    clean[k.trim()] = typeof r[k] === 'string' ? r[k].trim() : r[k];
                });
                return clean;
            });

            const lessons: Lesson[] = [];
            let idCounter = 1;
            const endDate = new Date(semesterEnd);

            rows.forEach(row => {
                if (!row.date) return;

                const [d, m, y] = row.date.split('.');
                let currentDate = new Date(`${y}-${m}-${d}`);

                while (currentDate <= endDate) {
                    lessons.push({
                        id: idCounter++,
                        group_id: Number(row.group),
                        date: format(currentDate, 'yyyy-MM-dd'),
                        start_time: normalizeTime(row.start_time),
                        end_time: normalizeTime(row.end_time),
                        subject: row.subject || '',
                        teacher_id: Number(row.teacher_id || 0),
                        classroom: row.classroom || '',
                    });

                    // двухнедельный цикл
                    currentDate = addDays(currentDate, 14);
                }
            });

            const res = await fetch('/api/v1/admin/schedule/import', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(lessons),
            });

            if (res.status === 201) {
                setMessage('Расписание успешно импортировано');
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