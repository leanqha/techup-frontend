import { fetchWithRefresh } from './fetchWithRefresh';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

async function parseResponse(res: Response): Promise<unknown> {
    if (res.status === 204) {
        return { success: true };
    }

    const contentType = res.headers.get('content-type') ?? '';

    if (contentType.includes('application/json')) {
        return res.json();
    }

    const text = await res.text();
    return text ? { message: text } : { success: true };
}

async function mapRequest(
    path: string,
    method: HttpMethod = 'GET',
    body?: unknown
): Promise<unknown> {
    const res = await fetchWithRefresh(`/api/v1${path}`, {
        method,
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
    });

    const parsed = await parseResponse(res);

    if (!res.ok) {
        const message =
            typeof parsed === 'object' && parsed !== null && 'error' in parsed
                ? String((parsed as { error?: unknown }).error)
                : `Request failed: ${res.status}`;
        throw new Error(message);
    }

    return parsed;
}

export function getMapBuildings() {
    return mapRequest('/map/buildings');
}

export function searchMapRooms(buildingId: number, floor: number) {
    return mapRequest(`/map/search?building_id=${buildingId}&floor=${floor}`);
}

export function findMapPath(start: string, end: string) {
    return mapRequest(`/map/path/${encodeURIComponent(start)}/${encodeURIComponent(end)}`);
}

export function createRoom(payload: Record<string, unknown>) {
    return mapRequest('/admin/room', 'POST', payload);
}

export function updateRoom(id: number, payload: Record<string, unknown>) {
    return mapRequest(`/admin/room/${id}`, 'PUT', payload);
}

export function deleteRoom(id: number) {
    return mapRequest(`/admin/room/${id}`, 'DELETE');
}

export function createConnection(payload: Record<string, unknown>) {
    return mapRequest('/admin/connection', 'POST', payload);
}

export function updateConnection(id: number, payload: Record<string, unknown>) {
    return mapRequest(`/admin/connection/${id}`, 'PUT', payload);
}

export function deleteConnection(id: number) {
    return mapRequest(`/admin/connection/${id}`, 'DELETE');
}

