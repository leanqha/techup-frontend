import { useEffect, useMemo, useState } from 'react';
import {
    createFaculty,
    createGroup,
    createLesson,
    deleteFaculty,
    deleteGroup,
    deleteLesson,
    listFaculties,
    listGroups,
    searchAdminLessons,
    updateFaculty,
    updateGroup,
    updateLesson,
    type Faculty,
    type GroupPayload,
    type GroupRecord,
    type LessonPayload,
    type LessonRecord,
    type LessonSearchFilters,
} from '../../api/adminSchedule';
import { AdminModal } from './AdminModal';
import './AdminScheduleManager.css';

type TabKey = 'faculties' | 'groups' | 'lessons';

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
    classroom: string;
    group: string;
    teacher_id: string;
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
    type: 'lecture',
    classroom: '',
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

    const [lessons, setLessons] = useState<LessonRecord[]>([]);
    const [lessonForm, setLessonForm] = useState<LessonFormState>(emptyLessonForm);
    const [editingLesson, setEditingLesson] = useState<LessonRecord | null>(null);
    const [lessonFilters, setLessonFilters] = useState<LessonSearchFilters>(emptyLessonFilters);

    const [facultyModalOpen, setFacultyModalOpen] = useState(false);
    const [groupModalOpen, setGroupModalOpen] = useState(false);
    const [lessonModalOpen, setLessonModalOpen] = useState(false);

    const facultyNames = useMemo(() => {
        return new Map(faculties.map(item => [item.id, item.name]));
    }, [faculties]);

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

    const loadLessonsData = async (filters: LessonSearchFilters = lessonFilters) => {
        const data = await searchAdminLessons(filters);
        setLessons(data);
    };

    useEffect(() => {
        void runAction(async () => {
            await Promise.all([loadFacultiesData(), loadGroupsData()]);
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
            classroom: lesson.classroom,
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

    const toLessonPayload = (): LessonPayload => ({
        date: lessonForm.date,
        start_time: lessonForm.start_time,
        end_time: lessonForm.end_time,
        subject: lessonForm.subject.trim(),
        type: lessonForm.type.trim(),
        classroom: lessonForm.classroom.trim(),
        group: Number(lessonForm.group),
        teacher_id: lessonForm.teacher_id ? Number(lessonForm.teacher_id) : null,
    });

    const handleSaveLesson = async () => {
        if (!lessonForm.group) {
            setError('Выберите группу');
            return;
        }

        if (!lessonForm.date || !lessonForm.subject.trim()) {
            setError('Заполните дату и предмет');
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
            <div className="admin-section-header">
                <div>
                    <h2>CRUD расписания</h2>
                    <p className="admin-section-subtitle">Управление факультетами, группами и занятиями</p>
                </div>
            </div>

            <div className="admin-tabs" role="tablist" aria-label="Разделы CRUD">
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
                            Teacher ID
                            <input
                                type="number"
                                value={lessonFilters.teacherId ?? ''}
                                onChange={event =>
                                    setLessonFilters({
                                        ...lessonFilters,
                                        teacherId: event.target.value
                                            ? Number(event.target.value)
                                            : undefined,
                                    })
                                }
                                placeholder="7"
                            />
                        </label>
                        <label className="admin-field">
                            Аудитория
                            <input
                                type="text"
                                value={lessonFilters.classroom || ''}
                                onChange={event =>
                                    setLessonFilters({ ...lessonFilters, classroom: event.target.value })
                                }
                                placeholder="A-101"
                            />
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
                            <span>Teacher ID</span>
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
                                <span>{lesson.teacher_id ?? '—'}</span>
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
                        <input
                            type="text"
                            value={lessonForm.subject}
                            onChange={event => setLessonForm({ ...lessonForm, subject: event.target.value })}
                        />
                    </label>
                    <label className="admin-field">
                        Тип
                        <input
                            type="text"
                            value={lessonForm.type}
                            onChange={event => setLessonForm({ ...lessonForm, type: event.target.value })}
                        />
                    </label>
                    <label className="admin-field">
                        Аудитория
                        <input
                            type="text"
                            value={lessonForm.classroom}
                            onChange={event =>
                                setLessonForm({ ...lessonForm, classroom: event.target.value })
                            }
                        />
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
                        ID преподавателя
                        <input
                            type="number"
                            value={lessonForm.teacher_id}
                            onChange={event =>
                                setLessonForm({ ...lessonForm, teacher_id: event.target.value })
                            }
                        />
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

