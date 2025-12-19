import { useEffect, useState } from 'react';
import { useAuth } from '../context/useAuth';
import type {Lesson} from '../api/types/schedule';
import { fetchLessons } from '../api/schedule.ts';

export function TodaySchedule() {
    const { profile } = useAuth();
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!profile?.group_id) return;

        let cancelled = false;

        const loadLessons = async () => {
            try {
                if (!cancelled) setLoading(true);

                const today = new Date();
                const from = today.toISOString().split('T')[0];
                const to = from;
                const data = await fetchLessons(profile.group_id, from, to);

                if (!cancelled) setLessons(data);
            } catch (err: unknown) {
                if (!cancelled) {
                    if (err instanceof Error) {
                        setError(err.message);
                    } else {
                        setError('Unknown error');
                    }
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        loadLessons();

        return () => {
            cancelled = true;
        };
    }, [profile]);

    if (!profile?.group_id) return <p>Группа пользователя не указана</p>;
    if (loading) return <p>Загрузка расписания на сегодня...</p>;
    if (error) return <p>Ошибка: {error}</p>;
    if (lessons.length === 0) return <p>Сегодня пар нет</p>;

    return (
        <div>
            <h2>Расписание на сегодня</h2>
            <ul style={{ listStyle: 'none', padding: 0 }}>
                {lessons.map(lesson => (
                    <li key={lesson.id} style={{ marginBottom: 12, border: '1px solid #ddd', padding: 10, borderRadius: 8 }}>
                        <div>
                            <strong>{lesson.subject}</strong> ({lesson.classroom})
                        </div>
                        <div>
                            {new Date(lesson.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                            {new Date(lesson.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div>Преподаватель: {lesson.teacher}</div>
                        {lesson.note && <div><strong>Заметка:</strong> {lesson.note.text}</div>}
                    </li>
                ))}
            </ul>
        </div>
    );
}