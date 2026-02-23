let isRefreshing = false;
let refreshPromise: Promise<Response> | null = null;

export async function fetchWithRefresh(
    input: RequestInfo,
    init?: RequestInit
): Promise<Response> {
    const res = await fetch(input, {
        ...init,
        credentials: 'include',
    });

    if (res.status !== 401) {
        return res; // access token валиден
    }

    // Если уже идёт refresh — ждём его
    if (!isRefreshing) {
        isRefreshing = true;

        refreshPromise = fetch('/api/v1/account/refresh', {
            method: 'POST',
            credentials: 'include',
        }).finally(() => {
            isRefreshing = false;
        });
    }

    const refreshRes = await refreshPromise!;

    if (!refreshRes.ok) {
        throw new Error('Сессия истекла');
    }

    // Повторяем исходный запрос
    return fetch(input, {
        ...init,
        credentials: 'include',
    });
}