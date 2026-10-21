import { fetchWithRefresh } from './fetchWithRefresh';

export type Faculty = {
    id: number;
    name: string;
};

export type GroupRecord = {
    id: number;
    name: string;
    course: number;
    degree: string;
    facultyID: number;
    yearStart: number;
    specialization: string;
    isActive: boolean;
};

export type GroupPayload = Omit<GroupRecord, 'id'>;

export type Subject = {
    id: number;
    name: string;
};

export type LessonTypeRecord = {
    id: number;
    name: string;
    color: string;
};

export type GroupSubjectRecord = {
    id: number;
    group_id: number;
    group_name: string;
    subject_id: number;
    subject_name: string;
    semester: number;
    teacher_id: number | null;
    teacher_name: string;
    lesson_type_id: number | null;
    lesson_type_name: string;
    lesson_type_color: string;
};

export type GroupSubjectPayload = {
    group_id: number;
    subject_id: number;
    semester: number;
    teacher_id: number | null;
    lesson_type_id: number | null;
};

export type GroupSubjectFilters = {
    groupId?: number;
    semester?: number;
};

export type FacultySessionRecord = {
    id: number;
    faculty_id: number;
    faculty_name: string;
    name: string;
    start_date: string; // YYYY-MM-DD
    end_date: string;
};

export type FacultySessionPayload = {
    faculty_id: number;
    name: string;
    start_date: string;
    end_date: string;
};

export type LessonRecord = {
    id: number;
    date: string;
    start_time: string;
    end_time: string;
    subject: string;
    type: string;
    room_id: number | null;
    classroom: string; // room name, for display
    group: number;
    teacher_id: number | null;
};

export type LessonPayload = Omit<LessonRecord, 'id'>;

export type LessonSearchFilters = {
    date?: string;
    teacherId?: number;
    groupId?: number;
    classroom?: string;
    subject?: string;
};

function toMessage(data: unknown, status: number) {
    if (typeof data === 'object' && data !== null && 'error' in data) {
        return String((data as { error?: unknown }).error ?? 'Request failed');
    }

    return `Request failed: ${status}`;
}

async function parseResponse(res: Response): Promise<unknown> {
    if (res.status === 204) {
        return null;
    }

    const contentType = res.headers.get('content-type') ?? '';
    if (contentType.includes('application/json')) {
        return res.json();
    }

    const text = await res.text();
    return text ? { message: text } : null;
}

async function request(path: string, init?: RequestInit) {
    const res = await fetchWithRefresh(`/api/v1${path}`, init);
    const data = await parseResponse(res);

    if (!res.ok) {
        throw new Error(toMessage(data, res.status));
    }

    return data;
}

function normalizeGroup(raw: unknown): GroupRecord {
    const data = raw as Record<string, unknown>;
    return {
        id: Number(data.id ?? 0),
        name: String(data.name ?? ''),
        course: Number(data.course ?? 0),
        degree: String(data.degree ?? ''),
        facultyID: Number(data.facultyID ?? data.faculty_id ?? 0),
        yearStart: Number(data.yearStart ?? data.year_start ?? 0),
        specialization: String(data.specialization ?? ''),
        isActive: Boolean(data.isActive ?? data.is_active ?? false),
    };
}

function toGroupPayload(group: GroupPayload | GroupRecord) {
    // The backend binds/serializes Group with snake_case json tags.
    return {
        name: group.name,
        course: group.course,
        degree: group.degree,
        faculty_id: group.facultyID,
        year_start: group.yearStart,
        specialization: group.specialization,
        is_active: group.isActive,
    };
}

function normalizeLesson(raw: unknown): LessonRecord {
    const data = raw as Record<string, unknown>;
    const group = data.group as Record<string, unknown> | number | undefined;
    const teacher = data.teacher as Record<string, unknown> | undefined;

    return {
        id: Number(data.id ?? 0),
        date: String(data.date ?? ''),
        start_time: String(data.start_time ?? ''),
        end_time: String(data.end_time ?? ''),
        subject: String(data.subject ?? ''),
        type: String(data.type ?? ''),
        room_id: data.room_id != null ? Number(data.room_id) : null,
        classroom: String(data.classroom ?? ''),
        group:
            typeof group === 'number'
                ? group
                : Number((group as Record<string, unknown> | undefined)?.id ?? data.group_id ?? 0),
        teacher_id: teacher?.id ? Number(teacher.id) : (data.teacher_id as number | null | undefined) ?? null,
    };
}

function normalizeGroupSubject(raw: unknown): GroupSubjectRecord {
    const data = raw as Record<string, unknown>;
    return {
        id: Number(data.id ?? 0),
        group_id: Number(data.group_id ?? 0),
        group_name: String(data.group_name ?? ''),
        subject_id: Number(data.subject_id ?? 0),
        subject_name: String(data.subject_name ?? ''),
        semester: Number(data.semester ?? 0),
        teacher_id: data.teacher_id != null ? Number(data.teacher_id) : null,
        teacher_name: String(data.teacher_name ?? ''),
        lesson_type_id: data.lesson_type_id != null ? Number(data.lesson_type_id) : null,
        lesson_type_name: String(data.lesson_type_name ?? ''),
        lesson_type_color: String(data.lesson_type_color ?? ''),
    };
}

export async function listFaculties() {
    const data = (await request('/schedule/faculties')) as unknown[];
    return (Array.isArray(data) ? data : []).map(item => item as Faculty);
}

export async function createFaculty(payload: Pick<Faculty, 'name'>) {
    return (await request('/admin/faculty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    })) as Faculty;
}

export async function updateFaculty(id: number, payload: Faculty) {
    return (await request(`/admin/faculty/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    })) as Faculty;
}

export async function deleteFaculty(id: number) {
    await request(`/admin/faculty/${id}`, { method: 'DELETE' });
}

export async function listGroups() {
    const data = (await request('/schedule/groups')) as unknown[];
    return (Array.isArray(data) ? data : []).map(normalizeGroup);
}

export async function createGroup(payload: GroupPayload) {
    await request('/admin/group', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toGroupPayload(payload)),
    });
}

export async function updateGroup(id: number, payload: GroupRecord) {
    await request(`/admin/group/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toGroupPayload(payload)),
    });
}

export async function deleteGroup(id: number) {
    await request(`/admin/group/${id}`, { method: 'DELETE' });
}

export async function listSubjects() {
    const data = (await request('/schedule/subjects')) as unknown[];
    return (Array.isArray(data) ? data : []).map(item => {
        const record = item as Record<string, unknown>;
        return { id: Number(record.id ?? 0), name: String(record.name ?? '') } as Subject;
    });
}

export async function createSubject(payload: Pick<Subject, 'name'>) {
    return (await request('/admin/subject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    })) as Subject;
}

export async function updateSubject(id: number, payload: Pick<Subject, 'name'>) {
    return (await request(`/admin/subject/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    })) as Subject;
}

export async function deleteSubject(id: number) {
    await request(`/admin/subject/${id}`, { method: 'DELETE' });
}

export async function listLessonTypes() {
    const data = (await request('/schedule/lesson-types')) as unknown[];
    return (Array.isArray(data) ? data : []).map(item => {
        const record = item as Record<string, unknown>;
        return {
            id: Number(record.id ?? 0),
            name: String(record.name ?? ''),
            color: String(record.color ?? '#64748b'),
        } as LessonTypeRecord;
    });
}

export async function createLessonType(payload: Pick<LessonTypeRecord, 'name' | 'color'>) {
    return (await request('/admin/lesson-type', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    })) as LessonTypeRecord;
}

export async function updateLessonType(id: number, payload: Pick<LessonTypeRecord, 'name' | 'color'>) {
    return (await request(`/admin/lesson-type/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    })) as LessonTypeRecord;
}

export async function deleteLessonType(id: number) {
    await request(`/admin/lesson-type/${id}`, { method: 'DELETE' });
}

export async function listGroupSubjects(filters: GroupSubjectFilters = {}) {
    const query = new URLSearchParams();
    if (filters.groupId) query.append('group_id', String(filters.groupId));
    if (filters.semester) query.append('semester', String(filters.semester));

    const path = query.toString()
        ? `/schedule/group-subjects?${query.toString()}`
        : '/schedule/group-subjects';
    const data = (await request(path)) as unknown[];

    return (Array.isArray(data) ? data : []).map(normalizeGroupSubject);
}

export async function createGroupSubject(payload: GroupSubjectPayload) {
    await request('/admin/group-subject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
}

export async function updateGroupSubject(id: number, payload: GroupSubjectPayload) {
    await request(`/admin/group-subject/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
}

export async function deleteGroupSubject(id: number) {
    await request(`/admin/group-subject/${id}`, { method: 'DELETE' });
}

function normalizeFacultySession(raw: unknown): FacultySessionRecord {
    const data = raw as Record<string, unknown>;
    return {
        id: Number(data.id ?? 0),
        faculty_id: Number(data.faculty_id ?? 0),
        faculty_name: String(data.faculty_name ?? ''),
        name: String(data.name ?? ''),
        start_date: String(data.start_date ?? ''),
        end_date: String(data.end_date ?? ''),
    };
}

export async function listFacultySessions(facultyId?: number) {
    const path = facultyId
        ? `/schedule/faculty-sessions?faculty_id=${facultyId}`
        : '/schedule/faculty-sessions';
    const data = (await request(path)) as unknown[];
    return (Array.isArray(data) ? data : []).map(normalizeFacultySession);
}

export async function createFacultySession(payload: FacultySessionPayload) {
    return (await request('/admin/faculty-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    })) as FacultySessionRecord;
}

export async function updateFacultySession(id: number, payload: FacultySessionPayload) {
    return (await request(`/admin/faculty-session/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    })) as FacultySessionRecord;
}

export async function deleteFacultySession(id: number) {
    await request(`/admin/faculty-session/${id}`, { method: 'DELETE' });
}

export async function searchAdminLessons(filters: LessonSearchFilters) {
    const query = new URLSearchParams();
    if (filters.date) query.append('date', filters.date);
    if (filters.teacherId) query.append('teacher_id', String(filters.teacherId));
    if (filters.groupId) query.append('group_id', String(filters.groupId));
    if (filters.classroom) query.append('classroom', filters.classroom);
    if (filters.subject) query.append('subject', filters.subject);

    const path = query.toString() ? `/schedule/search?${query.toString()}` : '/schedule/search';
    const data = (await request(path)) as unknown[];

    return (Array.isArray(data) ? data : []).map(normalizeLesson);
}

export async function createLesson(payload: LessonPayload) {
    await request('/admin/lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
}

export async function updateLesson(id: number, payload: LessonPayload) {
    await request(`/admin/lesson/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
}

export async function deleteLesson(id: number) {
    await request(`/admin/lesson/${id}`, { method: 'DELETE' });
}

export type TeacherImportResult = {
    fetched: number;
    created: number;
    updated: number;
    skipped: number;
};

// Fetches the teaching-staff roster from spbti.ru on the server and syncs it
// into the accounts table: existing teachers keep their id, new ones are
// appended. Returns a summary of what changed.
export async function importTeachers() {
    const data = (await request('/admin/teachers/import', { method: 'POST' })) as Record<string, unknown>;
    return {
        fetched: Number(data.fetched ?? 0),
        created: Number(data.created ?? 0),
        updated: Number(data.updated ?? 0),
        skipped: Number(data.skipped ?? 0),
    } as TeacherImportResult;
}

export type ScheduleImportResult = {
    group: string;
    weeks: number;
    parsed: number;
    imported: number;
    skipped_no_teacher: number;
    from_date: string;
    to_date: string;
};

// Loads a group's schedule from spbti.ru on the server and replaces that
// group's lessons across the fetched weeks. Teachers are matched to existing
// teacher accounts by surname and initials; unmatched lessons are skipped, so
// run the teacher import first. Returns a summary of what was imported.
export async function importSPbTISchedule(group: string, weeks?: number) {
    const data = (await request('/admin/schedule/import-spbti', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ group, weeks: weeks ?? 0 }),
    })) as Record<string, unknown>;
    return {
        group: String(data.group ?? group),
        weeks: Number(data.weeks ?? 0),
        parsed: Number(data.parsed ?? 0),
        imported: Number(data.imported ?? 0),
        skipped_no_teacher: Number(data.skipped_no_teacher ?? 0),
        from_date: String(data.from_date ?? ''),
        to_date: String(data.to_date ?? ''),
    } as ScheduleImportResult;
}

