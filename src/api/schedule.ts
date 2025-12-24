import type {Lesson} from "./types/schedule.ts";

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
};

export async function searchLessons(params: SearchLessonsParams): Promise<Lesson[]> {
    const query = new URLSearchParams();

    if (params.date) query.append('date', params.date);
    if (params.teacherId) query.append('teacher_id', String(params.teacherId));
    if (params.groupId) query.append('group_id', String(params.groupId));
    if (params.classroom) query.append('classroom', params.classroom);

    const res = await fetch(`/api/v1/schedule/search?${query.toString()}`, {
        credentials: 'include',
    });

    if (!res.ok) {
        throw new Error('Ошибка поиска');
    }

    return res.json();
}