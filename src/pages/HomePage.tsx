import { useEffect, useState, useMemo } from 'react';

import './HomePage.css';

import { useAuth } from '../context/useAuth';
import { fetchLessons } from '../api/schedule';
import { ScheduleDay } from '../components/schedule/ScheduleDay';
import { ScheduleDaySkeleton } from '../components/schedule/ScheduleSkeleton';
import type { Lesson } from '../api/types/schedule';
import { format } from 'date-fns';

export function HomePage() {
    const { profile, loading: authLoading } = useAuth();

    const [lessons, setLessons] = useState<Lesson[]>([]);
    // Start in the loading state so the skeleton shows from the first render
    // (through auth-boot) instead of a flash of the empty state.
    const [loading, setLoading] = useState(true);

    const todayISO = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);

    useEffect(() => {
        if (!profile?.group_id) {
            // Keep the skeleton up while auth is still resolving the profile.
            if (!authLoading) setLoading(false);
            return;
        }

        const loadToday = async () => {
            setLoading(true);
            try {
                const data = await fetchLessons(profile.group_id, todayISO, todayISO);
                setLessons(Array.isArray(data) ? data : []);
            } catch (e) {
                console.error(e);
                setLessons([]);
            } finally {
                setLoading(false);
            }
        };

        loadToday();
    }, [authLoading, profile?.group_id, todayISO]);

    const showSkeleton = authLoading || loading;

    return (
        <div className="home-page">
            <h2 className="home-page__title">Сегодня</h2>

            {showSkeleton ? (
                <ScheduleDaySkeleton />
            ) : lessons.length > 0 ? (
                <ScheduleDay date={todayISO} lessons={lessons} />
            ) : (
                <div className="schedule-empty">Пар сегодня нет 🎉</div>
            )}
        </div>
    );
}