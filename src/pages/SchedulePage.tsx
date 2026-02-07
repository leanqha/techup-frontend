import { useEffect, useState } from 'react';
import { useAuth } from '../context/useAuth';
import { fetchLessons, searchLessons } from '../api/schedule';
import {formatTime, formatDate, toDMY} from '../utils/date';
import { ScheduleFilters } from '../components/ScheduleFilters';
import type { Dispatch, SetStateAction } from 'react';

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

/* ================= helpers ================= */

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

/* ================= page ================= */

export function SchedulePage() {
    const { profile } = useAuth();

    const [weekOffset, setWeekOffset] = useState(0);
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /* ===== filters ===== */
    const [filterDate, setFilterDate] = useState('');       // string для input[type=date]
    const [filterTeacherId, setFilterTeacherId] = useState<number | null>(null); // number | null для API
    const [filterClassroom, setFilterClassroom] = useState(''); // string

    /* ===== load week schedule ===== */

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

    /* ===== search ===== */

    const handleSearch = async () => {
        setLoading(true);
        setError(null);

        try {
            const data = await searchLessons({
                date: filterDate || undefined,
                teacherId: filterTeacherId ?? undefined,
                groupId: profile?.group_id,
                classroom: filterClassroom || undefined,
            });

            setLessons(Array.isArray(data) ? data : []);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Ошибка поиска');
            setLessons([]);
        } finally {
            setLoading(false);
        }
    };

    /* ===== early return ===== */

    if (loading) return <p>Загрузка расписания…</p>;
    if (error) return <p style={{ color: 'red' }}>{error}</p>;

    /* ===== grouping ===== */

    const lessonsByDate: Record<string, Lesson[]> = lessons?.length
        ? lessons.reduce<Record<string, Lesson[]>>((acc, lesson) => {
            const date = lesson.date.slice(0, 10);
            if (!acc[date]) acc[date] = [];
            acc[date].push(lesson);
            return acc;
        }, {})
        : {};

    /* ================= render ================= */
    Object.keys(lessonsByDate);
    return (
        <div style={{ padding: 16 }}>
            <h1>Расписание</h1>

            <WeekControls weekOffset={weekOffset} setWeekOffset={setWeekOffset} />

            <ScheduleFilters
                date={filterDate}
                teacherId={filterTeacherId}
                classroom={filterClassroom}
                onChange={({ date, teacherId, classroom }) => {
                    setFilterDate(date);
                    setFilterTeacherId(teacherId);
                    setFilterClassroom(classroom);
                }}
                onSearch={handleSearch}
            />

            {/* ===== placeholder ===== */}
            {(!lessons || lessons.length === 0) && (
                <div style={{ padding: 16, fontStyle: 'italic', color: '#555' }}>
                    Пар нет
                </div>
            )}

            {/* ===== по датам ===== */}
            {Object.entries(lessonsByDate).map(([date, dayLessons]) => (
                <div key={date} style={{ marginBottom: 24 }}>
                    <h3>{toDMY(formatDate(date))}</h3>

                    {Array.isArray(dayLessons) && dayLessons.length > 0 ? (
                        dayLessons.map(lesson => (
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
                                    {formatTime(lesson.start_time)} – {formatTime(lesson.end_time)}
                                </div>

                                <div>Преподаватель: {lesson.teacher}</div>
                            </div>
                        ))
                    ) : (
                        <div style={{ padding: 8, fontStyle: 'italic', color: '#555' }}>
                            Пар нет!
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}

/* ================= components ================= */

function WeekControls({
                          setWeekOffset,
                      }: {
    weekOffset: number;
    setWeekOffset: Dispatch<SetStateAction<number>>;
}) {
    return (
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <button onClick={() => setWeekOffset(v => v - 1)}>← Предыдущая</button>
            <button onClick={() => setWeekOffset(0)}>Сегодня</button>
            <button onClick={() => setWeekOffset(v => v + 1)}>Следующая →</button>
        </div>
    );
}