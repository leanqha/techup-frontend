// src/pages/AdminPage.tsx
import { useState } from 'react';
import { useAuth } from '../context/useAuth';
import Papa from 'papaparse';
import { parse } from 'date-fns';

type Lesson = {
    id: number;
    group_id: string;
    date: string;
    start_time: string;
    end_time: string;
    subject: string;
    teacher_id: string;
    classroom: string;
};

export function AdminPage() {
    const { profile } = useAuth();
    const [file, setFile] = useState<File | null>(null);
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

        setLoading(true);
        setMessage(null);

        try {
            const text = await file.text();

            // Парсим CSV
            const parsed = Papa.parse(text, { header: true, skipEmptyLines: true }).data as any[];

            const lessons: Lesson[] = [];
            let idCounter = 1;

            parsed.forEach(row => {
                // Преобразуем дату из формата dd.MM.yyyy в yyyy-MM-dd
                const dateParts = row['date'].split('.');
                const dateStr = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;

                const startTime = parse(`${dateStr} ${row['start_time']}`, 'yyyy-MM-dd HH:mm', new Date());
                const endTime = parse(`${dateStr} ${row['end_time']}`, 'yyyy-MM-dd HH:mm', new Date());

                lessons.push({
                    id: idCounter++,
                    group_id: row['group'],
                    date: dateStr,
                    start_time: startTime.toISOString(),
                    end_time: endTime.toISOString(),
                    subject: row['subject'],
                    teacher_id: row['teacher_id'],
                    classroom: row['classroom'],
                });
            });

            // Отправляем JSON на бэк
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
                <input
                    type="file"
                    accept=".csv"
                    onChange={e => setFile(e.target.files?.[0] ?? null)}
                />
            </div>

            <button onClick={handleUpload} disabled={loading}>
                {loading ? 'Загрузка...' : 'Импортировать расписание'}
            </button>

            {message && <p style={{ marginTop: 12 }}>{message}</p>}
        </div>
    );
}