import { useEffect, useState, useMemo } from 'react';

import './HomePage.css';

import { useAuth } from '../context/useAuth';
import { fetchLessons } from '../api/schedule';
import { ScheduleDay } from '../components/schedule/ScheduleDay';
import type { Lesson } from '../api/types/schedule';
import { format } from 'date-fns';
import {Loader} from "../components/Loader.tsx";

export function HomePage() {
    const { profile } = useAuth();

    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [loading, setLoading] = useState(false);

    const todayISO = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);

    useEffect(() => {
        if (!profile?.group_id) return;

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
    }, [profile?.group_id, todayISO]);

    return (
        <div className="home-page">
            <h2 className="home-page__title">Сегодня</h2>

            {loading ? (
                <Loader />
            ) : lessons.length > 0 ? (
                <ScheduleDay date={todayISO} lessons={lessons} />
            ) : (
                <div className="schedule-empty">Пар сегодня нет 🎉</div>
            )}
        </div>
    );
}