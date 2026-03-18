import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { fetchLessons, searchLessons } from '../api/schedule';
import { ScheduleFiltersPanel, type ScheduleFilterValues } from '../components/schedule/ScheduleFiltersPanel.tsx';
import { ScheduleDay } from '../components/schedule/ScheduleDay';
import type { Lesson } from '../api/types/schedule';
import type { Dispatch, SetStateAction } from 'react';
import { Loader } from '../components/Loader.tsx';
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

function uniqueLessons(items: Lesson[]): Lesson[] {
    const seen = new Set<string>();
    return items.filter(lesson => {
        const key = lesson.id ? `id:${lesson.id}` : `${lesson.date}|${lesson.start_time}|${lesson.end_time}|${lesson.subject}|${lesson.classroom}|${lesson.group.id}|${lesson.teacher.id}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

function filterLessonsByWeek(items: Lesson[], from: string, to: string): Lesson[] {
    return items.filter(lesson => lesson.date >= from && lesson.date <= to);
}

function parseTeacherId(value: string | null): number | null {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function makeTeacherFilters(teacherId: number): ScheduleFilterValues {
    return {
        date: '',
        teacherIds: [teacherId],
        groupIds: [],
        classrooms: [],
        subject: '',
    };
}

export function SchedulePage() {
    const { profile } = useAuth();
    const [searchParams] = useSearchParams();

    const teacherIdFromQuery = useMemo(() => parseTeacherId(searchParams.get('teacherId')), [searchParams]);

    const [weekOffset, setWeekOffset] = useState(0);
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasAutoScrolledToToday, setHasAutoScrolledToToday] = useState(false);
    const [showGroupInLessonCard, setShowGroupInLessonCard] = useState(Boolean(teacherIdFromQuery));
    const [appliedFilters, setAppliedFilters] = useState<ScheduleFilterValues | null>(
        teacherIdFromQuery ? makeTeacherFilters(teacherIdFromQuery) : null
    );
    const dayRefs = useRef<Record<string, HTMLDivElement | null>>({});
    const todayIso = useMemo(() => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }, []);

    const loadByFilters = useCallback(async (filters: ScheduleFilterValues): Promise<Lesson[]> => {
        const { from, to } = getWeekRange(weekOffset);

        const hasNoSearchTerms = !filters.date
            && filters.teacherIds.length === 0
            && filters.classrooms.length === 0
            && !filters.subject;

        if (hasNoSearchTerms && filters.groupIds.length > 0) {
            const groupedData = await Promise.all(filters.groupIds.map(groupId => fetchLessons(groupId, from, to)));
            const merged = uniqueLessons(groupedData.flatMap(items => (Array.isArray(items) ? items : [])));
            return filterLessonsByWeek(merged, from, to);
        }

        const teacherIds = filters.teacherIds.length ? filters.teacherIds : [undefined];
        const groupIds = filters.groupIds.length ? filters.groupIds : [undefined];
        const classrooms = filters.classrooms.length ? filters.classrooms : [undefined];

        const requests = teacherIds.flatMap(teacherId =>
            groupIds.flatMap(groupId =>
                classrooms.map(classroom => searchLessons({
                    date: filters.date || undefined,
                    teacherId,
                    groupId,
                    classroom,
                    subject: filters.subject || undefined,
                }))
            )
        );

        const responses = await Promise.all(requests);
        const merged = uniqueLessons(responses.flatMap(items => (Array.isArray(items) ? items : [])));
        return filterLessonsByWeek(merged, from, to);
    }, [weekOffset]);

    useEffect(() => {
        if (!profile?.group_id && !appliedFilters) return;
        let cancelled = false;

        const load = async () => {
            setLoading(true);
            setError(null);
            try {
                if (appliedFilters) {
                    const data = await loadByFilters(appliedFilters);
                    if (!cancelled) setLessons(data);
                    return;
                }

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
    }, [appliedFilters, loadByFilters, profile?.group_id, weekOffset]);

    useEffect(() => {
        if (teacherIdFromQuery) {
            setAppliedFilters(makeTeacherFilters(teacherIdFromQuery));
            setShowGroupInLessonCard(true);
            return;
        }

        setAppliedFilters(null);
        setShowGroupInLessonCard(false);
    }, [profile?.group_id, teacherIdFromQuery]);

    const handleSearch = (filters: ScheduleFilterValues) => {
        setAppliedFilters(filters);
        setShowGroupInLessonCard(filters.groupIds.length !== 1);
    };

    const lessonsByDate: Record<string, Lesson[]> = lessons.reduce((acc, lesson) => {
        acc[lesson.date] ??= [];
        acc[lesson.date].push(lesson);
        return acc;
    }, {} as Record<string, Lesson[]>);

    const sortedDates = Object.keys(lessonsByDate).sort();

    useEffect(() => {
        if (loading || hasAutoScrolledToToday || weekOffset !== 0 || sortedDates.length === 0) return;

        const todayNode = dayRefs.current[todayIso];
        if (!todayNode) return;

        todayNode.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setHasAutoScrolledToToday(true);
    }, [hasAutoScrolledToToday, loading, sortedDates, todayIso, weekOffset]);

    return (
        <div style={{ padding: 16, minHeight: '100vh', display: 'flex', flexDirection: 'column', gap: 24 }}>
            <h1 style={{ fontSize: 24, fontWeight: 600, margin: 0 }}>Расписание</h1>

            <WeekControls weekOffset={weekOffset} setWeekOffset={setWeekOffset} />

            <ScheduleFiltersPanel
                key={`${String(profile?.group_id ?? 'none')}-${String(teacherIdFromQuery ?? 'none')}`}
                defaultGroupId={teacherIdFromQuery ? null : profile?.group_id ?? null}
                defaultTeacherIds={teacherIdFromQuery ? [teacherIdFromQuery] : []}
                onSearch={handleSearch}
            />

            {loading && <Loader />}
            {error && <p style={{ color: 'red' }}>{error}</p>}

            {sortedDates.length === 0 && !loading && !error && (
                <div style={{ padding: 16, fontStyle: 'italic', color: '#6B7280' }}>
                    Пар нет
                </div>
            )}

            {sortedDates.map(date => (
                <div
                    key={date}
                    ref={node => {
                        dayRefs.current[date] = node;
                    }}
                >
                    <ScheduleDay
                        date={date}
                        lessons={lessonsByDate[date]}
                        showGroupInLessonCard={showGroupInLessonCard}
                    />
                </div>
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