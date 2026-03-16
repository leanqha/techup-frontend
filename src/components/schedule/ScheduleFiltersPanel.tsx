import { useEffect, useState } from 'react';
import { ScheduleFilters } from './ScheduleFilters.tsx';
import { Popup } from '../ui/Popup.tsx';
import { CloseIcon } from '../icons/CloseIcon.tsx';
import { fetchGroups, fetchTeachers } from '../../api/schedule.ts';
import type { Group } from '../../api/types/schedule.ts';
import type { Profile as AccountProfile } from '../../api/types/types.ts';
import './ScheduleFilters.css';

export type ScheduleFilterValues = {
    date: string;
    teacherIds: number[];
    groupIds: number[];
    classrooms: string[];
    subject: string;
};

type Props = {
    defaultGroupId?: number | null;
    onSearch: (filters: ScheduleFilterValues) => void;
};

type ActiveChip = {
    key: string;
    text: string;
    onRemove: () => void;
};

function formatTeacherName(teacher: AccountProfile) {
    const parts = [teacher.last_name, teacher.first_name, teacher.middle_name].filter(Boolean);
    return parts.length ? parts.join(' ') : teacher.email || teacher.uid;
}

export function ScheduleFiltersPanel({ defaultGroupId = null, onSearch }: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const [teachers, setTeachers] = useState<AccountProfile[]>([]);
    const [groups, setGroups] = useState<Group[]>([]);
    const [filters, setFilters] = useState<ScheduleFilterValues>({
        date: '',
        teacherIds: [],
        groupIds: defaultGroupId ? [defaultGroupId] : [],
        classrooms: [],
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
            teacherIds: [],
            groupIds: defaultGroupId ? [defaultGroupId] : [],
            classrooms: [],
            subject: '',
        };
        applyFilters(cleared);
    };

    const activeFilterChips: ActiveChip[] = [];

    if (filters.date) {
        activeFilterChips.push({
            key: 'date',
            text: `Дата: ${filters.date}`,
            onRemove: () => applyFilters({ ...filters, date: '' }),
        });
    }

    filters.teacherIds.forEach(teacherId => {
        const teacher = teachers.find(item => item.id === teacherId);
        activeFilterChips.push({
            key: `teacher-${teacherId}`,
            text: `Преподаватель: ${teacher ? formatTeacherName(teacher) : `ID ${teacherId}`}`,
            onRemove: () => applyFilters({
                ...filters,
                teacherIds: filters.teacherIds.filter(id => id !== teacherId),
            }),
        });
    });

    filters.groupIds.forEach(groupId => {
        const group = groups.find(item => item.id === groupId);
        activeFilterChips.push({
            key: `group-${groupId}`,
            text: `Группа: ${group?.name ?? `ID ${groupId}`}`,
            onRemove: () => applyFilters({
                ...filters,
                groupIds: filters.groupIds.filter(id => id !== groupId),
            }),
        });
    });

    filters.classrooms.forEach(classroom => {
        activeFilterChips.push({
            key: `classroom-${classroom}`,
            text: `Аудитория: ${classroom}`,
            onRemove: () => applyFilters({
                ...filters,
                classrooms: filters.classrooms.filter(item => item !== classroom),
            }),
        });
    });

    if (filters.subject) {
        activeFilterChips.push({
            key: 'subject',
            text: `Предмет: ${filters.subject}`,
            onRemove: () => applyFilters({ ...filters, subject: '' }),
        });
    }

    const activeFiltersCount = activeFilterChips.length;

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
                                onClick={chip.onRemove}
                                aria-label={`Убрать фильтр: ${chip.text}`}
                            >
                                <CloseIcon size={14} />
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
                        teacherIds={filters.teacherIds}
                        groupIds={filters.groupIds}
                        classrooms={filters.classrooms}
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
