// API client for the schedule composer (конструктор расписания): recurring
// two-week slots and the "generate" action that expands them into dated lessons.
import { fetchWithRefresh } from './fetchWithRefresh';

export type WeekParity = 'odd' | 'even'; // нечётная | чётная

export type SlotRecord = {
    id: number;
    group_id: number;
    group_name: string;
    semester: number;
    week_parity: WeekParity;
    weekday: number; // 1=Пн .. 7=Вс
    start_time: string; // HH:MM
    end_time: string; // HH:MM
    subject: string;
    type: string;
    teacher_id: number | null;
    teacher_name: string;
    classroom: string;
};

export type SlotPayload = {
    group_id: number;
    semester: number;
    week_parity: WeekParity;
    weekday: number;
    start_time: string;
    end_time: string;
    subject: string;
    type: string;
    teacher_id: number | null;
    classroom: string;
};

export type SlotFilters = {
    groupId?: number;
    semester?: number;
    teacherId?: number;
};

export type GenerateSchedulePayload = {
    group_id: number;
    semester: number;
    start_date: string; // YYYY-MM-DD
    end_date: string; // YYYY-MM-DD
    first_week_parity?: WeekParity;
};

export type GenerateScheduleResult = {
    generated: number;
    skipped: number;
};

function toMessage(data: unknown, status: number) {
    if (typeof data === 'object' && data !== null && 'error' in data) {
        return String((data as { error?: unknown }).error ?? 'Request failed');
    }
    return `Request failed: ${status}`;
}

async function parseResponse(res: Response): Promise<unknown> {
    if (res.status === 204) return null;
    const contentType = res.headers.get('content-type') ?? '';
    if (contentType.includes('application/json')) return res.json();
    const text = await res.text();
    return text ? { message: text } : null;
}

async function request(path: string, init?: RequestInit) {
    const res = await fetchWithRefresh(`/api/v1${path}`, init);
    const data = await parseResponse(res);
    if (!res.ok) throw new Error(toMessage(data, res.status));
    return data;
}

function normalizeSlot(raw: unknown): SlotRecord {
    const data = raw as Record<string, unknown>;
    const parity = data.week_parity === 'even' ? 'even' : 'odd';
    return {
        id: Number(data.id ?? 0),
        group_id: Number(data.group_id ?? 0),
        group_name: String(data.group_name ?? ''),
        semester: Number(data.semester ?? 0),
        week_parity: parity,
        weekday: Number(data.weekday ?? 1),
        start_time: String(data.start_time ?? ''),
        end_time: String(data.end_time ?? ''),
        subject: String(data.subject ?? ''),
        type: String(data.type ?? ''),
        teacher_id: data.teacher_id != null ? Number(data.teacher_id) : null,
        teacher_name: String(data.teacher_name ?? ''),
        classroom: String(data.classroom ?? ''),
    };
}

export async function listSlots(filters: SlotFilters = {}): Promise<SlotRecord[]> {
    const query = new URLSearchParams();
    if (filters.groupId) query.append('group_id', String(filters.groupId));
    if (filters.semester) query.append('semester', String(filters.semester));
    if (filters.teacherId) query.append('teacher_id', String(filters.teacherId));

    const path = query.toString() ? `/schedule/slots?${query.toString()}` : '/schedule/slots';
    const data = (await request(path)) as unknown[];
    return (Array.isArray(data) ? data : []).map(normalizeSlot);
}

export async function createSlot(payload: SlotPayload): Promise<SlotRecord> {
    const data = await request('/admin/slot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    return normalizeSlot(data);
}

export async function updateSlot(id: number, payload: SlotPayload): Promise<SlotRecord> {
    const data = await request(`/admin/slot/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    return normalizeSlot(data);
}

export async function deleteSlot(id: number): Promise<void> {
    await request(`/admin/slot/${id}`, { method: 'DELETE' });
}

export async function generateSchedule(payload: GenerateSchedulePayload): Promise<GenerateScheduleResult> {
    const data = (await request('/admin/schedule/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    })) as Record<string, unknown>;
    return {
        generated: Number(data?.generated ?? 0),
        skipped: Number(data?.skipped ?? 0),
    };
}
