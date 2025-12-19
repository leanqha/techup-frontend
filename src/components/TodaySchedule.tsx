import {useEffect, useState} from 'react';
import {useAuth} from '../context/useAuth';
import type {Lesson} from '../api/types/schedule';
import {fetchLessons} from '../api/schedule';
import {formatTime} from "../utils/date.ts";

export function TodaySchedule() {
    const { profile } = useAuth();
    const [lessons, setLessons] = useState<Lesson[]>([]); // всегда массив
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!profile?.group_id) return;

        let cancelled = false;

        const loadLessons = async () => {
            try {
                if (!cancelled) setLoading(true);

                const today = new Date();
                const yyyy = today.getFullYear();
                const mm = String(today.getMonth() + 1).padStart(2, '0');
                const dd = String(today.getDate()).padStart(2, '0');
                const from = `${yyyy}-${mm}-${dd}`;
                const data = await fetchLessons(profile.group_id, from, from);
                if (!cancelled) setLessons(data || []);
            } catch (err: unknown) {
                if (!cancelled) {
                    setError(err instanceof Error ? err.message : 'Unknown error');
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        loadLessons();

        return () => { cancelled = true; };
    }, [profile]);

    if (!profile?.group_id) return <p>Группа пользователя не указана</p>;
    if (loading) return <p>Загрузка расписания на сегодня...</p>;
    if (error) return <p>Ошибка: {error}</p>;
    if (lessons.length === 0) return <p>Пар нет</p>; // <-- обработка пустой базы

    return (
        <div>
            <h2>Расписание на сегодня</h2>
            <ul style={{ listStyle: 'none', padding: 0 }}>
                {lessons.map(lesson => (
                    <li key={lesson.id} style={{ marginBottom: 12, border: '1px solid #ddd', padding: 10, borderRadius: 8 }}>
                        <div><strong>{lesson.subject}</strong> ({lesson.classroom})</div>
                        <div>
                            {formatTime(lesson.startTime)} - {formatTime(lesson.endTime)}
                        </div>
                        <div>Преподаватель: {lesson.teacher}</div>
                        {lesson.note?.text && <div><strong>Заметка:</strong> {lesson.note.text}</div>}
                    </li>
                ))}
            </ul>
        </div>
    );
}