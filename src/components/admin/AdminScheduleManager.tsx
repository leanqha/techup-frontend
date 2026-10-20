import { useEffect, useMemo, useState } from 'react';
import {
    createFaculty,
    createGroup,
    createGroupSubject,
    createLesson,
    createLessonType,
    createSubject,
    deleteFaculty,
    deleteGroup,
    deleteGroupSubject,
    deleteLesson,
    deleteLessonType,
    deleteSubject,
    listFaculties,
    listGroups,
    listGroupSubjects,
    listLessonTypes,
    listSubjects,
    searchAdminLessons,
    updateFaculty,
    updateGroup,
    updateGroupSubject,
    updateLesson,
    updateLessonType,
    updateSubject,
    type Faculty,
    type GroupPayload,
    type GroupRecord,
    type GroupSubjectPayload,
    type GroupSubjectRecord,
    type LessonPayload,
    type LessonRecord,
    type LessonSearchFilters,
    type LessonTypeRecord,
    type Subject,
} from '../../api/adminSchedule';
import { fetchRooms, fetchTeachers, type Room } from '../../api/schedule';
import type { Profile as AccountProfile } from '../../api/types/types';
import { AdminModal } from './AdminModal';
import './AdminScheduleManager.css';

type TabKey = 'faculties' | 'groups' | 'subjects' | 'lessonTypes' | 'groupSubjects' | 'lessons';

const DEFAULT_TYPE_COLOR = '#2563eb';

function formatTeacherName(t: AccountProfile): string {
    const parts = [t.last_name, t.first_name, t.middle_name].filter(Boolean);
    return parts.length ? parts.join(' ') : t.email || `#${t.id}`;
}

function formatRoomName(r: Room): string {
    return r.title ? `${r.name} — ${r.title}` : r.name;
}

type GroupFormState = {
    name: string;
    course: string;
    degree: string;
    facultyID: string;
    yearStart: string;
    specialization: string;
    isActive: boolean;
};

type LessonFormState = {
    date: string;
    start_time: string;
    end_time: string;
    subject: string;
    type: string;
    room_id: string;
    group: string;
    teacher_id: string;
};

type GroupSubjectFormState = {
    group_id: string;
    subject_id: string;
    semester: string;
    teacher_id: string;
};

const emptyGroupSubjectForm: GroupSubjectFormState = {
    group_id: '',
    subject_id: '',
    semester: '1',
    teacher_id: '',
};

const emptyGroupForm: GroupFormState = {
    name: '',
    course: '1',
    degree: 'бакалавриат',
    facultyID: '',
    yearStart: String(new Date().getFullYear()),
    specialization: '',
    isActive: true,
};

const emptyLessonForm: LessonFormState = {
    date: '',
    start_time: '09:00',
    end_time: '10:30',
    subject: '',
    type: '',
    room_id: '',
    group: '',
    teacher_id: '',
};

const emptyLessonFilters: LessonSearchFilters = {
    date: '',
    groupId: undefined,
    teacherId: undefined,
    subject: '',
    classroom: '',
};

export function AdminScheduleManager() {
    const [tab, setTab] = useState<TabKey>('faculties');

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    const [faculties, setFaculties] = useState<Faculty[]>([]);
    const [facultySearch, setFacultySearch] = useState('');
    const [facultyFormName, setFacultyFormName] = useState('');
    const [editingFaculty, setEditingFaculty] = useState<Faculty | null>(null);

    const [groups, setGroups] = useState<GroupRecord[]>([]);
    const [groupSearch, setGroupSearch] = useState('');
    const [groupFacultyFilter, setGroupFacultyFilter] = useState('');
    const [groupForm, setGroupForm] = useState<GroupFormState>(emptyGroupForm);
    const [editingGroup, setEditingGroup] = useState<GroupRecord | null>(null);

    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [subjectSearch, setSubjectSearch] = useState('');
    const [subjectFormName, setSubjectFormName] = useState('');
    const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
    const [subjectModalOpen, setSubjectModalOpen] = useState(false);

    const [lessonTypes, setLessonTypes] = useState<LessonTypeRecord[]>([]);
    const [lessonTypeSearch, setLessonTypeSearch] = useState('');
    const [lessonTypeForm, setLessonTypeForm] = useState({ name: '', color: DEFAULT_TYPE_COLOR });
    const [editingLessonType, setEditingLessonType] = useState<LessonTypeRecord | null>(null);
    const [lessonTypeModalOpen, setLessonTypeModalOpen] = useState(false);

    const [groupSubjects, setGroupSubjects] = useState<GroupSubjectRecord[]>([]);
    const [gsGroupFilter, setGsGroupFilter] = useState('');
    const [gsSemesterFilter, setGsSemesterFilter] = useState('');
    const [groupSubjectForm, setGroupSubjectForm] = useState<GroupSubjectFormState>(emptyGroupSubjectForm);
    const [editingGroupSubject, setEditingGroupSubject] = useState<GroupSubjectRecord | null>(null);
    const [groupSubjectModalOpen, setGroupSubjectModalOpen] = useState(false);

    const [lessons, setLessons] = useState<LessonRecord[]>([]);
    const [lessonForm, setLessonForm] = useState<LessonFormState>(emptyLessonForm);
    const [editingLesson, setEditingLesson] = useState<LessonRecord | null>(null);
    const [lessonFilters, setLessonFilters] = useState<LessonSearchFilters>(emptyLessonFilters);

    const [teachers, setTeachers] = useState<AccountProfile[]>([]);
    const [rooms, setRooms] = useState<Room[]>([]);

    const [facultyModalOpen, setFacultyModalOpen] = useState(false);
    const [groupModalOpen, setGroupModalOpen] = useState(false);
    const [lessonModalOpen, setLessonModalOpen] = useState(false);

    const facultyNames = useMemo(() => {
        return new Map(faculties.map(item => [item.id, item.name]));
    }, [faculties]);

    const teacherNames = useMemo(() => {
        return new Map(teachers.map(item => [item.id, formatTeacherName(item)]));
    }, [teachers]);

    const visibleFaculties = useMemo(() => {
        const q = facultySearch.trim().toLowerCase();
        if (!q) return faculties;
        return faculties.filter(item => item.name.toLowerCase().includes(q));
    }, [facultySearch, faculties]);

    const visibleGroups = useMemo(() => {
        const q = groupSearch.trim().toLowerCase();

        return groups.filter(item => {
            const matchesText = !q || item.name.toLowerCase().includes(q);
            const matchesFaculty = !groupFacultyFilter || String(item.facultyID) === groupFacultyFilter;
            return matchesText && matchesFaculty;
        });
    }, [groupFacultyFilter, groupSearch, groups]);

    const visibleSubjects = useMemo(() => {
        const q = subjectSearch.trim().toLowerCase();
        if (!q) return subjects;
        return subjects.filter(item => item.name.toLowerCase().includes(q));
    }, [subjectSearch, subjects]);

    const visibleLessonTypes = useMemo(() => {
        const q = lessonTypeSearch.trim().toLowerCase();
        if (!q) return lessonTypes;
        return lessonTypes.filter(item => item.name.toLowerCase().includes(q));
    }, [lessonTypeSearch, lessonTypes]);

    const selectedPlanGroup = useMemo(
        () => groups.find(group => String(group.id) === gsGroupFilter) ?? null,
        [groups, gsGroupFilter],
    );

    // Semesters offered in the filter are scoped to the chosen group's plan.
    const groupSubjectSemesters = useMemo(() => {
        const scoped = groupSubjects.filter(item => String(item.group_id) === gsGroupFilter);
        const unique = new Set(scoped.map(item => item.semester));
        return Array.from(unique).sort((a, b) => a - b);
    }, [groupSubjects, gsGroupFilter]);

    // The plan is shown per group, so entries are filtered to the selected group
    // (and, optionally, a single semester within it).
    const visibleGroupSubjects = useMemo(() => {
        if (!gsGroupFilter) return [];
        return groupSubjects.filter(item => {
            const matchesGroup = String(item.group_id) === gsGroupFilter;
            const matchesSemester = !gsSemesterFilter || String(item.semester) === gsSemesterFilter;
            return matchesGroup && matchesSemester;
        });
    }, [groupSubjects, gsGroupFilter, gsSemesterFilter]);

    // Switching groups drops a semester filter that may not exist in the new one.
    const handleSelectPlanGroup = (groupId: string) => {
        setGsGroupFilter(groupId);
        setGsSemesterFilter('');
    };

    const runAction = async (action: () => Promise<void>) => {
        setLoading(true);
        setError(null);
        setMessage(null);

        try {
            await action();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ошибка запроса');
        } finally {
            setLoading(false);
        }
    };

    const loadFacultiesData = async () => {
        const data = await listFaculties();
        setFaculties(data);
    };

    const loadGroupsData = async () => {
        const data = await listGroups();
        setGroups(data);
    };

    const loadSubjectsData = async () => {
        const data = await listSubjects();
        setSubjects(data);
    };

    const loadLessonTypesData = async () => {
        const data = await listLessonTypes();
        setLessonTypes(data);
    };

    const loadGroupSubjectsData = async () => {
        const data = await listGroupSubjects();
        setGroupSubjects(data);
    };

    const loadLessonsData = async (filters: LessonSearchFilters = lessonFilters) => {
        const data = await searchAdminLessons(filters);
        setLessons(data);
    };

    const loadTeachersData = async () => {
        const data = await fetchTeachers();
        setTeachers(Array.isArray(data) ? data : []);
    };

    const loadRoomsData = async () => {
        const data = await fetchRooms();
        setRooms(Array.isArray(data) ? data : []);
    };

    useEffect(() => {
        void runAction(async () => {
            await Promise.all([
                loadFacultiesData(),
                loadGroupsData(),
                loadSubjectsData(),
                loadLessonTypesData(),
                loadGroupSubjectsData(),
                loadTeachersData(),
                loadRoomsData(),
            ]);
            const initialLessons = await searchAdminLessons(emptyLessonFilters);
            setLessons(initialLessons);
        });
    }, []);

    const openCreateFaculty = () => {
        setEditingFaculty(null);
        setFacultyFormName('');
        setFacultyModalOpen(true);
    };

    const openEditFaculty = (faculty: Faculty) => {
        setEditingFaculty(faculty);
        setFacultyFormName(faculty.name);
        setFacultyModalOpen(true);
    };

    const closeFacultyModal = () => {
        setFacultyModalOpen(false);
        setEditingFaculty(null);
        setFacultyFormName('');
    };

    const handleSaveFaculty = async () => {
        const name = facultyFormName.trim();
        if (!name) {
            setError('Введите название факультета');
            return;
        }

        setSaving(true);
        setError(null);
        setMessage(null);

        try {
            if (editingFaculty) {
                await updateFaculty(editingFaculty.id, { id: editingFaculty.id, name });
                setMessage('Факультет обновлен');
            } else {
                await createFaculty({ name });
                setMessage('Факультет создан');
            }

            await loadFacultiesData();
            closeFacultyModal();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ошибка запроса');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteFaculty = async (faculty: Faculty) => {
        if (!window.confirm(`Удалить факультет "${faculty.name}"?`)) return;

        setDeletingId(faculty.id);
        setError(null);
        setMessage(null);

        try {
            await deleteFaculty(faculty.id);
            await loadFacultiesData();
            setMessage('Факультет удален');
            if (editingFaculty?.id === faculty.id) closeFacultyModal();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ошибка запроса');
        } finally {
            setDeletingId(null);
        }
    };

    const openCreateGroup = () => {
        setEditingGroup(null);
        setGroupForm(emptyGroupForm);
        setGroupModalOpen(true);
    };

    const openEditGroup = (group: GroupRecord) => {
        setEditingGroup(group);
        setGroupForm({
            name: group.name,
            course: String(group.course),
            degree: group.degree,
            facultyID: String(group.facultyID),
            yearStart: String(group.yearStart),
            specialization: group.specialization,
            isActive: group.isActive,
        });
        setGroupModalOpen(true);
    };

    const closeGroupModal = () => {
        setGroupModalOpen(false);
        setEditingGroup(null);
        setGroupForm(emptyGroupForm);
    };

    const toGroupPayload = (): GroupPayload => ({
        name: groupForm.name.trim(),
        course: Number(groupForm.course),
        degree: groupForm.degree.trim(),
        facultyID: Number(groupForm.facultyID),
        yearStart: Number(groupForm.yearStart),
        specialization: groupForm.specialization.trim(),
        isActive: groupForm.isActive,
    });

    const handleSaveGroup = async () => {
        if (!groupForm.name.trim()) {
            setError('Введите название группы');
            return;
        }

        if (!groupForm.facultyID) {
            setError('Выберите факультет');
            return;
        }

        setSaving(true);
        setError(null);
        setMessage(null);

        try {
            const payload = toGroupPayload();

            if (editingGroup) {
                await updateGroup(editingGroup.id, { id: editingGroup.id, ...payload });
                setMessage('Группа обновлена');
            } else {
                await createGroup(payload);
                setMessage('Группа создана');
            }

            await loadGroupsData();
            closeGroupModal();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ошибка запроса');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteGroup = async (group: GroupRecord) => {
        if (!window.confirm(`Удалить группу "${group.name}"?`)) return;

        setDeletingId(group.id);
        setError(null);
        setMessage(null);

        try {
            await deleteGroup(group.id);
            await loadGroupsData();
            setMessage('Группа удалена');
            if (editingGroup?.id === group.id) closeGroupModal();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ошибка запроса');
        } finally {
            setDeletingId(null);
        }
    };

    const openCreateSubject = () => {
        setEditingSubject(null);
        setSubjectFormName('');
        setSubjectModalOpen(true);
    };

    const openEditSubject = (subject: Subject) => {
        setEditingSubject(subject);
        setSubjectFormName(subject.name);
        setSubjectModalOpen(true);
    };

    const closeSubjectModal = () => {
        setSubjectModalOpen(false);
        setEditingSubject(null);
        setSubjectFormName('');
    };

    const handleSaveSubject = async () => {
        const name = subjectFormName.trim();
        if (!name) {
            setError('Введите название предмета');
            return;
        }

        setSaving(true);
        setError(null);
        setMessage(null);

        try {
            if (editingSubject) {
                await updateSubject(editingSubject.id, { name });
                setMessage('Предмет обновлён');
            } else {
                await createSubject({ name });
                setMessage('Предмет создан');
            }

            await loadSubjectsData();
            closeSubjectModal();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ошибка запроса');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteSubject = async (subject: Subject) => {
        if (!window.confirm(`Удалить предмет "${subject.name}"?`)) return;

        setDeletingId(subject.id);
        setError(null);
        setMessage(null);

        try {
            await deleteSubject(subject.id);
            await loadSubjectsData();
            setMessage('Предмет удалён');
            if (editingSubject?.id === subject.id) closeSubjectModal();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ошибка запроса');
        } finally {
            setDeletingId(null);
        }
    };

    const openCreateLessonType = () => {
        setEditingLessonType(null);
        setLessonTypeForm({ name: '', color: DEFAULT_TYPE_COLOR });
        setLessonTypeModalOpen(true);
    };

    const openEditLessonType = (lessonType: LessonTypeRecord) => {
        setEditingLessonType(lessonType);
        setLessonTypeForm({ name: lessonType.name, color: lessonType.color || DEFAULT_TYPE_COLOR });
        setLessonTypeModalOpen(true);
    };

    const closeLessonTypeModal = () => {
        setLessonTypeModalOpen(false);
        setEditingLessonType(null);
        setLessonTypeForm({ name: '', color: DEFAULT_TYPE_COLOR });
    };

    const handleSaveLessonType = async () => {
        const name = lessonTypeForm.name.trim();
        if (!name) {
            setError('Введите название типа занятия');
            return;
        }

        setSaving(true);
        setError(null);
        setMessage(null);

        try {
            const payload = { name, color: lessonTypeForm.color };
            if (editingLessonType) {
                await updateLessonType(editingLessonType.id, payload);
                setMessage('Тип занятия обновлён');
            } else {
                await createLessonType(payload);
                setMessage('Тип занятия создан');
            }

            await loadLessonTypesData();
            closeLessonTypeModal();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ошибка запроса');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteLessonType = async (lessonType: LessonTypeRecord) => {
        if (!window.confirm(`Удалить тип занятия "${lessonType.name}"?`)) return;

        setDeletingId(lessonType.id);
        setError(null);
        setMessage(null);

        try {
            await deleteLessonType(lessonType.id);
            await loadLessonTypesData();
            setMessage('Тип занятия удалён');
            if (editingLessonType?.id === lessonType.id) closeLessonTypeModal();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ошибка запроса');
        } finally {
            setDeletingId(null);
        }
    };

    const openCreateGroupSubject = () => {
        setEditingGroupSubject(null);
        setGroupSubjectForm({
            ...emptyGroupSubjectForm,
            group_id: gsGroupFilter || '',
            semester: gsSemesterFilter || emptyGroupSubjectForm.semester,
        });
        setGroupSubjectModalOpen(true);
    };

    const openEditGroupSubject = (item: GroupSubjectRecord) => {
        setEditingGroupSubject(item);
        setGroupSubjectForm({
            group_id: String(item.group_id),
            subject_id: String(item.subject_id),
            semester: String(item.semester),
            teacher_id: item.teacher_id ? String(item.teacher_id) : '',
        });
        setGroupSubjectModalOpen(true);
    };

    const closeGroupSubjectModal = () => {
        setGroupSubjectModalOpen(false);
        setEditingGroupSubject(null);
        setGroupSubjectForm(emptyGroupSubjectForm);
    };

    const toGroupSubjectPayload = (): GroupSubjectPayload => ({
        group_id: Number(groupSubjectForm.group_id),
        subject_id: Number(groupSubjectForm.subject_id),
        semester: Number(groupSubjectForm.semester),
        teacher_id: groupSubjectForm.teacher_id ? Number(groupSubjectForm.teacher_id) : null,
    });

    const handleSaveGroupSubject = async () => {
        if (!groupSubjectForm.group_id) {
            setError('Выберите группу');
            return;
        }
        if (!groupSubjectForm.subject_id) {
            setError('Выберите предмет');
            return;
        }

        const semester = Number(groupSubjectForm.semester);
        if (!Number.isInteger(semester) || semester < 1) {
            setError('Укажите семестр (целое положительное число)');
            return;
        }

        setSaving(true);
        setError(null);
        setMessage(null);

        try {
            const payload = toGroupSubjectPayload();
            if (editingGroupSubject) {
                await updateGroupSubject(editingGroupSubject.id, payload);
                setMessage('Предмет учебного плана обновлён');
            } else {
                await createGroupSubject(payload);
                setMessage('Предмет добавлен в учебный план');
            }

            await loadGroupSubjectsData();
            closeGroupSubjectModal();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ошибка запроса');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteGroupSubject = async (item: GroupSubjectRecord) => {
        if (!window.confirm(`Убрать «${item.subject_name}» из плана группы ${item.group_name} (семестр ${item.semester})?`)) {
            return;
        }

        setDeletingId(item.id);
        setError(null);
        setMessage(null);

        try {
            await deleteGroupSubject(item.id);
            await loadGroupSubjectsData();
            setMessage('Предмет удалён из учебного плана');
            if (editingGroupSubject?.id === item.id) closeGroupSubjectModal();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ошибка запроса');
        } finally {
            setDeletingId(null);
        }
    };

    const openCreateLesson = () => {
        setEditingLesson(null);
        setLessonForm(emptyLessonForm);
        setLessonModalOpen(true);
    };

    const openEditLesson = (lesson: LessonRecord) => {
        setEditingLesson(lesson);
        setLessonForm({
            date: lesson.date,
            start_time: lesson.start_time,
            end_time: lesson.end_time,
            subject: lesson.subject,
            type: lesson.type,
            room_id: lesson.room_id ? String(lesson.room_id) : '',
            group: String(lesson.group),
            teacher_id: lesson.teacher_id ? String(lesson.teacher_id) : '',
        });
        setLessonModalOpen(true);
    };

    const closeLessonModal = () => {
        setLessonModalOpen(false);
        setEditingLesson(null);
        setLessonForm(emptyLessonForm);
    };

    const toLessonPayload = (): LessonPayload => {
        const roomId = lessonForm.room_id ? Number(lessonForm.room_id) : null;
        const room = rooms.find(item => item.id === roomId);
        return {
            date: lessonForm.date,
            start_time: lessonForm.start_time,
            end_time: lessonForm.end_time,
            subject: lessonForm.subject.trim(),
            type: lessonForm.type.trim(),
            room_id: roomId,
            classroom: room ? room.name : '',
            group: Number(lessonForm.group),
            teacher_id: lessonForm.teacher_id ? Number(lessonForm.teacher_id) : null,
        };
    };

    const handleSaveLesson = async () => {
        if (!lessonForm.group) {
            setError('Выберите группу');
            return;
        }

        if (!lessonForm.date || !lessonForm.subject.trim()) {
            setError('Заполните дату и предмет');
            return;
        }

        if (!lessonForm.type.trim()) {
            setError('Выберите тип занятия');
            return;
        }

        if (!lessonForm.room_id) {
            setError('Выберите аудиторию');
            return;
        }

        setSaving(true);
        setError(null);
        setMessage(null);

        try {
            const payload = toLessonPayload();

            if (editingLesson) {
                await updateLesson(editingLesson.id, payload);
                setMessage('Занятие обновлено');
            } else {
                await createLesson(payload);
                setMessage('Занятие создано');
            }

            await loadLessonsData();
            closeLessonModal();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ошибка запроса');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteLesson = async (lesson: LessonRecord) => {
        if (!window.confirm(`Удалить занятие "${lesson.subject}"?`)) return;

        setDeletingId(lesson.id);
        setError(null);
        setMessage(null);

        try {
            await deleteLesson(lesson.id);
            await loadLessonsData();
            setMessage('Занятие удалено');
            if (editingLesson?.id === lesson.id) closeLessonModal();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ошибка запроса');
        } finally {
            setDeletingId(null);
        }
    };

    const handleSearchLessons = () => {
        void runAction(async () => {
            await loadLessonsData(lessonFilters);
            setMessage('Список занятий обновлен');
        });
    };

    const handleResetLessonFilters = () => {
        setLessonFilters(emptyLessonFilters);
        void runAction(async () => {
            await loadLessonsData(emptyLessonFilters);
        });
    };

    return (
        <section className="admin-section admin-schedule-manager">
            <div className="admin-tabs" role="tablist" aria-label="Разделы редактора расписания">
                <button
                    type="button"
                    className={`admin-tab ${tab === 'faculties' ? 'active' : ''}`}
                    onClick={() => setTab('faculties')}
                >
                    Факультеты
                </button>
                <button
                    type="button"
                    className={`admin-tab ${tab === 'groups' ? 'active' : ''}`}
                    onClick={() => setTab('groups')}
                >
                    Группы
                </button>
                <button
                    type="button"
                    className={`admin-tab ${tab === 'subjects' ? 'active' : ''}`}
                    onClick={() => setTab('subjects')}
                >
                    Предметы
                </button>
                <button
                    type="button"
                    className={`admin-tab ${tab === 'lessonTypes' ? 'active' : ''}`}
                    onClick={() => setTab('lessonTypes')}
                >
                    Типы занятий
                </button>
                <button
                    type="button"
                    className={`admin-tab ${tab === 'groupSubjects' ? 'active' : ''}`}
                    onClick={() => setTab('groupSubjects')}
                >
                    Учебный план
                </button>
                <button
                    type="button"
                    className={`admin-tab ${tab === 'lessons' ? 'active' : ''}`}
                    onClick={() => setTab('lessons')}
                >
                    Занятия
                </button>
            </div>

            {loading && <p className="admin-section-status">Загрузка...</p>}
            {error && <p className="admin-section-error">{error}</p>}
            {message && <p className="admin-section-message">{message}</p>}

            {tab === 'faculties' && (
                <div className="admin-crud-panel">
                    <div className="admin-accounts-filters">
                        <label className="admin-field">
                            Поиск факультета
                            <input
                                type="text"
                                value={facultySearch}
                                onChange={event => setFacultySearch(event.target.value)}
                                placeholder="Название"
                            />
                        </label>
                        <div className="admin-filters-actions">
                            <button
                                type="button"
                                className="admin-secondary-button"
                                onClick={() => void runAction(loadFacultiesData)}
                                disabled={loading}
                            >
                                Обновить список
                            </button>
                            <button
                                type="button"
                                className="admin-primary-button"
                                onClick={openCreateFaculty}
                            >
                                Добавить факультет
                            </button>
                        </div>
                    </div>

                    <div className="admin-schedule-table">
                        <div className="admin-schedule-header admin-schedule-header--faculties">
                            <span>ID</span>
                            <span>Название</span>
                            <span>Действия</span>
                        </div>
                        {visibleFaculties.map(faculty => (
                            <div key={faculty.id} className="admin-schedule-row admin-schedule-row--faculties">
                                <span>{faculty.id}</span>
                                <span>{faculty.name}</span>
                                <span className="admin-accounts-actions">
                                    <button
                                        type="button"
                                        className="admin-secondary-button"
                                        onClick={() => openEditFaculty(faculty)}
                                    >
                                        Изменить
                                    </button>
                                    <button
                                        type="button"
                                        className="admin-danger-button"
                                        onClick={() => void handleDeleteFaculty(faculty)}
                                        disabled={deletingId === faculty.id}
                                    >
                                        Удалить
                                    </button>
                                </span>
                            </div>
                        ))}
                        {!visibleFaculties.length && !loading && (
                            <p className="admin-section-status">Факультеты не найдены</p>
                        )}
                    </div>
                </div>
            )}

            {tab === 'groups' && (
                <div className="admin-crud-panel">
                    <div className="admin-accounts-filters">
                        <label className="admin-field">
                            Поиск по названию
                            <input
                                type="text"
                                value={groupSearch}
                                onChange={event => setGroupSearch(event.target.value)}
                                placeholder="Группа"
                            />
                        </label>
                        <label className="admin-field">
                            Факультет
                            <select
                                value={groupFacultyFilter}
                                onChange={event => setGroupFacultyFilter(event.target.value)}
                            >
                                <option value="">Все</option>
                                {faculties.map(faculty => (
                                    <option key={faculty.id} value={faculty.id}>
                                        {faculty.name}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <div className="admin-filters-actions">
                            <button
                                type="button"
                                className="admin-secondary-button"
                                onClick={() => void runAction(loadGroupsData)}
                                disabled={loading}
                            >
                                Обновить список
                            </button>
                            <button type="button" className="admin-primary-button" onClick={openCreateGroup}>
                                Добавить группу
                            </button>
                        </div>
                    </div>

                    <div className="admin-schedule-table">
                        <div className="admin-schedule-header admin-schedule-header--groups">
                            <span>Название</span>
                            <span>Факультет</span>
                            <span>Курс</span>
                            <span>Уровень</span>
                            <span>Год</span>
                            <span>Активна</span>
                            <span>Действия</span>
                        </div>
                        {visibleGroups.map(group => (
                            <div key={group.id} className="admin-schedule-row admin-schedule-row--groups">
                                <span>{group.name}</span>
                                <span>{facultyNames.get(group.facultyID) ?? `#${group.facultyID}`}</span>
                                <span>{group.course}</span>
                                <span>{group.degree || '—'}</span>
                                <span>{group.yearStart || '—'}</span>
                                <span>{group.isActive ? 'Да' : 'Нет'}</span>
                                <span className="admin-accounts-actions">
                                    <button
                                        type="button"
                                        className="admin-secondary-button"
                                        onClick={() => openEditGroup(group)}
                                    >
                                        Изменить
                                    </button>
                                    <button
                                        type="button"
                                        className="admin-danger-button"
                                        onClick={() => void handleDeleteGroup(group)}
                                        disabled={deletingId === group.id}
                                    >
                                        Удалить
                                    </button>
                                </span>
                            </div>
                        ))}
                        {!visibleGroups.length && !loading && (
                            <p className="admin-section-status">Группы не найдены</p>
                        )}
                    </div>
                </div>
            )}

            {tab === 'subjects' && (
                <div className="admin-crud-panel">
                    <div className="admin-accounts-filters">
                        <label className="admin-field">
                            Поиск предмета
                            <input
                                type="text"
                                value={subjectSearch}
                                onChange={event => setSubjectSearch(event.target.value)}
                                placeholder="Название"
                            />
                        </label>
                        <div className="admin-filters-actions">
                            <button
                                type="button"
                                className="admin-secondary-button"
                                onClick={() => void runAction(loadSubjectsData)}
                                disabled={loading}
                            >
                                Обновить список
                            </button>
                            <button
                                type="button"
                                className="admin-primary-button"
                                onClick={openCreateSubject}
                            >
                                Добавить предмет
                            </button>
                        </div>
                    </div>

                    <div className="admin-schedule-table">
                        <div className="admin-schedule-header admin-schedule-header--faculties">
                            <span>ID</span>
                            <span>Название</span>
                            <span>Действия</span>
                        </div>
                        {visibleSubjects.map(subject => (
                            <div key={subject.id} className="admin-schedule-row admin-schedule-row--faculties">
                                <span>{subject.id}</span>
                                <span>{subject.name}</span>
                                <span className="admin-accounts-actions">
                                    <button
                                        type="button"
                                        className="admin-secondary-button"
                                        onClick={() => openEditSubject(subject)}
                                    >
                                        Изменить
                                    </button>
                                    <button
                                        type="button"
                                        className="admin-danger-button"
                                        onClick={() => void handleDeleteSubject(subject)}
                                        disabled={deletingId === subject.id}
                                    >
                                        Удалить
                                    </button>
                                </span>
                            </div>
                        ))}
                        {!visibleSubjects.length && !loading && (
                            <p className="admin-section-status">Предметы не найдены</p>
                        )}
                    </div>
                </div>
            )}

            {tab === 'lessonTypes' && (
                <div className="admin-crud-panel">
                    <div className="admin-accounts-filters">
                        <label className="admin-field">
                            Поиск типа
                            <input
                                type="text"
                                value={lessonTypeSearch}
                                onChange={event => setLessonTypeSearch(event.target.value)}
                                placeholder="Название"
                            />
                        </label>
                        <div className="admin-filters-actions">
                            <button
                                type="button"
                                className="admin-secondary-button"
                                onClick={() => void runAction(loadLessonTypesData)}
                                disabled={loading}
                            >
                                Обновить список
                            </button>
                            <button
                                type="button"
                                className="admin-primary-button"
                                onClick={openCreateLessonType}
                            >
                                Добавить тип
                            </button>
                        </div>
                    </div>

                    <div className="admin-schedule-table">
                        <div className="admin-schedule-header admin-schedule-header--faculties">
                            <span>ID</span>
                            <span>Название</span>
                            <span>Действия</span>
                        </div>
                        {visibleLessonTypes.map(lessonType => (
                            <div key={lessonType.id} className="admin-schedule-row admin-schedule-row--faculties">
                                <span>{lessonType.id}</span>
                                <span className="admin-type-name">
                                    <span
                                        className="admin-type-swatch"
                                        style={{ backgroundColor: lessonType.color }}
                                        aria-hidden="true"
                                    />
                                    {lessonType.name}
                                </span>
                                <span className="admin-accounts-actions">
                                    <button
                                        type="button"
                                        className="admin-secondary-button"
                                        onClick={() => openEditLessonType(lessonType)}
                                    >
                                        Изменить
                                    </button>
                                    <button
                                        type="button"
                                        className="admin-danger-button"
                                        onClick={() => void handleDeleteLessonType(lessonType)}
                                        disabled={deletingId === lessonType.id}
                                    >
                                        Удалить
                                    </button>
                                </span>
                            </div>
                        ))}
                        {!visibleLessonTypes.length && !loading && (
                            <p className="admin-section-status">Типы занятий не найдены</p>
                        )}
                    </div>
                </div>
            )}

            {tab === 'groupSubjects' && (
                <div className="admin-crud-panel">
                    <div className="admin-accounts-filters">
                        <label className="admin-field">
                            Группа
                            <select
                                value={gsGroupFilter}
                                onChange={event => handleSelectPlanGroup(event.target.value)}
                            >
                                <option value="">Выберите группу</option>
                                {groups.map(group => (
                                    <option key={group.id} value={group.id}>
                                        {group.name}
                                    </option>
                                ))}
                            </select>
                        </label>
                        {selectedPlanGroup && (
                            <>
                                <label className="admin-field">
                                    Семестр
                                    <select
                                        value={gsSemesterFilter}
                                        onChange={event => setGsSemesterFilter(event.target.value)}
                                    >
                                        <option value="">Все</option>
                                        {groupSubjectSemesters.map(semester => (
                                            <option key={semester} value={semester}>
                                                {semester}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                                <div className="admin-filters-actions">
                                    <button
                                        type="button"
                                        className="admin-secondary-button"
                                        onClick={() => void runAction(loadGroupSubjectsData)}
                                        disabled={loading}
                                    >
                                        Обновить список
                                    </button>
                                    <button
                                        type="button"
                                        className="admin-primary-button"
                                        onClick={openCreateGroupSubject}
                                    >
                                        Добавить предмет
                                    </button>
                                </div>
                            </>
                        )}
                    </div>

                    {!selectedPlanGroup && (
                        <p className="admin-section-status">
                            Выберите группу, чтобы увидеть и редактировать её учебный план.
                        </p>
                    )}

                    {selectedPlanGroup && (
                        <div className="plan-list">
                            <h3 className="admin-plan-title">Учебный план группы {selectedPlanGroup.name}</h3>
                            <div className="plan-cards">
                                {visibleGroupSubjects.map(item => (
                                    <article key={item.id} className="plan-card">
                                        <div
                                            className="plan-card__semester"
                                            aria-label={`${item.semester} семестр`}
                                        >
                                            <span className="plan-card__semester-num">{item.semester}</span>
                                            <span className="plan-card__semester-label">семестр</span>
                                        </div>
                                        <div className="plan-card__body">
                                            <h4 className="plan-card__subject">
                                                {item.subject_name || `#${item.subject_id}`}
                                            </h4>
                                            <p className="plan-card__teacher">
                                                {item.teacher_name ? (
                                                    <>
                                                        <span className="plan-card__teacher-label">
                                                            Преподаватель:
                                                        </span>{' '}
                                                        {item.teacher_name}
                                                    </>
                                                ) : (
                                                    <span className="plan-card__teacher--empty">
                                                        Преподаватель не назначен
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                        <div className="plan-card__actions">
                                            <button
                                                type="button"
                                                className="admin-secondary-button"
                                                onClick={() => openEditGroupSubject(item)}
                                            >
                                                Изменить
                                            </button>
                                            <button
                                                type="button"
                                                className="admin-danger-button"
                                                onClick={() => void handleDeleteGroupSubject(item)}
                                                disabled={deletingId === item.id}
                                            >
                                                Удалить
                                            </button>
                                        </div>
                                    </article>
                                ))}
                            </div>
                            {!visibleGroupSubjects.length && !loading && (
                                <p className="admin-section-status">
                                    В учебном плане этой группы пока нет предметов.
                                </p>
                            )}
                        </div>
                    )}
                </div>
            )}

            {tab === 'lessons' && (
                <div className="admin-crud-panel">
                    <div className="admin-accounts-filters">
                        <label className="admin-field">
                            Дата
                            <input
                                type="date"
                                value={lessonFilters.date || ''}
                                onChange={event =>
                                    setLessonFilters({ ...lessonFilters, date: event.target.value })
                                }
                            />
                        </label>
                        <label className="admin-field">
                            Группа
                            <select
                                value={lessonFilters.groupId ? String(lessonFilters.groupId) : ''}
                                onChange={event =>
                                    setLessonFilters({
                                        ...lessonFilters,
                                        groupId: event.target.value ? Number(event.target.value) : undefined,
                                    })
                                }
                            >
                                <option value="">Все</option>
                                {groups.map(group => (
                                    <option key={group.id} value={group.id}>
                                        {group.name}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="admin-field">
                            Преподаватель
                            <select
                                value={lessonFilters.teacherId ? String(lessonFilters.teacherId) : ''}
                                onChange={event =>
                                    setLessonFilters({
                                        ...lessonFilters,
                                        teacherId: event.target.value ? Number(event.target.value) : undefined,
                                    })
                                }
                            >
                                <option value="">Все</option>
                                {teachers.map(teacher => (
                                    <option key={teacher.id} value={teacher.id}>
                                        {formatTeacherName(teacher)}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="admin-field">
                            Аудитория
                            <select
                                value={lessonFilters.classroom || ''}
                                onChange={event =>
                                    setLessonFilters({ ...lessonFilters, classroom: event.target.value })
                                }
                            >
                                <option value="">Все</option>
                                {rooms.map(room => (
                                    <option key={room.id} value={room.name}>
                                        {formatRoomName(room)}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="admin-field">
                            Предмет
                            <input
                                type="text"
                                value={lessonFilters.subject || ''}
                                onChange={event =>
                                    setLessonFilters({ ...lessonFilters, subject: event.target.value })
                                }
                                placeholder="Математика"
                            />
                        </label>
                        <div className="admin-filters-actions">
                            <button
                                type="button"
                                className="admin-primary-button"
                                onClick={handleSearchLessons}
                                disabled={loading}
                            >
                                Найти
                            </button>
                            <button
                                type="button"
                                className="admin-secondary-button"
                                onClick={handleResetLessonFilters}
                                disabled={loading}
                            >
                                Сбросить
                            </button>
                            <button type="button" className="admin-secondary-button" onClick={openCreateLesson}>
                                Добавить занятие
                            </button>
                        </div>
                    </div>

                    <div className="admin-schedule-table">
                        <div className="admin-schedule-header admin-schedule-header--lessons">
                            <span>Дата</span>
                            <span>Время</span>
                            <span>Предмет</span>
                            <span>Тип</span>
                            <span>Аудитория</span>
                            <span>Группа</span>
                            <span>Преподаватель</span>
                            <span>Действия</span>
                        </div>
                        {lessons.map(lesson => (
                            <div key={lesson.id} className="admin-schedule-row admin-schedule-row--lessons">
                                <span>{lesson.date}</span>
                                <span>
                                    {lesson.start_time} - {lesson.end_time}
                                </span>
                                <span>{lesson.subject}</span>
                                <span>{lesson.type || '—'}</span>
                                <span>{lesson.classroom || '—'}</span>
                                <span>{groups.find(group => group.id === lesson.group)?.name ?? `#${lesson.group}`}</span>
                                <span>{lesson.teacher_id ? (teacherNames.get(lesson.teacher_id) ?? `#${lesson.teacher_id}`) : '—'}</span>
                                <span className="admin-accounts-actions">
                                    <button
                                        type="button"
                                        className="admin-secondary-button"
                                        onClick={() => openEditLesson(lesson)}
                                    >
                                        Изменить
                                    </button>
                                    <button
                                        type="button"
                                        className="admin-danger-button"
                                        onClick={() => void handleDeleteLesson(lesson)}
                                        disabled={deletingId === lesson.id}
                                    >
                                        Удалить
                                    </button>
                                </span>
                            </div>
                        ))}
                        {!lessons.length && !loading && (
                            <p className="admin-section-status">Занятия не найдены</p>
                        )}
                    </div>
                </div>
            )}

            <AdminModal
                open={facultyModalOpen}
                title={editingFaculty ? 'Редактирование факультета' : 'Новый факультет'}
                onClose={closeFacultyModal}
            >
                <div className="admin-edit-form">
                    <label className="admin-field">
                        Название
                        <input
                            type="text"
                            value={facultyFormName}
                            onChange={event => setFacultyFormName(event.target.value)}
                        />
                    </label>
                    <div className="admin-edit-actions">
                        <button
                            type="button"
                            className="admin-secondary-button"
                            onClick={closeFacultyModal}
                            disabled={saving}
                        >
                            Отмена
                        </button>
                        <button
                            type="button"
                            className="admin-primary-button"
                            onClick={() => void handleSaveFaculty()}
                            disabled={saving}
                        >
                            {saving ? 'Сохранение...' : 'Сохранить'}
                        </button>
                    </div>
                </div>
            </AdminModal>

            <AdminModal
                open={subjectModalOpen}
                title={editingSubject ? 'Редактирование предмета' : 'Новый предмет'}
                onClose={closeSubjectModal}
            >
                <div className="admin-edit-form">
                    <label className="admin-field">
                        Название
                        <input
                            type="text"
                            value={subjectFormName}
                            onChange={event => setSubjectFormName(event.target.value)}
                        />
                    </label>
                    <div className="admin-edit-actions">
                        <button
                            type="button"
                            className="admin-secondary-button"
                            onClick={closeSubjectModal}
                            disabled={saving}
                        >
                            Отмена
                        </button>
                        <button
                            type="button"
                            className="admin-primary-button"
                            onClick={() => void handleSaveSubject()}
                            disabled={saving}
                        >
                            {saving ? 'Сохранение...' : 'Сохранить'}
                        </button>
                    </div>
                </div>
            </AdminModal>

            <AdminModal
                open={lessonTypeModalOpen}
                title={editingLessonType ? 'Редактирование типа занятия' : 'Новый тип занятия'}
                onClose={closeLessonTypeModal}
            >
                <div className="admin-edit-form">
                    <label className="admin-field">
                        Название
                        <input
                            type="text"
                            value={lessonTypeForm.name}
                            onChange={event =>
                                setLessonTypeForm({ ...lessonTypeForm, name: event.target.value })
                            }
                        />
                    </label>
                    <label className="admin-field">
                        Цвет
                        <span className="admin-color-field">
                            <input
                                type="color"
                                value={lessonTypeForm.color}
                                onChange={event =>
                                    setLessonTypeForm({ ...lessonTypeForm, color: event.target.value })
                                }
                            />
                            <input
                                type="text"
                                value={lessonTypeForm.color}
                                onChange={event =>
                                    setLessonTypeForm({ ...lessonTypeForm, color: event.target.value })
                                }
                                placeholder="#2563eb"
                            />
                        </span>
                    </label>
                    <div className="admin-edit-actions">
                        <button
                            type="button"
                            className="admin-secondary-button"
                            onClick={closeLessonTypeModal}
                            disabled={saving}
                        >
                            Отмена
                        </button>
                        <button
                            type="button"
                            className="admin-primary-button"
                            onClick={() => void handleSaveLessonType()}
                            disabled={saving}
                        >
                            {saving ? 'Сохранение...' : 'Сохранить'}
                        </button>
                    </div>
                </div>
            </AdminModal>

            <AdminModal
                open={groupSubjectModalOpen}
                title={editingGroupSubject ? 'Редактирование предмета плана' : 'Предмет в учебный план'}
                onClose={closeGroupSubjectModal}
            >
                <div className="admin-edit-form">
                    <label className="admin-field">
                        Группа
                        <select
                            value={groupSubjectForm.group_id}
                            onChange={event =>
                                setGroupSubjectForm({ ...groupSubjectForm, group_id: event.target.value })
                            }
                        >
                            <option value="">Выберите</option>
                            {groups.map(group => (
                                <option key={group.id} value={group.id}>
                                    {group.name}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className="admin-field">
                        Семестр
                        <input
                            type="number"
                            min={1}
                            value={groupSubjectForm.semester}
                            onChange={event =>
                                setGroupSubjectForm({ ...groupSubjectForm, semester: event.target.value })
                            }
                        />
                    </label>
                    <label className="admin-field">
                        Предмет
                        <select
                            value={groupSubjectForm.subject_id}
                            onChange={event =>
                                setGroupSubjectForm({ ...groupSubjectForm, subject_id: event.target.value })
                            }
                        >
                            <option value="">Выберите</option>
                            {subjects.map(subject => (
                                <option key={subject.id} value={subject.id}>
                                    {subject.name}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className="admin-field">
                        Преподаватель
                        <select
                            value={groupSubjectForm.teacher_id}
                            onChange={event =>
                                setGroupSubjectForm({ ...groupSubjectForm, teacher_id: event.target.value })
                            }
                        >
                            <option value="">Не указан</option>
                            {teachers.map(teacher => (
                                <option key={teacher.id} value={teacher.id}>
                                    {formatTeacherName(teacher)}
                                </option>
                            ))}
                        </select>
                    </label>
                    <div className="admin-edit-actions">
                        <button
                            type="button"
                            className="admin-secondary-button"
                            onClick={closeGroupSubjectModal}
                            disabled={saving}
                        >
                            Отмена
                        </button>
                        <button
                            type="button"
                            className="admin-primary-button"
                            onClick={() => void handleSaveGroupSubject()}
                            disabled={saving}
                        >
                            {saving ? 'Сохранение...' : 'Сохранить'}
                        </button>
                    </div>
                </div>
            </AdminModal>

            <AdminModal
                open={groupModalOpen}
                title={editingGroup ? `Редактирование группы: ${editingGroup.name}` : 'Новая группа'}
                size="wide"
                onClose={closeGroupModal}
            >
                <div className="admin-edit-form">
                    <label className="admin-field">
                        Название
                        <input
                            type="text"
                            value={groupForm.name}
                            onChange={event => setGroupForm({ ...groupForm, name: event.target.value })}
                        />
                    </label>
                    <label className="admin-field">
                        Факультет
                        <select
                            value={groupForm.facultyID}
                            onChange={event => setGroupForm({ ...groupForm, facultyID: event.target.value })}
                        >
                            <option value="">Выберите</option>
                            {faculties.map(faculty => (
                                <option key={faculty.id} value={faculty.id}>
                                    {faculty.name}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className="admin-field">
                        Курс
                        <input
                            type="number"
                            value={groupForm.course}
                            onChange={event => setGroupForm({ ...groupForm, course: event.target.value })}
                        />
                    </label>
                    <label className="admin-field">
                        Уровень
                        <input
                            type="text"
                            value={groupForm.degree}
                            onChange={event => setGroupForm({ ...groupForm, degree: event.target.value })}
                        />
                    </label>
                    <label className="admin-field">
                        Год набора
                        <input
                            type="number"
                            value={groupForm.yearStart}
                            onChange={event => setGroupForm({ ...groupForm, yearStart: event.target.value })}
                        />
                    </label>
                    <label className="admin-field">
                        Специализация
                        <input
                            type="text"
                            value={groupForm.specialization}
                            onChange={event =>
                                setGroupForm({ ...groupForm, specialization: event.target.value })
                            }
                        />
                    </label>
                    <label className="admin-field admin-field-checkbox">
                        <input
                            type="checkbox"
                            checked={groupForm.isActive}
                            onChange={event => setGroupForm({ ...groupForm, isActive: event.target.checked })}
                        />
                        Активная группа
                    </label>
                    <div className="admin-edit-actions">
                        <button
                            type="button"
                            className="admin-secondary-button"
                            onClick={closeGroupModal}
                            disabled={saving}
                        >
                            Отмена
                        </button>
                        <button
                            type="button"
                            className="admin-primary-button"
                            onClick={() => void handleSaveGroup()}
                            disabled={saving}
                        >
                            {saving ? 'Сохранение...' : 'Сохранить'}
                        </button>
                    </div>
                </div>
            </AdminModal>

            <AdminModal
                open={lessonModalOpen}
                title={editingLesson ? `Редактирование занятия: ${editingLesson.subject}` : 'Новое занятие'}
                size="wide"
                onClose={closeLessonModal}
            >
                <div className="admin-edit-form">
                    <label className="admin-field">
                        Дата
                        <input
                            type="date"
                            value={lessonForm.date}
                            onChange={event => setLessonForm({ ...lessonForm, date: event.target.value })}
                        />
                    </label>
                    <label className="admin-field">
                        Время начала
                        <input
                            type="time"
                            value={lessonForm.start_time}
                            onChange={event =>
                                setLessonForm({ ...lessonForm, start_time: event.target.value })
                            }
                        />
                    </label>
                    <label className="admin-field">
                        Время окончания
                        <input
                            type="time"
                            value={lessonForm.end_time}
                            onChange={event => setLessonForm({ ...lessonForm, end_time: event.target.value })}
                        />
                    </label>
                    <label className="admin-field">
                        Предмет
                        <select
                            value={lessonForm.subject}
                            onChange={event => setLessonForm({ ...lessonForm, subject: event.target.value })}
                        >
                            <option value="">Выберите</option>
                            {lessonForm.subject &&
                                !subjects.some(subject => subject.name === lessonForm.subject) && (
                                    <option value={lessonForm.subject}>
                                        {lessonForm.subject} (вне справочника)
                                    </option>
                                )}
                            {subjects.map(subject => (
                                <option key={subject.id} value={subject.name}>
                                    {subject.name}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className="admin-field">
                        Тип
                        <select
                            value={lessonForm.type}
                            onChange={event => setLessonForm({ ...lessonForm, type: event.target.value })}
                        >
                            <option value="">Выберите</option>
                            {lessonForm.type &&
                                !lessonTypes.some(lessonType => lessonType.name === lessonForm.type) && (
                                    <option value={lessonForm.type}>
                                        {lessonForm.type} (вне справочника)
                                    </option>
                                )}
                            {lessonTypes.map(lessonType => (
                                <option key={lessonType.id} value={lessonType.name}>
                                    {lessonType.name}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className="admin-field">
                        Аудитория
                        <select
                            value={lessonForm.room_id}
                            onChange={event =>
                                setLessonForm({ ...lessonForm, room_id: event.target.value })
                            }
                        >
                            <option value="">Выберите</option>
                            {rooms.map(room => (
                                <option key={room.id} value={room.id}>
                                    {formatRoomName(room)}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className="admin-field">
                        Группа
                        <select
                            value={lessonForm.group}
                            onChange={event => setLessonForm({ ...lessonForm, group: event.target.value })}
                        >
                            <option value="">Выберите</option>
                            {groups.map(group => (
                                <option key={group.id} value={group.id}>
                                    {group.name}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className="admin-field">
                        Преподаватель
                        <select
                            value={lessonForm.teacher_id}
                            onChange={event =>
                                setLessonForm({ ...lessonForm, teacher_id: event.target.value })
                            }
                        >
                            <option value="">Не указан</option>
                            {teachers.map(teacher => (
                                <option key={teacher.id} value={teacher.id}>
                                    {formatTeacherName(teacher)}
                                </option>
                            ))}
                        </select>
                    </label>
                    <div className="admin-edit-actions">
                        <button
                            type="button"
                            className="admin-secondary-button"
                            onClick={closeLessonModal}
                            disabled={saving}
                        >
                            Отмена
                        </button>
                        <button
                            type="button"
                            className="admin-primary-button"
                            onClick={() => void handleSaveLesson()}
                            disabled={saving}
                        >
                            {saving ? 'Сохранение...' : 'Сохранить'}
                        </button>
                    </div>
                </div>
            </AdminModal>
        </section>
    );
}

