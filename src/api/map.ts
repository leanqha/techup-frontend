import { fetchWithRefresh } from './fetchWithRefresh';
import type { GetPathResponse } from './types/types';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

type ApiError = Error & { status?: number };

export type MapBuilding = {
    id: number;
    name: string;
    address?: string;
};

export type MapRoom = {
    id: number;
    name: string;
    building_id: number;
    floor: number;
    description: string;
};

export type MapConnection = {
    id: number;
    room_from?: string;
    room_to?: string;
    from_room_id?: number;
    to_room_id?: number;
    distance: number;
    type?: string;
};

export type RoomPayload = {
    name: string;
    building_id: number;
    floor: number;
    description: string;
};

export type ConnectionPayload = {
    room_from: string;
    room_to: string;
    distance: number;
    type?: string;
};

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

async function requestRaw(path: string, method: HttpMethod = 'GET', body?: unknown): Promise<Response> {
    return fetchWithRefresh(`/api/v1${path}`, {
        method,
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
    });
}

async function mapRequest<T>(path: string, method: HttpMethod = 'GET', body?: unknown): Promise<T> {
    const res = await requestRaw(path, method, body);
    const parsed = await parseResponse(res);

    if (!res.ok) {
        const message =
            typeof parsed === 'object' && parsed !== null && 'error' in parsed
                ? String((parsed as { error?: unknown }).error)
                : `Request failed: ${res.status}`;
        const error = new Error(message) as ApiError;
        error.status = res.status;
        throw error;
    }

    return parsed as T;
}

async function mapRequestWithFallback<T>(paths: string[]): Promise<T> {
    let lastError: ApiError | null = null;

    for (const path of paths) {
        try {
            return await mapRequest<T>(path);
        } catch (err) {
            const error = err as ApiError;
            if (error.status && error.status !== 404) {
                throw error;
            }
            lastError = error;
        }
    }

    throw lastError ?? new Error('Request failed');
}

export function getMapBuildings() {
    return mapRequestWithFallback<MapBuilding[]>(['/map/buildings', '/buildings']);
}

export function searchMapRooms(buildingId?: number, floor?: number) {
    const query = new URLSearchParams();
    if (typeof buildingId === 'number' && !Number.isNaN(buildingId)) {
        query.append('building_id', String(buildingId));
    }
    if (typeof floor === 'number' && !Number.isNaN(floor)) {
        query.append('floor', String(floor));
    }

    const suffix = query.toString() ? `?${query.toString()}` : '';
    return mapRequest<MapRoom[]>(`/map/search${suffix}`);
}

export function listMapRooms() {
    return mapRequestWithFallback<MapRoom[]>(['/rooms', '/map/rooms']);
}

export function listMapConnections() {
    return mapRequestWithFallback<MapConnection[]>(['/connections', '/map/connections']);
}

export function findMapPath(start: string, end: string) {
    return mapRequest<GetPathResponse>(`/map/path/${encodeURIComponent(start)}/${encodeURIComponent(end)}`);
}

export function createRoom(payload: RoomPayload) {
    return mapRequest<unknown>('/admin/room', 'POST', payload);
}

export function updateRoom(id: number, payload: RoomPayload) {
    return mapRequest<unknown>(`/admin/room/${id}`, 'PUT', payload);
}

export function deleteRoom(id: number) {
    return mapRequest<unknown>(`/admin/room/${id}`, 'DELETE');
}

export function createConnection(payload: ConnectionPayload) {
    return mapRequest<unknown>('/admin/connection', 'POST', payload);
}

export function updateConnection(id: number, payload: ConnectionPayload) {
    return mapRequest<unknown>(`/admin/connection/${id}`, 'PUT', payload);
}

export function deleteConnection(id: number) {
    return mapRequest<unknown>(`/admin/connection/${id}`, 'DELETE');
}
