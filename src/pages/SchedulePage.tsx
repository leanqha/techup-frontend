import { useEffect, useState } from 'react';
import { useAuth } from '../context/useAuth';
import { fetchLessons, searchLessons } from '../api/schedule';
import { ScheduleFiltersPanel, type ScheduleFilterValues } from '../components/schedule/ScheduleFiltersPanel.tsx';
import { ScheduleDay } from '../components/schedule/ScheduleDay';
import type { Lesson } from '../api/types/schedule';
import type { Dispatch, SetStateAction } from 'react';
import {Loader} from "../components/Loader.tsx";
import './SchedulePage.css';

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

    const handleSearch = async (filters: ScheduleFilterValues) => {
        setLoading(true);
        setError(null);
        try {
            const isEmptyFilters = !filters.date && !filters.teacherId && !filters.classroom && !filters.subject;
            if (isEmptyFilters && profile?.group_id) {
                const { from, to } = getWeekRange(weekOffset);
                const data = await fetchLessons(profile.group_id, from, to);
                setLessons(Array.isArray(data) ? data : []);
                return;
            }

            const data = await searchLessons({
                date: filters.date || undefined,
                teacherId: filters.teacherId ?? undefined,
                groupId: profile?.group_id,
                classroom: filters.classroom || undefined,
                subject: filters.subject || undefined,
            });
            setLessons(Array.isArray(data) ? data : []);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Ошибка поиска');
            setLessons([]);
        } finally {
            setLoading(false);
        }
    };

    const lessonsByDate: Record<string, Lesson[]> = lessons.reduce((acc, lesson) => {
        acc[lesson.date] ??= [];
        acc[lesson.date].push(lesson);
        return acc;
    }, {} as Record<string, Lesson[]>);

    const sortedDates = Object.keys(lessonsByDate).sort();

    return (
        <div style={{ padding: 16, minHeight: '100vh', display: 'flex', flexDirection: 'column', gap: 24 }}>
            <h1 style={{ fontSize: 24, fontWeight: 600, margin: 0 }}>Расписание</h1>

            <WeekControls weekOffset={weekOffset} setWeekOffset={setWeekOffset} />

            <ScheduleFiltersPanel onSearch={handleSearch} />

            {loading && <Loader />}
            {error && <p style={{ color: 'red' }}>{error}</p>}

            {sortedDates.length === 0 && !loading && !error && (
                <div style={{ padding: 16, fontStyle: 'italic', color: '#6B7280' }}>
                    Пар нет
                </div>
            )}

            {sortedDates.map(date => (
                <ScheduleDay key={date} date={date} lessons={lessonsByDate[date]} />
            ))}
        </div>
    );
}

function WeekControls({ setWeekOffset }: { weekOffset: number; setWeekOffset: Dispatch<SetStateAction<number>>; }) {
    return (
        <div className="schedule-page__week-controls">
            <button className="schedule-page__week-button schedule-page__week-button--prev" onClick={() => setWeekOffset(v => v - 1)}>
                <span className="schedule-page__week-arrow" aria-hidden>←</span>
                <span className="schedule-page__week-label">Предыдущая</span>
            </button>
            <button className="schedule-page__week-button schedule-page__week-button--today" onClick={() => setWeekOffset(0)}>
                Сегодня
            </button>
            <button className="schedule-page__week-button schedule-page__week-button--next" onClick={() => setWeekOffset(v => v + 1)}>
                <span className="schedule-page__week-label">Следующая</span>
                <span className="schedule-page__week-arrow" aria-hidden>→</span>
            </button>
        </div>
    );
}