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
    description: string;
};

type ConnectionFormState = {
    room_from: string;
    room_to: string;
    distance: string;
    type: string;
};

const emptyRoomForm: RoomFormState = {
    name: '',
    building_id: '',
    floor: '1',
    description: '',
};

const emptyConnectionForm: ConnectionFormState = {
    room_from: '',
    room_to: '',
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

    const roomsById = useMemo(() => new Map(rooms.map(item => [item.id, item])), [rooms]);
    const buildingsById = useMemo(() => new Map(buildings.map(item => [item.id, item])), [buildings]);

    const pathRoomOptions = useMemo(() => {
        return [...rooms].sort((a, b) => a.name.localeCompare(b.name, 'ru', { sensitivity: 'base' }));
    }, [rooms]);

    const visibleRooms = useMemo(() => {
        const query = roomSearch.trim().toLowerCase();

        return rooms
            .filter(item => {
                const matchesText =
                    !query ||
                    item.name.toLowerCase().includes(query) ||
                    item.description.toLowerCase().includes(query);
                const matchesBuilding = !roomBuildingFilter || String(item.building_id) === roomBuildingFilter;
                const matchesFloor = !roomFloorFilter || String(item.floor) === roomFloorFilter;
                return matchesText && matchesBuilding && matchesFloor;
            })
            .sort((a, b) => a.name.localeCompare(b.name, 'ru', { sensitivity: 'base' }));
    }, [roomBuildingFilter, roomFloorFilter, roomSearch, rooms]);

    const visibleConnections = useMemo(() => {
        const query = connectionSearch.trim().toLowerCase();
        if (!query) return connections;

        return connections.filter(item => {
            const fromLabel = item.room_from ?? roomsById.get(item.from_room_id ?? -1)?.name ?? '';
            const toLabel = item.room_to ?? roomsById.get(item.to_room_id ?? -1)?.name ?? '';
            const haystack = `${item.id} ${fromLabel} ${toLabel} ${item.type ?? ''}`.toLowerCase();
            return haystack.includes(query);
        });
    }, [connectionSearch, connections, roomsById]);

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

    const closeRoomModal = () => {
        setRoomModalOpen(false);
        setEditingRoom(null);
        setRoomForm(emptyRoomForm);
    };

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
            description: room.description,
        });
        setRoomModalOpen(true);
    };

    const toRoomPayload = (): RoomPayload => ({
        name: roomForm.name.trim(),
        building_id: Number(roomForm.building_id),
        floor: Number(roomForm.floor),
        description: roomForm.description.trim(),
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
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ошибка запроса');
        } finally {
            setDeletingId(null);
        }
    };

    const closeConnectionModal = () => {
        setConnectionModalOpen(false);
        setEditingConnection(null);
        setConnectionForm(emptyConnectionForm);
    };

    const openCreateConnection = () => {
        setEditingConnection(null);
        setConnectionForm(emptyConnectionForm);
        setConnectionModalOpen(true);
    };

    const openEditConnection = (connection: MapConnection) => {
        const roomFrom = connection.room_from ?? roomsById.get(connection.from_room_id ?? -1)?.name ?? '';
        const roomTo = connection.room_to ?? roomsById.get(connection.to_room_id ?? -1)?.name ?? '';

        setEditingConnection(connection);
        setConnectionForm({
            room_from: roomFrom,
            room_to: roomTo,
            distance: String(connection.distance),
            type: connection.type || 'corridor',
        });
        setConnectionModalOpen(true);
    };

    const toConnectionPayload = (): ConnectionPayload | null => {
        const roomFrom = connectionForm.room_from.trim();
        const roomTo = connectionForm.room_to.trim();
        if (!roomFrom || !roomTo) return null;

        return {
            room_from: roomFrom,
            room_to: roomTo,
            distance: Number(connectionForm.distance),
            type: connectionForm.type.trim() || undefined,
        };
    };

    const handleSaveConnection = async () => {
        const payload = toConnectionPayload();
        if (!payload) {
            setError('Выберите обе комнаты');
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
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ошибка запроса');
        } finally {
            setDeletingId(null);
        }
    };

    const handleFindPath = () => {
        if (!pathStart.trim() || !pathEnd.trim()) {
            setError('Выберите начальную и конечную комнату');
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
                        Start room
                        <select value={pathStart} onChange={event => setPathStart(event.target.value)}>
                            <option value="">Выберите комнату</option>
                            {pathRoomOptions.map(room => (
                                <option key={room.id} value={String(room.id)}>
                                    {room.name}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label>
                        End room
                        <select value={pathEnd} onChange={event => setPathEnd(event.target.value)}>
                            <option value="">Выберите комнату</option>
                            {pathRoomOptions.map(room => (
                                <option key={room.id} value={String(room.id)}>
                                    {room.name}
                                </option>
                            ))}
                        </select>
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
                        <button type="button" className={tab === 'rooms' ? 'active' : ''} onClick={() => setTab('rooms')}>
                            Комнаты
                        </button>
                        <button type="button" className={tab === 'connections' ? 'active' : ''} onClick={() => setTab('connections')}>
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
                                <input value={roomSearch} onChange={event => setRoomSearch(event.target.value)} placeholder="A-101" />
                            </label>
                            <label>
                                Корпус
                                <select value={roomBuildingFilter} onChange={event => setRoomBuildingFilter(event.target.value)}>
                                    <option value="">Все</option>
                                    {buildings.map(item => (
                                        <option key={item.id} value={item.id}>{item.name}</option>
                                    ))}
                                </select>
                            </label>
                            <label>
                                Этаж
                                <input value={roomFloorFilter} onChange={event => setRoomFloorFilter(event.target.value)} placeholder="1" />
                            </label>
                            <div className="admin-map-actions-inline">
                                <button type="button" disabled={busy} onClick={() => void runAction(loadRooms)}>Обновить</button>
                                <button type="button" disabled={busy} onClick={openCreateRoom}>Добавить комнату</button>
                            </div>
                        </div>

                        <div className="admin-map-table">
                            <div className="admin-map-table-header admin-map-table-header--rooms">
                                <span>ID</span>
                                <span>Название</span>
                                <span>Описание</span>
                                <span>Корпус</span>
                                <span>Этаж</span>
                                <span>Действия</span>
                            </div>
                            {visibleRooms.map(item => (
                                <div key={item.id} className="admin-map-table-row admin-map-table-row--rooms">
                                    <span>{item.id}</span>
                                    <span>{item.name}</span>
                                    <span>{item.description || '—'}</span>
                                    <span>{buildingsById.get(item.building_id)?.name ?? `#${item.building_id}`}</span>
                                    <span>{item.floor}</span>
                                    <span className="admin-map-row-actions">
                                        <button type="button" onClick={() => openEditRoom(item)}>Изменить</button>
                                        <button type="button" className="danger" onClick={() => void handleDeleteRoom(item)} disabled={deletingId === item.id}>Удалить</button>
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
                                <input value={connectionSearch} onChange={event => setConnectionSearch(event.target.value)} placeholder="room / type" />
                            </label>
                            <div className="admin-map-actions-inline">
                                <button type="button" disabled={busy} onClick={() => void runAction(loadConnections)}>Обновить</button>
                                <button type="button" disabled={busy} onClick={openCreateConnection}>Добавить связь</button>
                            </div>
                        </div>

                        <div className="admin-map-table">
                            <div className="admin-map-table-header admin-map-table-header--connections">
                                <span>ID</span>
                                <span>Откуда</span>
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
                                        <span>{fromLabel ?? '—'}</span>
                                        <span>{toLabel ?? '—'}</span>
                                        <span>{item.distance}</span>
                                        <span>{item.type ?? '—'}</span>
                                        <span className="admin-map-row-actions">
                                            <button type="button" onClick={() => openEditConnection(item)}>Изменить</button>
                                            <button type="button" className="danger" onClick={() => void handleDeleteConnection(item)} disabled={deletingId === item.id}>Удалить</button>
                                        </span>
                                    </div>
                                );
                            })}
                            {!visibleConnections.length && !busy && <p className="admin-map-status">Связи не найдены</p>}
                        </div>
                    </div>
                )}
            </section>

            <AdminModal open={roomModalOpen} title={editingRoom ? `Редактирование комнаты: ${editingRoom.name}` : 'Новая комната'} onClose={closeRoomModal}>
                <div className="admin-map-modal-form">
                    <label>
                        Название
                        <input value={roomForm.name} onChange={event => setRoomForm({ ...roomForm, name: event.target.value })} />
                    </label>
                    <label>
                        Описание
                        <input value={roomForm.description} onChange={event => setRoomForm({ ...roomForm, description: event.target.value })} placeholder="Краткое описание комнаты" />
                    </label>
                    <label>
                        Корпус
                        <select value={roomForm.building_id} onChange={event => setRoomForm({ ...roomForm, building_id: event.target.value })}>
                            <option value="">Выберите корпус</option>
                            {buildings.map(item => (
                                <option key={item.id} value={item.id}>{item.name}</option>
                            ))}
                        </select>
                    </label>
                    <label>
                        Этаж
                        <input type="number" value={roomForm.floor} onChange={event => setRoomForm({ ...roomForm, floor: event.target.value })} />
                    </label>
                    <div className="admin-map-modal-actions">
                        <button type="button" className="secondary" onClick={closeRoomModal} disabled={saving}>Отмена</button>
                        <button type="button" onClick={() => void handleSaveRoom()} disabled={saving}>{saving ? 'Сохранение...' : 'Сохранить'}</button>
                    </div>
                </div>
            </AdminModal>

            <AdminModal open={connectionModalOpen} title={editingConnection ? 'Редактирование связи' : 'Новая связь'} onClose={closeConnectionModal}>
                <div className="admin-map-modal-form">
                    <label>
                        Откуда
                        <select value={connectionForm.room_from} onChange={event => setConnectionForm({ ...connectionForm, room_from: event.target.value })}>
                            <option value="">Выберите комнату</option>
                            {rooms.map(item => (
                                <option key={item.id} value={item.name}>{item.name}</option>
                            ))}
                        </select>
                    </label>
                    <label>
                        Куда
                        <select value={connectionForm.room_to} onChange={event => setConnectionForm({ ...connectionForm, room_to: event.target.value })}>
                            <option value="">Выберите комнату</option>
                            {rooms.map(item => (
                                <option key={item.id} value={item.name}>{item.name}</option>
                            ))}
                        </select>
                    </label>
                    <label>
                        Distance
                        <input type="number" min="0" value={connectionForm.distance} onChange={event => setConnectionForm({ ...connectionForm, distance: event.target.value })} />
                    </label>
                    <label>
                        Тип
                        <input value={connectionForm.type} onChange={event => setConnectionForm({ ...connectionForm, type: event.target.value })} placeholder="corridor / stairs" />
                    </label>
                    <div className="admin-map-modal-actions">
                        <button type="button" className="secondary" onClick={closeConnectionModal} disabled={saving}>Отмена</button>
                        <button type="button" onClick={() => void handleSaveConnection()} disabled={saving}>{saving ? 'Сохранение...' : 'Сохранить'}</button>
                    </div>
                </div>
            </AdminModal>
        </div>
    );
}
