import { useEffect, useMemo, useState } from 'react';
import { ScheduleFilters } from './ScheduleFilters.tsx';
import { Popup } from '../ui/Popup.tsx';
import { CloseIcon } from '../icons/CloseIcon.tsx';
import { fetchGroups, fetchTeachers } from '../../api/schedule.ts';
import type { Group } from '../../api/types/schedule.ts';
import type { Profile as AccountProfile } from '../../api/types/types.ts';
import './ScheduleFilters.css';

export type ScheduleFilterValues = {
    date: string;
    teacherId: number | null;
    groupId: number | null;
    classroom: string;
    subject: string;
};

type Props = {
    defaultGroupId?: number | null;
    onSearch: (filters: ScheduleFilterValues) => void;
};

type FilterKey = keyof ScheduleFilterValues;

export function ScheduleFiltersPanel({ defaultGroupId = null, onSearch }: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const [teachers, setTeachers] = useState<AccountProfile[]>([]);
    const [groups, setGroups] = useState<Group[]>([]);
    const [filters, setFilters] = useState<ScheduleFilterValues>({
        date: '',
        teacherId: null,
        groupId: defaultGroupId,
        classroom: '',
        subject: '',
    });

    useEffect(() => {
        fetchTeachers().then(setTeachers).catch(console.error);
        fetchGroups().then(setGroups).catch(console.error);
    }, []);

    const applyFilters = (nextFilters: ScheduleFilterValues) => {
        setFilters(nextFilters);
        onSearch(nextFilters);
    };

    const handleSearch = () => {
        onSearch(filters);
        setIsOpen(false);
    };

    const handleReset = () => {
        const cleared = {
            date: '',
            teacherId: null,
            groupId: defaultGroupId,
            classroom: '',
            subject: '',
        };
        applyFilters(cleared);
    };

    const activeFilterChips = useMemo(() => {
        const teacher = teachers.find(item => item.id === filters.teacherId);
        const group = groups.find(item => item.id === filters.groupId);

        return [
            filters.date ? { key: 'date' as FilterKey, text: `Дата: ${filters.date}` } : null,
            filters.teacherId
                ? {
                    key: 'teacherId' as FilterKey,
                    text: `Преподаватель: ${teacher ? [teacher.last_name, teacher.first_name, teacher.middle_name].filter(Boolean).join(' ') : `ID ${filters.teacherId}`}`,
                }
                : null,
            filters.groupId
                ? {
                    key: 'groupId' as FilterKey,
                    text: `Группа: ${group?.name ?? `ID ${filters.groupId}`}`,
                }
                : null,
            filters.classroom ? { key: 'classroom' as FilterKey, text: `Аудитория: ${filters.classroom}` } : null,
            filters.subject ? { key: 'subject' as FilterKey, text: `Предмет: ${filters.subject}` } : null,
        ].filter(Boolean) as Array<{ key: FilterKey; text: string }>;
    }, [filters, groups, teachers]);

    const activeFiltersCount = activeFilterChips.length;

    const handleRemoveFilter = (key: FilterKey) => {
        const nextFilters: ScheduleFilterValues = {
            ...filters,
            [key]: key === 'teacherId' || key === 'groupId' ? null : '',
        };
        applyFilters(nextFilters);
    };

    return (
        <div className="schedule-filters-panel">
            <button className="schedule-filters-panel__toggle" type="button" onClick={() => setIsOpen(true)}>
                Фильтры
                {activeFiltersCount > 0 && (
                    <span className="schedule-filters-panel__toggle-count" aria-label={`Активных фильтров: ${activeFiltersCount}`}>
                        {activeFiltersCount}
                    </span>
                )}
            </button>

            {activeFilterChips.length > 0 && (
                <div className="schedule-filters-panel__chips" aria-label="Активные фильтры">
                    {activeFilterChips.map(chip => (
                        <div key={chip.key} className="schedule-filters-panel__chip">
                            <span>{chip.text}</span>
                            <button
                                type="button"
                                className="schedule-filters-panel__chip-remove"
                                onClick={() => handleRemoveFilter(chip.key)}
                                aria-label={`Убрать фильтр: ${chip.text}`}
                            >
                                ×
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <Popup
                open={isOpen}
                onClose={() => setIsOpen(false)}
                overlayClassName="schedule-filters-popup__overlay"
                contentClassName="schedule-filters-popup"
                ariaLabel="Фильтры расписания"
            >
                <div className="schedule-filters-popup__header">
                    <h2>Фильтры расписания</h2>
                    <button
                        type="button"
                        className="schedule-filters-popup__close"
                        onClick={() => setIsOpen(false)}
                        aria-label="Закрыть окно фильтров"
                    >
                        <CloseIcon />
                    </button>
                </div>

                <div className="schedule-filters-popup__body">
                    <ScheduleFilters
                        date={filters.date}
                        teacherId={filters.teacherId}
                        groupId={filters.groupId}
                        classroom={filters.classroom}
                        subject={filters.subject}
                        onChange={setFilters}
                        onSearch={handleSearch}
                    />
                    <div className="schedule-filters-panel__actions">
                        <button className="schedule-filters-panel__reset" type="button" onClick={handleReset}>
                            Сбросить фильтры
                        </button>
                    </div>
                </div>
            </Popup>
        </div>
    );
}
