import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchClassrooms, fetchGroups, fetchTeachers } from '../../api/schedule.ts';
import type { Group } from '../../api/types/schedule.ts';
import type { Profile as AccountProfile } from '../../api/types/types.ts';

type ScheduleFilterOptionsState = {
    teachers: AccountProfile[];
    groups: Group[];
    allClassrooms: string[];
    loadingOptions: boolean;
    optionsError: string | null;
    reloadOptions: () => Promise<void>;
};

export function useScheduleFilterOptions(): ScheduleFilterOptionsState {
    const [teachers, setTeachers] = useState<AccountProfile[]>([]);
    const [groups, setGroups] = useState<Group[]>([]);
    const [allClassrooms, setAllClassrooms] = useState<string[]>([]);
    const [loadingOptions, setLoadingOptions] = useState(true);
    const [optionsError, setOptionsError] = useState<string | null>(null);
    const isMountedRef = useRef(true);

    const reloadOptions = useCallback(async () => {
        if (!isMountedRef.current) return;

        setLoadingOptions(true);
        setOptionsError(null);

        try {
            const [teachersData, groupsData, classroomsData] = await Promise.all([
                fetchTeachers(),
                fetchGroups(),
                fetchClassrooms(),
            ]);

            if (!isMountedRef.current) return;
            setTeachers(Array.isArray(teachersData) ? teachersData : []);
            setGroups(Array.isArray(groupsData) ? groupsData : []);
            setAllClassrooms(Array.isArray(classroomsData) ? classroomsData : []);
        } catch (error: unknown) {
            if (!isMountedRef.current) return;
            setTeachers([]);
            setGroups([]);
            setAllClassrooms([]);
            setOptionsError(error instanceof Error ? error.message : 'Не удалось загрузить фильтры');
        } finally {
            if (isMountedRef.current) {
                setLoadingOptions(false);
            }
        }
    }, []);

    useEffect(() => {
        void reloadOptions();

        return () => {
            isMountedRef.current = false;
        };
    }, [reloadOptions]);

    return {
        teachers,
        groups,
        allClassrooms,
        loadingOptions,
        optionsError,
        reloadOptions,
    };
}
