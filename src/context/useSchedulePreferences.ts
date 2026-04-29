import { useCallback, useEffect, useState } from 'react';

type WeekStart = 'saturday' | 'sunday' | 'monday';

type SchedulePreferences = {
    autoScrollToToday: boolean;
    weekStart: WeekStart;
};

const STORAGE_KEY = 'techup.schedule.preferences';

const DEFAULT_PREFERENCES: SchedulePreferences = {
    autoScrollToToday: true,
    weekStart: 'monday',
};

const isWeekStart = (value: unknown): value is WeekStart =>
    value === 'saturday' || value === 'sunday' || value === 'monday';

const normalizePreferences = (value?: Partial<SchedulePreferences> | null): SchedulePreferences => {
    const autoScrollToToday = typeof value?.autoScrollToToday === 'boolean'
        ? value.autoScrollToToday
        : DEFAULT_PREFERENCES.autoScrollToToday;
    const weekStart = isWeekStart(value?.weekStart) ? value.weekStart : DEFAULT_PREFERENCES.weekStart;

    return { autoScrollToToday, weekStart };
};

const loadPreferences = (): SchedulePreferences => {
    if (typeof window === 'undefined') return DEFAULT_PREFERENCES;

    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return DEFAULT_PREFERENCES;
        const parsed = JSON.parse(raw) as Partial<SchedulePreferences>;
        return normalizePreferences(parsed);
    } catch {
        return DEFAULT_PREFERENCES;
    }
};

const savePreferences = (preferences: SchedulePreferences): void => {
    if (typeof window === 'undefined') return;

    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch {
        // Ignore storage errors (private mode, quota exceeded, etc.).
    }
};

export function useSchedulePreferences() {
    const [preferences, setPreferences] = useState<SchedulePreferences>(() => loadPreferences());

    const updatePreferences = useCallback((patch: Partial<SchedulePreferences>) => {
        setPreferences(prev => normalizePreferences({ ...prev, ...patch }));
    }, []);

    useEffect(() => {
        savePreferences(preferences);
    }, [preferences]);

    return { preferences, updatePreferences };
}

export type { SchedulePreferences, WeekStart };

