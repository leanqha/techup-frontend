import type {GetPathResponse} from "./types/types.ts";

export async function getPath(from: string, to: string): Promise<GetPathResponse> {
    const url = `http://46.37.123.72:8080/api/v1/map/path/${from}/${to}`;

    const res = await fetch(url);

    if (!res.ok) {
        throw new Error(`Ошибка запроса: ${res.status}`);
    }

    const data: GetPathResponse = await res.json();
    return data;
}