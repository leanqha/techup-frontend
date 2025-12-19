import {type Dispatch, type SetStateAction, useEffect, useState} from 'react';
import { useAuth } from '../context/useAuth.ts';
import { fetchLessons } from '../api/schedule';
import { formatTime } from '../utils/date';

export type Lesson = {
    id: number;
    group_id: number;
    date: string;
    start_time: string;
    end_time: string;
    subject: string;
    teacher: string;
    classroom: string;
};

function getWeekRange(offset: number) {
    const now = new Date();
    const monday = new Date(now);
    monday.setDate(now.getDate() - now.getDay() + 1 + offset * 7);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const toISO = (d: Date) => d.toISOString().slice(0, 10);

    return {
        from: toISO(monday),
        to: toISO(sunday),
    };
}

export function SchedulePage() {
    const { profile } = useAuth();
    const [weekOffset, setWeekOffset] = useState(0);

    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!profile?.group_id) return;

        let cancelled = false;

        const load = async () => {
            setLoading(true);
            setError(null);

            try {
                const { from, to } = getWeekRange(weekOffset);
                const data = await fetchLessons(profile.group_id, from, to);

                if (!cancelled) {
                    setLessons(Array.isArray(data) ? data : []);
                }
            } catch (e: unknown) {
                if (!cancelled) {
                    setError(e instanceof Error ? e.message : 'Ошибка загрузки');
                    setLessons([]);
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        load();

        return () => {
            cancelled = true;
        };
    }, [profile?.group_id, weekOffset]);

    /* ===== РАННИЕ RETURN — КРИТИЧНО ===== */

    if (loading) {
        return <p>Загрузка расписания…</p>;
    }

    if (error) {
        return <p style={{ color: 'red' }}>{error}</p>;
    }

    if (lessons.length === 0) {
        return (
            <div>
                <WeekControls
                    weekOffset={weekOffset}
                    setWeekOffset={setWeekOffset}
                />
                <p>Пар нет</p>
            </div>
        );
    }

    /* ===== ГРУППИРОВКА ПО ДНЯМ ===== */

    const lessonsByDate = lessons.reduce<Record<string, Lesson[]>>(
        (acc, lesson) => {
            const date = lesson.date.slice(0, 10);
            if (!acc[date]) acc[date] = [];
            acc[date].push(lesson);
            return acc;
        },
        {}
    );

    return (
        <div>
            <WeekControls
                weekOffset={weekOffset}
                setWeekOffset={setWeekOffset}
            />

            {Object.entries(lessonsByDate).map(([date, dayLessons]) => (
                <div key={date} style={{ marginBottom: 24 }}>
                    <h3>{date}</h3>

                    {dayLessons.map(lesson => (
                        <div
                            key={lesson.id}
                            style={{
                                padding: 12,
                                borderRadius: 8,
                                border: '1px solid #e5e7eb',
                                marginBottom: 8,
                            }}
                        >
                            <strong>
                                {lesson.subject} ({lesson.classroom})
                            </strong>
                            <div>
                                {formatTime(lesson.start_time)} –{' '}
                                {formatTime(lesson.end_time)}
                            </div>
                            <div>Преподаватель: {lesson.teacher}</div>
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
}

/* ===== КНОПКИ ПЕРЕКЛЮЧЕНИЯ НЕДЕЛЬ ===== */


function WeekControls({
                          setWeekOffset,
                      }: {
    weekOffset: number;
    setWeekOffset: Dispatch<SetStateAction<number>>;
}) {
    return (
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <button onClick={() => setWeekOffset(v => v - 1)}>
                ← Предыдущая
            </button>

            <button onClick={() => setWeekOffset(0)}>
                Сегодня
            </button>

            <button onClick={() => setWeekOffset(v => v + 1)}>
                Следующая →
            </button>
        </div>
    );
}