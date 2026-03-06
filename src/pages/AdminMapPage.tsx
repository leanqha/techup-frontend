import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/useAuth';
import {
    createConnection,
    createRoom,
    deleteConnection,
    deleteRoom,
    findMapPath,
    getMapBuildings,
    listMapConnections,
    listMapRooms,
    updateConnection,
    updateRoom,
    type ConnectionPayload,
    type MapBuilding,
    type MapConnection,
    type MapRoom,
    type RoomPayload,
} from '../api/map';
import { AdminModal } from '../components/admin/AdminModal';
import './AdminMapPage.css';

type TabKey = 'rooms' | 'connections';

type RoomFormState = {
    name: string;
    building_id: string;
    floor: string;
};

type ConnectionFormState = {
    from_room_id: string;
    to_room_id: string;
    distance: string;
    type: string;
};

const emptyRoomForm: RoomFormState = {
    name: '',
    building_id: '',
    floor: '1',
};

const emptyConnectionForm: ConnectionFormState = {
    from_room_id: '',
    to_room_id: '',
    distance: '1',
    type: 'corridor',
};

export function AdminMapPage() {
    const { profile } = useAuth();

    const [tab, setTab] = useState<TabKey>('rooms');
    const [busy, setBusy] = useState(false);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    const [buildings, setBuildings] = useState<MapBuilding[]>([]);
    const [rooms, setRooms] = useState<MapRoom[]>([]);
    const [connections, setConnections] = useState<MapConnection[]>([]);

    const [roomSearch, setRoomSearch] = useState('');
    const [roomBuildingFilter, setRoomBuildingFilter] = useState('');
    const [roomFloorFilter, setRoomFloorFilter] = useState('');

    const [connectionSearch, setConnectionSearch] = useState('');

    const [pathStart, setPathStart] = useState('');
    const [pathEnd, setPathEnd] = useState('');
    const [pathResult, setPathResult] = useState('');

    const [roomModalOpen, setRoomModalOpen] = useState(false);
    const [connectionModalOpen, setConnectionModalOpen] = useState(false);

    const [editingRoom, setEditingRoom] = useState<MapRoom | null>(null);
    const [editingConnection, setEditingConnection] = useState<MapConnection | null>(null);

    const [roomForm, setRoomForm] = useState<RoomFormState>(emptyRoomForm);
    const [connectionForm, setConnectionForm] = useState<ConnectionFormState>(emptyConnectionForm);

    const roomsById = useMemo(() => {
        return new Map(rooms.map(item => [item.id, item]));
    }, [rooms]);

    const buildingsById = useMemo(() => {
        return new Map(buildings.map(item => [item.id, item]));
    }, [buildings]);

    const visibleRooms = useMemo(() => {
        const query = roomSearch.trim().toLowerCase();

        return rooms.filter(item => {
            const matchesName = !query || item.name.toLowerCase().includes(query);
            const matchesBuilding = !roomBuildingFilter || String(item.building_id) === roomBuildingFilter;
            const matchesFloor = !roomFloorFilter || String(item.floor) === roomFloorFilter;
            return matchesName && matchesBuilding && matchesFloor;
        });
    }, [roomBuildingFilter, roomFloorFilter, roomSearch, rooms]);

    const visibleConnections = useMemo(() => {
        const query = connectionSearch.trim().toLowerCase();
        if (!query) return connections;

        return connections.filter(item => {
            const haystack = [
                String(item.id),
                item.room_from ?? '',
                item.room_to ?? '',
                item.type ?? '',
                String(item.from_room_id ?? ''),
                String(item.to_room_id ?? ''),
            ]
                .join(' ')
                .toLowerCase();
            return haystack.includes(query);
        });
    }, [connectionSearch, connections]);

    const runAction = async (action: () => Promise<void>) => {
        setBusy(true);
        setError(null);
        setMessage(null);

        try {
            await action();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ошибка запроса');
        } finally {
            setBusy(false);
        }
    };

    const loadBuildings = async () => {
        const data = await getMapBuildings();
        setBuildings(Array.isArray(data) ? data : []);
    };

    const loadRooms = async () => {
        const data = await listMapRooms();
        setRooms(Array.isArray(data) ? data : []);
    };

    const loadConnections = async () => {
        const data = await listMapConnections();
        setConnections(Array.isArray(data) ? data : []);
    };

    useEffect(() => {
        void runAction(async () => {
            await Promise.all([loadBuildings(), loadRooms(), loadConnections()]);
        });
    }, []);

    const openCreateRoom = () => {
        setEditingRoom(null);
        setRoomForm(emptyRoomForm);
        setRoomModalOpen(true);
    };

    const openEditRoom = (room: MapRoom) => {
        setEditingRoom(room);
        setRoomForm({
            name: room.name,
            building_id: String(room.building_id),
            floor: String(room.floor),
        });
        setRoomModalOpen(true);
    };

    const closeRoomModal = () => {
        setRoomModalOpen(false);
        setEditingRoom(null);
        setRoomForm(emptyRoomForm);
    };

    const toRoomPayload = (): RoomPayload => ({
        name: roomForm.name.trim(),
        building_id: Number(roomForm.building_id),
        floor: Number(roomForm.floor),
    });

    const handleSaveRoom = async () => {
        if (!roomForm.name.trim()) {
            setError('Введите название комнаты');
            return;
        }

        if (!roomForm.building_id) {
            setError('Выберите корпус');
            return;
        }

        setSaving(true);
        setError(null);
        setMessage(null);

        try {
            const payload = toRoomPayload();
            if (editingRoom) {
                await updateRoom(editingRoom.id, payload);
                setMessage('Комната обновлена');
            } else {
                await createRoom(payload);
                setMessage('Комната создана');
            }

            await loadRooms();
            closeRoomModal();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ошибка запроса');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteRoom = async (room: MapRoom) => {
        if (!window.confirm(`Удалить комнату ${room.name}?`)) return;

        setDeletingId(room.id);
        setError(null);
        setMessage(null);

        try {
            await deleteRoom(room.id);
            await Promise.all([loadRooms(), loadConnections()]);
            setMessage('Комната удалена');
            if (editingRoom?.id === room.id) closeRoomModal();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ошибка запроса');
        } finally {
            setDeletingId(null);
        }
    };

    const resolveRoomId = (connection: MapConnection, side: 'from' | 'to') => {
        const directId = side === 'from' ? connection.from_room_id : connection.to_room_id;
        if (typeof directId === 'number' && !Number.isNaN(directId)) {
            return directId;
        }

        const roomName = side === 'from' ? connection.room_from : connection.room_to;
        if (!roomName) return null;

        const found = rooms.find(item => item.name === roomName);
        return found?.id ?? null;
    };

    const openCreateConnection = () => {
        setEditingConnection(null);
        setConnectionForm(emptyConnectionForm);
        setConnectionModalOpen(true);
    };

    const openEditConnection = (connection: MapConnection) => {
        const fromId = resolveRoomId(connection, 'from');
        const toId = resolveRoomId(connection, 'to');

        setEditingConnection(connection);
        setConnectionForm({
            from_room_id: fromId ? String(fromId) : '',
            to_room_id: toId ? String(toId) : '',
            distance: String(connection.distance),
            type: connection.type || 'corridor',
        });
        setConnectionModalOpen(true);
    };

    const closeConnectionModal = () => {
        setConnectionModalOpen(false);
        setEditingConnection(null);
        setConnectionForm(emptyConnectionForm);
    };

    const toConnectionPayload = (): ConnectionPayload => ({
        room_from: Number(connectionForm.from_room_id),
        room_to: Number(connectionForm.to_room_id),
        distance: Number(connectionForm.distance),
        type: connectionForm.type.trim() || undefined,
    });

    const handleSaveConnection = async () => {
        if (!connectionForm.from_room_id || !connectionForm.to_room_id) {
            setError('Выберите обе комнаты связи');
            return;
        }

        if (!connectionForm.distance) {
            setError('Укажите расстояние');
            return;
        }

        setSaving(true);
        setError(null);
        setMessage(null);

        try {
            const payload = toConnectionPayload();
            if (editingConnection) {
                await updateConnection(editingConnection.id, payload);
                setMessage('Связь обновлена');
            } else {
                await createConnection(payload);
                setMessage('Связь создана');
            }

            await loadConnections();
            closeConnectionModal();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ошибка запроса');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteConnection = async (connection: MapConnection) => {
        if (!window.confirm('Удалить связь?')) return;

        setDeletingId(connection.id);
        setError(null);
        setMessage(null);

        try {
            await deleteConnection(connection.id);
            await loadConnections();
            setMessage('Связь удалена');
            if (editingConnection?.id === connection.id) closeConnectionModal();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ошибка запроса');
        } finally {
            setDeletingId(null);
        }
    };

    const handleFindPath = () => {
        if (!pathStart.trim() || !pathEnd.trim()) {
            setError('Укажите ID начальной и конечной комнаты');
            return;
        }

        void runAction(async () => {
            const result = await findMapPath(pathStart.trim(), pathEnd.trim());
            setPathResult(JSON.stringify(result, null, 2));
            setMessage('Путь рассчитан');
        });
    };

    if (profile?.role !== 'admin') {
        return <p>У вас нет доступа к карте админа</p>;
    }

    return (
        <div className="admin-map-page">
            <header className="admin-map-header">
                <h1>Карта</h1>
                <p>Удобный CRUD для комнат и связей между ними</p>
            </header>

            <section className="admin-map-card">
                <h2>Поиск маршрута</h2>
                <div className="admin-map-inline-fields">
                    <label>
                        Start room ID
                        <input value={pathStart} onChange={event => setPathStart(event.target.value)} />
                    </label>
                    <label>
                        End room ID
                        <input value={pathEnd} onChange={event => setPathEnd(event.target.value)} />
                    </label>
                    <button type="button" disabled={busy} onClick={handleFindPath}>
                        Найти путь
                    </button>
                </div>
                <pre>{pathResult || 'Нет данных'}</pre>
            </section>

            <section className="admin-map-card">
                <div className="admin-map-section-header">
                    <h2>CRUD объектов карты</h2>
                    <div className="admin-map-tabs" role="tablist" aria-label="Сущности карты">
                        <button
                            type="button"
                            className={tab === 'rooms' ? 'active' : ''}
                            onClick={() => setTab('rooms')}
                        >
                            Комнаты
                        </button>
                        <button
                            type="button"
                            className={tab === 'connections' ? 'active' : ''}
                            onClick={() => setTab('connections')}
                        >
                            Связи
                        </button>
                    </div>
                </div>

                {busy && <p className="admin-map-status">Загрузка...</p>}
                {error && <p className="admin-map-error">{error}</p>}
                {message && <p className="admin-map-success">{message}</p>}

                {tab === 'rooms' && (
                    <div className="admin-map-entity">
                        <div className="admin-map-filters">
                            <label>
                                Поиск комнаты
                                <input
                                    value={roomSearch}
                                    onChange={event => setRoomSearch(event.target.value)}
                                    placeholder="A-101"
                                />
                            </label>
                            <label>
                                Корпус
                                <select
                                    value={roomBuildingFilter}
                                    onChange={event => setRoomBuildingFilter(event.target.value)}
                                >
                                    <option value="">Все</option>
                                    {buildings.map(item => (
                                        <option key={item.id} value={item.id}>
                                            {item.name}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label>
                                Этаж
                                <input
                                    value={roomFloorFilter}
                                    onChange={event => setRoomFloorFilter(event.target.value)}
                                    placeholder="1"
                                />
                            </label>
                            <div className="admin-map-actions-inline">
                                <button type="button" disabled={busy} onClick={() => void runAction(loadRooms)}>
                                    Обновить
                                </button>
                                <button type="button" disabled={busy} onClick={openCreateRoom}>
                                    Добавить комнату
                                </button>
                            </div>
                        </div>

                        <div className="admin-map-table">
                            <div className="admin-map-table-header admin-map-table-header--rooms">
                                <span>ID</span>
                                <span>Название</span>
                                <span>Корпус</span>
                                <span>Этаж</span>
                                <span>Действия</span>
                            </div>
                            {visibleRooms.map(item => (
                                <div key={item.id} className="admin-map-table-row admin-map-table-row--rooms">
                                    <span>{item.id}</span>
                                    <span>{item.name}</span>
                                    <span>{buildingsById.get(item.building_id)?.name ?? `#${item.building_id}`}</span>
                                    <span>{item.floor}</span>
                                    <span className="admin-map-row-actions">
                                        <button type="button" onClick={() => openEditRoom(item)}>
                                            Изменить
                                        </button>
                                        <button
                                            type="button"
                                            className="danger"
                                            onClick={() => void handleDeleteRoom(item)}
                                            disabled={deletingId === item.id}
                                        >
                                            Удалить
                                        </button>
                                    </span>
                                </div>
                            ))}
                            {!visibleRooms.length && !busy && <p className="admin-map-status">Комнаты не найдены</p>}
                        </div>
                    </div>
                )}

                {tab === 'connections' && (
                    <div className="admin-map-entity">
                        <div className="admin-map-filters">
                            <label>
                                Поиск связи
                                <input
                                    value={connectionSearch}
                                    onChange={event => setConnectionSearch(event.target.value)}
                                    placeholder="room / id / type"
                                />
                            </label>
                            <div className="admin-map-actions-inline">
                                <button
                                    type="button"
                                    disabled={busy}
                                    onClick={() => void runAction(loadConnections)}
                                >
                                    Обновить
                                </button>
                                <button type="button" disabled={busy} onClick={openCreateConnection}>
                                    Добавить связь
                                </button>
                            </div>
                        </div>

                        <div className="admin-map-table">
                            <div className="admin-map-table-header admin-map-table-header--connections">
                                <span>ID</span>
                                <span>From ID</span>
                                <span>Откуда</span>
                                <span>To ID</span>
                                <span>Куда</span>
                                <span>Distance</span>
                                <span>Тип</span>
                                <span>Действия</span>
                            </div>
                            {visibleConnections.map(item => {
                                const fromLabel = item.room_from ?? roomsById.get(item.from_room_id ?? -1)?.name;
                                const toLabel = item.room_to ?? roomsById.get(item.to_room_id ?? -1)?.name;

                                return (
                                    <div key={item.id} className="admin-map-table-row admin-map-table-row--connections">
                                        <span>{item.id}</span>
                                        <span>{item.from_room_id ?? resolveRoomId(item, 'from') ?? '—'}</span>
                                        <span>{fromLabel ?? '—'}</span>
                                        <span>{item.to_room_id ?? resolveRoomId(item, 'to') ?? '—'}</span>
                                        <span>{toLabel ?? '—'}</span>
                                        <span>{item.distance}</span>
                                        <span>{item.type ?? '—'}</span>
                                        <span className="admin-map-row-actions">
                                            <button type="button" onClick={() => openEditConnection(item)}>
                                                Изменить
                                            </button>
                                            <button
                                                type="button"
                                                className="danger"
                                                onClick={() => void handleDeleteConnection(item)}
                                                disabled={deletingId === item.id}
                                            >
                                                Удалить
                                            </button>
                                        </span>
                                    </div>
                                );
                            })}
                            {!visibleConnections.length && !busy && (
                                <p className="admin-map-status">Связи не найдены</p>
                            )}
                        </div>
                    </div>
                )}
            </section>

            <AdminModal
                open={roomModalOpen}
                title={editingRoom ? `Редактирование комнаты: ${editingRoom.name}` : 'Новая комната'}
                onClose={closeRoomModal}
            >
                <div className="admin-map-modal-form">
                    <label>
                        Название
                        <input
                            value={roomForm.name}
                            onChange={event => setRoomForm({ ...roomForm, name: event.target.value })}
                        />
                    </label>
                    <label>
                        Корпус
                        <select
                            value={roomForm.building_id}
                            onChange={event =>
                                setRoomForm({ ...roomForm, building_id: event.target.value })
                            }
                        >
                            <option value="">Выберите корпус</option>
                            {buildings.map(item => (
                                <option key={item.id} value={item.id}>
                                    {item.name}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label>
                        Этаж
                        <input
                            type="number"
                            value={roomForm.floor}
                            onChange={event => setRoomForm({ ...roomForm, floor: event.target.value })}
                        />
                    </label>
                    <div className="admin-map-modal-actions">
                        <button type="button" className="secondary" onClick={closeRoomModal} disabled={saving}>
                            Отмена
                        </button>
                        <button type="button" onClick={() => void handleSaveRoom()} disabled={saving}>
                            {saving ? 'Сохранение...' : 'Сохранить'}
                        </button>
                    </div>
                </div>
            </AdminModal>

            <AdminModal
                open={connectionModalOpen}
                title={editingConnection ? 'Редактирование связи' : 'Новая связь'}
                onClose={closeConnectionModal}
            >
                <div className="admin-map-modal-form">
                    <label>
                        From room ID
                        <input
                            type="number"
                            min="1"
                            value={connectionForm.from_room_id}
                            onChange={event =>
                                setConnectionForm({ ...connectionForm, from_room_id: event.target.value })
                            }
                            placeholder="1"
                        />
                    </label>
                    <label>
                        To room ID
                        <input
                            type="number"
                            min="1"
                            value={connectionForm.to_room_id}
                            onChange={event =>
                                setConnectionForm({ ...connectionForm, to_room_id: event.target.value })
                            }
                            placeholder="2"
                        />
                    </label>
                    <p className="admin-map-hint">
                        Доступные комнаты: {rooms.map(item => `${item.id}:${item.name}`).join(', ') || 'нет данных'}
                    </p>
                    <label>
                        Distance
                        <input
                            type="number"
                            min="0"
                            value={connectionForm.distance}
                            onChange={event =>
                                setConnectionForm({ ...connectionForm, distance: event.target.value })
                            }
                        />
                    </label>
                    <label>
                        Тип
                        <input
                            value={connectionForm.type}
                            onChange={event =>
                                setConnectionForm({ ...connectionForm, type: event.target.value })
                            }
                            placeholder="corridor / stairs"
                        />
                    </label>
                    <div className="admin-map-modal-actions">
                        <button
                            type="button"
                            className="secondary"
                            onClick={closeConnectionModal}
                            disabled={saving}
                        >
                            Отмена
                        </button>
                        <button type="button" onClick={() => void handleSaveConnection()} disabled={saving}>
                            {saving ? 'Сохранение...' : 'Сохранить'}
                        </button>
                    </div>
                </div>
            </AdminModal>
        </div>
    );
}

