import type {Lesson, LessonNote, Group} from "./types/schedule.ts";
import type {Profile} from "./types/types.ts";
import { fetchWithRefresh } from './fetchWithRefresh.ts';

export async function fetchLessons(groupId: number, from: string, to: string): Promise<Lesson[]> {
    const res = await fetch(`/api/v1/schedule/lessons?group_id=${groupId}&from=${from}&to=${to}`, {
        credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to fetch lessons');
    return res.json();
}

export type SearchLessonsParams = {
    date?: string;
    teacherId?: number;
    groupId?: number;
    classroom?: string;
    subject?: string;
};

export async function searchLessons(params: SearchLessonsParams): Promise<Lesson[]> {
    const query = new URLSearchParams();
    if (params.date) query.append('date', params.date);
    if (params.teacherId) query.append('teacher_id', String(params.teacherId));
    if (params.groupId) query.append('group_id', String(params.groupId));
    if (params.classroom) query.append('classroom', params.classroom);
    if (params.subject) query.append('subject', params.subject);

    const res = await fetch(`/api/v1/schedule/search?${query.toString()}`, {
        credentials: 'include',
    });

    if (!res.ok) throw new Error('Ошибка поиска уроков');

    return res.json();
}

export async function fetchTeachers(): Promise<Profile[]> {
    const res = await fetch('/api/v1/schedule/teachers', { credentials: 'include' });
    if (!res.ok) throw new Error('Ошибка получения преподавателей');
    return res.json();
}

export async function fetchClassrooms(): Promise<string[]> {
    const res = await fetch('/api/v1/schedule/classrooms', { credentials: 'include' });
    if (!res.ok) throw new Error('Ошибка получения аудиторий');
    return res.json();
}

function normalizeGroup(raw: unknown): Group {
    const data = raw as Record<string, unknown>;

    return {
        id: Number(data.id ?? data.ID ?? 0),
        faculty_id: Number(data.faculty_id ?? data.facultyID ?? data.FacultyID ?? 0),
        name: String(data.name ?? data.Name ?? ''),
        course: Number(data.course ?? data.Course ?? 0),
        degree: String(data.degree ?? data.Degree ?? ''),
        year_start: Number(data.year_start ?? data.yearStart ?? data.YearStart ?? 0),
        specialization: String(data.specialization ?? data.Specialization ?? ''),
        is_active: Boolean(data.is_active ?? data.isActive ?? data.IsActive ?? false),
    };
}

function extractGroupList(payload: unknown): unknown[] {
    if (Array.isArray(payload)) return payload;
    if (!payload || typeof payload !== 'object') return [];

    const obj = payload as Record<string, unknown>;
    const candidates = [obj.groups, obj.items, obj.data, obj.result];
    const list = candidates.find(Array.isArray);

    return Array.isArray(list) ? list : [];
}

export async function fetchGroups(): Promise<Group[]> {
    const res = await fetch('/api/v1/schedule/groups', { credentials: 'include' });
    if (!res.ok) throw new Error('Ошибка получения групп');

    const payload = await res.json();
    return extractGroupList(payload).map(normalizeGroup);
}

export async function fetchLessonNote(lessonId: number): Promise<LessonNote | null> {
    const res = await fetchWithRefresh(`/api/v1/schedule/lessons/${lessonId}/note`);

    if (res.status === 204) return null;
    if (!res.ok) throw new Error('Ошибка загрузки заметки');

    return res.json();
}

export async function saveLessonNote(lessonId: number, text: string): Promise<void> {
    const res = await fetchWithRefresh(`/api/v1/schedule/lessons/${lessonId}/note`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
    });

    if (!res.ok) {
        throw new Error('Ошибка сохранения заметки');
    }
}

export async function deleteLessonNote(lessonId: number): Promise<void> {
    const res = await fetchWithRefresh(`/api/v1/schedule/lessons/${lessonId}/note`, {
        method: 'DELETE',
    });

    if (res.status === 404 || res.status === 204) return;
    if (!res.ok) throw new Error('Ошибка удаления заметки');
}
