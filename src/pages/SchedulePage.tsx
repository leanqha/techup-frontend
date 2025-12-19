// src/pages/SchedulePage.tsx
import { useEffect, useState } from 'react';
import { useAuth } from '../context/useAuth';
import { fetchLessons } from '../api/schedule';
import type {Lesson} from '../api/types/schedule';
import { ScheduleList } from '../components/schedule/ScheduleList';
import { addDays, toYMD } from '../utils/date';

export function SchedulePage() {
    const { profile } = useAuth();
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [loading, setLoading] = useState(false);
    const [startDate, setStartDate] = useState(new Date());

    useEffect(() => {
        if (!profile?.group_id) return;

        let cancelled = false;

        const load = async () => {
            try {
                setLoading(true);
                const from = toYMD(startDate);
                const to = toYMD(addDays(startDate, 6));
                const data = await fetchLessons(profile.group_id, from, to);
                if (!cancelled) setLessons(data);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        load();
        return () => { cancelled = true; };
    }, [profile, startDate]);

    return (
        <div style={{ padding: 24 }}>
            <h1>Расписание</h1>

            <div style={{ marginBottom: 16 }}>
                <button onClick={() => setStartDate(addDays(startDate, -7))}>
                    ← Предыдущая неделя
                </button>
                <button onClick={() => setStartDate(addDays(startDate, 7))} style={{ marginLeft: 8 }}>
                    Следующая неделя →
                </button>
            </div>

            {loading ? <p>Загрузка...</p> : <ScheduleList lessons={lessons} />}
        </div>
    );
}