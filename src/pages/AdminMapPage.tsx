import { useMemo, useState } from 'react';
import { useAuth } from '../context/useAuth';
import {
    createConnection,
    createRoom,
    deleteConnection,
    deleteRoom,
    findMapPath,
    getMapBuildings,
    searchMapRooms,
    updateConnection,
    updateRoom,
} from '../api/map';
import './AdminMapPage.css';

function formatResult(value: unknown) {
    return JSON.stringify(value, null, 2);
}

function parseJsonPayload(raw: string, entityName: string) {
    try {
        return JSON.parse(raw) as Record<string, unknown>;
    } catch {
        throw new Error(`Некорректный JSON для ${entityName}`);
    }
}

const defaultRoomPayload = '{\n  "name": "A-101",\n  "building_id": 1,\n  "floor": 1\n}';
const defaultConnectionPayload = '{\n  "from_room_id": 1,\n  "to_room_id": 2,\n  "distance": 5\n}';

export function AdminMapPage() {
    const { profile } = useAuth();

    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [buildingsResult, setBuildingsResult] = useState<string>('');
    const [searchResult, setSearchResult] = useState<string>('');
    const [pathResult, setPathResult] = useState<string>('');
    const [roomResult, setRoomResult] = useState<string>('');
    const [connectionResult, setConnectionResult] = useState<string>('');

    const [searchBuildingId, setSearchBuildingId] = useState('1');
    const [searchFloor, setSearchFloor] = useState('1');

    const [pathStart, setPathStart] = useState('');
    const [pathEnd, setPathEnd] = useState('');

    const [roomId, setRoomId] = useState('');
    const [roomPayload, setRoomPayload] = useState(defaultRoomPayload);

    const [connectionId, setConnectionId] = useState('');
    const [connectionPayload, setConnectionPayload] = useState(defaultConnectionPayload);

    const endpointList = useMemo(
        () => [
            'GET /api/v1/map/buildings',
            'GET /api/v1/map/search?building_id=1&floor=2',
            'GET /api/v1/map/path/:start/:end',
            'POST /api/v1/admin/room',
            'PUT /api/v1/admin/room/:id',
            'DELETE /api/v1/admin/room/:id',
            'POST /api/v1/admin/connection',
            'PUT /api/v1/admin/connection/:id',
            'DELETE /api/v1/admin/connection/:id',
        ],
        []
    );

    if (profile?.role !== 'admin') {
        return <p>У вас нет доступа к карте админа</p>;
    }

    const runAction = async (action: () => Promise<unknown>, onSuccess: (data: unknown) => void) => {
        setBusy(true);
        setError(null);

        try {
            const data = await action();
            onSuccess(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ошибка запроса');
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="admin-map-page">
            <header className="admin-map-header">
                <h1>Карта</h1>
                <p>Инструменты администратора для проверки map API и CRUD комнат/связей.</p>
            </header>

            <section className="admin-map-card">
                <h2>Доступные маршруты</h2>
                <ul className="admin-map-routes">
                    {endpointList.map(route => (
                        <li key={route}>
                            <code>{route}</code>
                        </li>
                    ))}
                </ul>
            </section>

            <section className="admin-map-card">
                <h2>Map API</h2>
                <div className="admin-map-actions">
                    <button
                        type="button"
                        disabled={busy}
                        onClick={() => runAction(getMapBuildings, data => setBuildingsResult(formatResult(data)))}
                    >
                        Загрузить здания
                    </button>

                    <div className="admin-map-inline-fields">
                        <label>
                            Building ID
                            <input
                                value={searchBuildingId}
                                onChange={event => setSearchBuildingId(event.target.value)}
                            />
                        </label>
                        <label>
                            Этаж
                            <input
                                value={searchFloor}
                                onChange={event => setSearchFloor(event.target.value)}
                            />
                        </label>
                        <button
                            type="button"
                            disabled={busy}
                            onClick={() =>
                                runAction(
                                    () => searchMapRooms(Number(searchBuildingId), Number(searchFloor)),
                                    data => setSearchResult(formatResult(data))
                                )
                            }
                        >
                            Поиск комнат
                        </button>
                    </div>

                    <div className="admin-map-inline-fields">
                        <label>
                            Стартовая комната
                            <input value={pathStart} onChange={event => setPathStart(event.target.value)} />
                        </label>
                        <label>
                            Конечная комната
                            <input value={pathEnd} onChange={event => setPathEnd(event.target.value)} />
                        </label>
                        <button
                            type="button"
                            disabled={busy}
                            onClick={() =>
                                runAction(
                                    () => findMapPath(pathStart.trim(), pathEnd.trim()),
                                    data => setPathResult(formatResult(data))
                                )
                            }
                        >
                            Найти путь
                        </button>
                    </div>
                </div>

                <div className="admin-map-results">
                    <article>
                        <h3>GET /map/buildings</h3>
                        <pre>{buildingsResult || 'Нет данных'}</pre>
                    </article>
                    <article>
                        <h3>GET /map/search</h3>
                        <pre>{searchResult || 'Нет данных'}</pre>
                    </article>
                    <article>
                        <h3>GET /map/path</h3>
                        <pre>{pathResult || 'Нет данных'}</pre>
                    </article>
                </div>
            </section>

            <section className="admin-map-card">
                <h2>CRUD: комнаты</h2>
                <div className="admin-map-inline-fields">
                    <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                            runAction(
                                () => createRoom(parseJsonPayload(roomPayload, 'комнаты')),
                                data => setRoomResult(formatResult(data))
                            )
                        }
                    >
                        POST /admin/room
                    </button>
                    <label>
                        Room ID
                        <input value={roomId} onChange={event => setRoomId(event.target.value)} />
                    </label>
                    <button
                        type="button"
                        disabled={busy || !roomId}
                        onClick={() =>
                            runAction(
                                () => updateRoom(Number(roomId), parseJsonPayload(roomPayload, 'комнаты')),
                                data => setRoomResult(formatResult(data))
                            )
                        }
                    >
                        PUT /admin/room/:id
                    </button>
                    <button
                        type="button"
                        disabled={busy || !roomId}
                        onClick={() =>
                            runAction(
                                () => deleteRoom(Number(roomId)),
                                data => setRoomResult(formatResult(data))
                            )
                        }
                    >
                        DELETE /admin/room/:id
                    </button>
                </div>

                <label className="admin-map-textarea-label">
                    JSON payload комнаты
                    <textarea
                        rows={8}
                        value={roomPayload}
                        onChange={event => setRoomPayload(event.target.value)}
                    />
                </label>
                <pre>{roomResult || 'Нет данных'}</pre>
            </section>

            <section className="admin-map-card">
                <h2>CRUD: связи</h2>
                <div className="admin-map-inline-fields">
                    <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                            runAction(
                                () => createConnection(parseJsonPayload(connectionPayload, 'связи')),
                                data => setConnectionResult(formatResult(data))
                            )
                        }
                    >
                        POST /admin/connection
                    </button>
                    <label>
                        Connection ID
                        <input
                            value={connectionId}
                            onChange={event => setConnectionId(event.target.value)}
                        />
                    </label>
                    <button
                        type="button"
                        disabled={busy || !connectionId}
                        onClick={() =>
                            runAction(
                                () =>
                                    updateConnection(
                                        Number(connectionId),
                                        parseJsonPayload(connectionPayload, 'связи')
                                    ),
                                data => setConnectionResult(formatResult(data))
                            )
                        }
                    >
                        PUT /admin/connection/:id
                    </button>
                    <button
                        type="button"
                        disabled={busy || !connectionId}
                        onClick={() =>
                            runAction(
                                () => deleteConnection(Number(connectionId)),
                                data => setConnectionResult(formatResult(data))
                            )
                        }
                    >
                        DELETE /admin/connection/:id
                    </button>
                </div>

                <label className="admin-map-textarea-label">
                    JSON payload связи
                    <textarea
                        rows={8}
                        value={connectionPayload}
                        onChange={event => setConnectionPayload(event.target.value)}
                    />
                </label>
                <pre>{connectionResult || 'Нет данных'}</pre>
            </section>

            {error && <p className="admin-map-error">{error}</p>}
        </div>
    );
}

