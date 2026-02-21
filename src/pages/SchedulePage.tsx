import { useEffect, useState } from 'react';
import { useAuth } from '../context/useAuth';
import { fetchLessons, searchLessons } from '../api/schedule';
import { ScheduleFilters } from '../components/ScheduleFilters';
import { ScheduleDay } from '../components/schedule/ScheduleDay';
import type { Lesson } from '../api/types/schedule';
import type { Dispatch, SetStateAction } from 'react';

function getWeekRange(offset: number) {
    const now = new Date();
    const monday = new Date(now);
    monday.setDate(now.getDate() - now.getDay() + 1 + offset * 7);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const toISO = (d: Date) => d.toISOString().slice(0, 10);
    return { from: toISO(monday), to: toISO(sunday) };
}

export function SchedulePage() {
    const { profile } = useAuth();

    const [weekOffset, setWeekOffset] = useState(0);
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [filterDate, setFilterDate] = useState('');
    const [filterTeacherId, setFilterTeacherId] = useState<number | null>(null);
    const [filterClassroom, setFilterClassroom] = useState('');

    useEffect(() => {
        if (!profile?.group_id) return;
        let cancelled = false;

        const load = async () => {
            setLoading(true);
            setError(null);
            try {
                const { from, to } = getWeekRange(weekOffset);
                const data = await fetchLessons(profile.group_id, from, to);
                if (!cancelled) setLessons(Array.isArray(data) ? data : []);
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
        return () => { cancelled = true; };
    }, [profile?.group_id, weekOffset]);

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

    if (loading) return <p>Загрузка расписания…</p>;
    if (error) return <p style={{ color: 'red' }}>{error}</p>;

    // группируем уроки по дате
    const lessonsByDate: Record<string, Lesson[]> = lessons.reduce((acc, lesson) => {
        acc[lesson.date] ??= [];
        acc[lesson.date].push(lesson);
        return acc;
    }, {} as Record<string, Lesson[]>);

    const sortedDates = Object.keys(lessonsByDate).sort();

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

            {sortedDates.length === 0 ? (
                <div style={{ padding: 16, fontStyle: 'italic', color: '#555' }}>Пар нет</div>
            ) : (
                sortedDates.map(date => (
                    <ScheduleDay key={date} date={date} lessons={lessonsByDate[date]} />
                ))
            )}
        </div>
    );
}

function WeekControls({ setWeekOffset }: { weekOffset: number; setWeekOffset: Dispatch<SetStateAction<number>>; }) {
    return (
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <button onClick={() => setWeekOffset(v => v - 1)}>← Предыдущая</button>
            <button onClick={() => setWeekOffset(0)}>Сегодня</button>
            <button onClick={() => setWeekOffset(v => v + 1)}>Следующая →</button>
        </div>
    );
}