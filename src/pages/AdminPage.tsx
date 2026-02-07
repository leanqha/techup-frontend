import { useState } from 'react';
import { useAuth } from '../context/useAuth';
import Papa from 'papaparse';
import { addDays, format, parse } from 'date-fns';

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
    const [semesterEnd, setSemesterEnd] = useState<string>('2026-05-31');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    if (profile?.role !== 'admin') {
        return <p>У вас нет доступа к админке</p>;
    }

    const handleUpload = async () => {
        if (!file) {
            setMessage('Выберите файл');
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
            const parsed = Papa.parse(text, { header: true, skipEmptyLines: true }).data as any[];

            const lessons: Lesson[] = [];
            let idCounter = 1;
            const endDate = new Date(semesterEnd);

            parsed.forEach(row => {
                // Преобразуем дату из CSV dd.MM.yyyy → yyyy-MM-dd
                const dateParts = row['date'].split('.');
                let currentDate = new Date(`${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`);

                while (currentDate <= endDate) {
                    // Корректное преобразование времени
                    const [startH, startM] = row['start_time'].split(':').map(Number);
                    const [endH, endM] = row['end_time'].split(':').map(Number);

                    const startTime = new Date(currentDate);
                    startTime.setHours(startH, startM, 0, 0);

                    const endTime = new Date(currentDate);
                    endTime.setHours(endH, endM, 0, 0);

                    lessons.push({
                        id: idCounter++,
                        group_id: Number(row['group']),
                        date: format(currentDate, 'yyyy-MM-dd'),
                        start_time: startTime.toISOString(),
                        end_time: endTime.toISOString(),
                        subject: row['subject'] || '',
                        teacher_id: Number(row['teacher_id'] || 0),
                        classroom: row['classroom'] || '',
                    });

                    // Следующее занятие через 14 дней (двухнедельный цикл)
                    currentDate = addDays(currentDate, 14);
                }
            });

            const res = await fetch('/api/v1/admin/schedule/import', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
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
            setMessage('Ошибка сервера или формата CSV');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: 24 }}>
            <h1>Админка</h1>

            <div style={{ marginBottom: 12 }}>
                <input type="file" accept=".csv" onChange={e => setFile(e.target.files?.[0] ?? null)} />
            </div>

            <div style={{ marginBottom: 12 }}>
                <label>
                    Дата окончания семестра:{' '}
                    <input type="date" value={semesterEnd} onChange={e => setSemesterEnd(e.target.value)} />
                </label>
            </div>

            <button onClick={handleUpload} disabled={loading}>
                {loading ? 'Загрузка...' : 'Импортировать расписание'}
            </button>

            {message && <p style={{ marginTop: 12 }}>{message}</p>}
        </div>
    );
}