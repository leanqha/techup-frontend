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

export type LessonRecord = {
    id: number;
    date: string;
    start_time: string;
    end_time: string;
    subject: string;
    type: string;
    classroom: string;
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
    return {
        id: 'id' in group ? group.id : undefined,
        name: group.name,
        course: group.course,
        degree: group.degree,
        facultyID: group.facultyID,
        yearStart: group.yearStart,
        specialization: group.specialization,
        isActive: group.isActive,
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
        classroom: String(data.classroom ?? ''),
        group:
            typeof group === 'number'
                ? group
                : Number((group as Record<string, unknown> | undefined)?.id ?? data.group_id ?? 0),
        teacher_id: teacher?.id ? Number(teacher.id) : (data.teacher_id as number | null | undefined) ?? null,
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

