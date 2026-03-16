import { useEffect, useState } from 'react';
import Select, { type MultiValue } from 'react-select';
import { fetchTeachers, fetchClassrooms, fetchGroups } from '../../api/schedule.ts';
import type { Group } from '../../api/types/schedule.ts';
import type { Profile as AccountProfile } from '../../api/types/types.ts';
import './ScheduleFilters.css';

type FilterValues = {
    date: string;
    teacherIds: number[];
    groupIds: number[];
    classrooms: string[];
    subject: string;
};

type Props = {
    date: string;
    teacherIds: number[];
    groupIds: number[];
    classrooms: string[];
    subject: string;
    onChange: (v: FilterValues) => void;
    onSearch: () => void;
};

type TeacherOption = { value: number; label: string };
type GroupOption = { value: number; label: string };
type ClassroomOption = { value: string; label: string };

export function ScheduleFilters({ date, teacherIds, groupIds, classrooms, subject, onChange, onSearch }: Props) {
    const [teachers, setTeachers] = useState<AccountProfile[]>([]);
    const [groups, setGroups] = useState<Group[]>([]);
    const [allClassrooms, setAllClassrooms] = useState<string[]>([]);
    const menuPortalTarget = typeof document !== 'undefined' ? document.body : null;

    const teacherOptions: TeacherOption[] = teachers.map(t => {
        const nameParts = [t.last_name, t.first_name, t.middle_name].filter(Boolean);
        return {
            value: t.id,
            label: nameParts.length ? nameParts.join(' ') : t.email || t.uid,
        };
    });

    const groupOptions: GroupOption[] = groups.map(group => ({ value: group.id, label: group.name }));
    const classroomOptions: ClassroomOption[] = allClassrooms.map(c => ({ value: c, label: c }));

    const selectedTeachers = teacherOptions.filter(option => teacherIds.includes(option.value));
    const selectedGroups = groupOptions.filter(option => groupIds.includes(option.value));
    const selectedClassrooms = classroomOptions.filter(option => classrooms.includes(option.value));

    useEffect(() => {
        fetchTeachers().then(setTeachers).catch(console.error);
        fetchGroups().then(setGroups).catch(console.error);
        fetchClassrooms().then(setAllClassrooms).catch(console.error);
    }, []);

    return (
        <div className="schedule-filters">
            <div className="schedule-filters__field">
                <input
                    className="schedule-filters__input"
                    type="date"
                    value={date}
                    onChange={e => onChange({ date: e.target.value, teacherIds, groupIds, classrooms, subject })}
                />
            </div>

            <div className="schedule-filters__field schedule-filters__field--wide">
                <Select<TeacherOption, true>
                    className="schedule-filter-select"
                    classNamePrefix="schedule-filter-select"
                    placeholder="Преподаватель"
                    options={teacherOptions}
                    value={selectedTeachers}
                    onChange={(options: MultiValue<TeacherOption>) => {
                        onChange({
                            date,
                            teacherIds: options.map(option => option.value),
                            groupIds,
                            classrooms,
                            subject,
                        });
                    }}
                    isMulti
                    isClearable
                    menuPortalTarget={menuPortalTarget}
                    menuPosition="fixed"
                    styles={{ menuPortal: base => ({ ...base, zIndex: 2000 }) }}
                />
            </div>

            <div className="schedule-filters__field schedule-filters__field--wide">
                <Select<GroupOption, true>
                    className="schedule-filter-select"
                    classNamePrefix="schedule-filter-select"
                    placeholder="Группа"
                    options={groupOptions}
                    value={selectedGroups}
                    onChange={(options: MultiValue<GroupOption>) => {
                        onChange({
                            date,
                            teacherIds,
                            groupIds: options.map(option => option.value),
                            classrooms,
                            subject,
                        });
                    }}
                    isMulti
                    isClearable
                    menuPortalTarget={menuPortalTarget}
                    menuPosition="fixed"
                    styles={{ menuPortal: base => ({ ...base, zIndex: 2000 }) }}
                />
            </div>

            <div className="schedule-filters__field">
                <Select<ClassroomOption, true>
                    className="schedule-filter-select"
                    classNamePrefix="schedule-filter-select"
                    placeholder="Аудитория"
                    options={classroomOptions}
                    value={selectedClassrooms}
                    onChange={(options: MultiValue<ClassroomOption>) => {
                        onChange({
                            date,
                            teacherIds,
                            groupIds,
                            classrooms: options.map(option => option.value),
                            subject,
                        });
                    }}
                    isMulti
                    isClearable
                    menuPortalTarget={menuPortalTarget}
                    menuPosition="fixed"
                    styles={{ menuPortal: base => ({ ...base, zIndex: 2000 }) }}
                />
            </div>

            <div className="schedule-filters__field">
                <input
                    className="schedule-filters__input"
                    type="text"
                    placeholder="Предмет"
                    value={subject}
                    onChange={e => onChange({ date, teacherIds, groupIds, classrooms, subject: e.target.value })}
                />
            </div>

            <div className="schedule-filters__action">
                <button className="schedule-filters__submit" type="button" onClick={onSearch}>Найти</button>
            </div>
        </div>
    );
}