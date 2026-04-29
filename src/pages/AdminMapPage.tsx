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
import { floor2PlanTest } from '../data/building/floor2Test';
import type { GetPathResponse } from '../api/types/types';
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

type GraphNeighbor = {
    connectionId: number;
    targetRoomId: number;
    targetRoomName: string;
    distance: number;
    type: string;
};

type GraphNode = {
    roomId: number;
    roomName: string;
    buildingId: number;
    floor: number;
    neighbors: GraphNeighbor[];
};

type RoomGraph = {
    nodes: GraphNode[];
    validConnectionCount: number;
    invalidConnectionIds: number[];
    isolatedRoomIds: number[];
};

type SvgGraphNode = {
    roomId: number;
    roomName: string;
    buildingId: number;
    floor: number;
    corridorY: number;
    x: number;
    y: number;
    isIsolated: boolean;
};

type SvgGraphZone = {
    key: string;
    label: string;
    x: number;
    y: number;
    width: number;
    height: number;
    corridorY: number;
};

type SvgGraphEdge = {
    key: string;
    fromRoomId: number;
    toRoomId: number;
    pathD: string;
    labelX: number;
    labelY: number;
    distance: number;
    type: string;
};

type SvgGraphLayout = {
    width: number;
    height: number;
    zones: SvgGraphZone[];
    nodes: SvgGraphNode[];
    edges: SvgGraphEdge[];
};

type SvgViewBox = {
    minX: number;
    minY: number;
    width: number;
    height: number;
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

const parseViewBox = (viewBox: string): SvgViewBox => {
    const parts = viewBox.trim().split(/\s+/).map(Number);
    if (parts.length !== 4 || parts.some(part => Number.isNaN(part))) {
        return { minX: 0, minY: 0, width: 1000, height: 600 };
    }
    const [minX, minY, width, height] = parts;
    return { minX, minY, width, height };
};

const floor2ViewBox = parseViewBox(floor2PlanTest.viewBox);
const floor2PointsById = new Map(floor2PlanTest.points.map(point => [point.id, point]));
const floor2Routes = floor2PlanTest.routes
    .map(route => {
        const from = floor2PointsById.get(route.from);
        const to = floor2PointsById.get(route.to);
        if (!from || !to) return null;
        return { ...route, from, to };
    })
    .filter((route): route is NonNullable<typeof route> => Boolean(route));

const normalizeFloorPointId = (value: string) => value.trim().toLowerCase();

type FloorPlanPointItem = (typeof floor2PlanTest.points)[number];

type FloorRouteGraph = Map<string, string[]>;

const getFloorPointCandidates = (rawId: string) => {
    const normalized = normalizeFloorPointId(rawId);
    if (!normalized) return [];

    const exactMatches = floor2PlanTest.points.filter(point => {
        const pointId = normalizeFloorPointId(point.id);
        const labelId = normalizeFloorPointId(point.label);
        return pointId === normalized || labelId === normalized;
    });

    if (exactMatches.length) return exactMatches;

    return floor2PlanTest.points.filter(point => {
        const pointId = normalizeFloorPointId(point.id);
        const labelId = normalizeFloorPointId(point.label);
        return pointId.startsWith(normalized) || labelId.startsWith(normalized);
    });
};

const floor2RouteGraph = buildFloorRouteGraph(floor2PlanTest.routes);

function buildFloorRouteGraph(routes: typeof floor2PlanTest.routes): FloorRouteGraph {
    const adjacency = new Map<string, string[]>();
    for (const point of floor2PlanTest.points) {
        adjacency.set(point.id, []);
    }

    for (const route of routes) {
        if (!floor2PointsById.has(route.from) || !floor2PointsById.has(route.to)) continue;
        adjacency.get(route.from)?.push(route.to);
        adjacency.get(route.to)?.push(route.from);
    }

    return adjacency;
}

function findFloorRoutePath(startIds: string[], endIds: string[], adjacency: FloorRouteGraph): string[] | null {
    if (!startIds.length || !endIds.length || adjacency.size === 0) return null;

    const endSet = new Set(endIds);
    const queue: string[] = [];
    const prev = new Map<string, string | null>();

    for (const startId of startIds) {
        if (!adjacency.has(startId)) continue;
        prev.set(startId, null);
        queue.push(startId);
    }

    while (queue.length) {
        const current = queue.shift();
        if (!current) continue;

        if (endSet.has(current)) {
            const path: string[] = [];
            let node: string | null = current;
            while (node) {
                path.push(node);
                node = prev.get(node) ?? null;
            }
            return path.reverse();
        }

        for (const neighbor of adjacency.get(current) ?? []) {
            if (prev.has(neighbor)) continue;
            prev.set(neighbor, current);
            queue.push(neighbor);
        }
    }

    return null;
}

function buildFloorRoutePoints(pathIds: string[], adjacency: FloorRouteGraph): FloorPlanPointItem[] {
    if (!pathIds.length) return [];

    if (pathIds.length === 1) {
        return getFloorPointCandidates(pathIds[0]).slice(0, 1);
    }

    const result: FloorPlanPointItem[] = [];

    for (let index = 0; index < pathIds.length - 1; index += 1) {
        const startCandidates = getFloorPointCandidates(pathIds[index]);
        const endCandidates = getFloorPointCandidates(pathIds[index + 1]);

        if (!startCandidates.length || !endCandidates.length) continue;

        const segmentIds = findFloorRoutePath(
            startCandidates.map(point => point.id),
            endCandidates.map(point => point.id),
            adjacency,
        );

        const idsToUse = segmentIds ?? [startCandidates[0].id, endCandidates[0].id];

        for (const pointId of idsToUse) {
            const point = floor2PointsById.get(pointId);
            if (!point) continue;
            if (result.length && result[result.length - 1].id === point.id) continue;
            result.push(point);
        }
    }

    return result;
}

function findMissingFloorPoints(pathIds: string[]) {
    return pathIds.filter(roomId => getFloorPointCandidates(roomId).length === 0);
}

const normalizeRoomName = (value: string) => value.trim().toLocaleLowerCase('ru');

function buildRoomGraph(rooms: MapRoom[], connections: MapConnection[]): RoomGraph {
    const roomsById = new Map(rooms.map(room => [room.id, room]));
    const roomIdByName = new Map<string, number>();

    for (const room of rooms) {
        const key = normalizeRoomName(room.name);
        if (!roomIdByName.has(key)) {
            roomIdByName.set(key, room.id);
        }
    }

    const adjacency = new Map<number, GraphNeighbor[]>();
    for (const room of rooms) {
        adjacency.set(room.id, []);
    }

    const invalidConnectionIds: number[] = [];
    let validConnectionCount = 0;

    const resolveRoomId = (roomId: number | undefined, roomName: string | undefined): number | null => {
        if (typeof roomId === 'number' && roomsById.has(roomId)) {
            return roomId;
        }

        if (roomName) {
            const resolvedByName = roomIdByName.get(normalizeRoomName(roomName));
            if (typeof resolvedByName === 'number') {
                return resolvedByName;
            }
        }

        return null;
    };

    for (const connection of connections) {
        const fromId = resolveRoomId(connection.from_room_id, connection.room_from);
        const toId = resolveRoomId(connection.to_room_id, connection.room_to);

        if (!fromId || !toId) {
            invalidConnectionIds.push(connection.id);
            continue;
        }

        const fromRoom = roomsById.get(fromId);
        const toRoom = roomsById.get(toId);

        if (!fromRoom || !toRoom) {
            invalidConnectionIds.push(connection.id);
            continue;
        }

        validConnectionCount += 1;
        const edgeType = connection.type ?? 'corridor';

        adjacency.get(fromId)?.push({
            connectionId: connection.id,
            targetRoomId: toRoom.id,
            targetRoomName: toRoom.name,
            distance: connection.distance,
            type: edgeType,
        });

        // Assume undirected navigation between connected rooms.
        adjacency.get(toId)?.push({
            connectionId: connection.id,
            targetRoomId: fromRoom.id,
            targetRoomName: fromRoom.name,
            distance: connection.distance,
            type: edgeType,
        });
    }

    const nodes: GraphNode[] = rooms
        .map(room => ({
            roomId: room.id,
            roomName: room.name,
            buildingId: room.building_id,
            floor: room.floor,
            neighbors: [...(adjacency.get(room.id) ?? [])].sort((a, b) => a.targetRoomName.localeCompare(b.targetRoomName, 'ru', { sensitivity: 'base' })),
        }))
        .sort((a, b) => a.roomName.localeCompare(b.roomName, 'ru', { sensitivity: 'base' }));

    const isolatedRoomIds = nodes.filter(node => node.neighbors.length === 0).map(node => node.roomId);

    return {
        nodes,
        validConnectionCount,
        invalidConnectionIds,
        isolatedRoomIds,
    };
}

function buildSvgGraphLayout(graph: RoomGraph): SvgGraphLayout {
    const buildingIds = [...new Set(graph.nodes.map(node => node.buildingId))].sort((a, b) => a - b);
    const floors = [...new Set(graph.nodes.map(node => node.floor))].sort((a, b) => a - b);

    const zoneWidth = 280;
    const zoneHeight = 120;
    const marginX = 70;
    const marginY = 70;
    const gapX = 40;
    const gapY = 44;

    const width = Math.max(900, marginX * 2 + buildingIds.length * zoneWidth + Math.max(0, buildingIds.length - 1) * gapX);
    const height = Math.max(520, marginY * 2 + floors.length * zoneHeight + Math.max(0, floors.length - 1) * gapY);

    if (!graph.nodes.length) {
        return { width, height, zones: [], nodes: [], edges: [] };
    }

    const buildingIndex = new Map(buildingIds.map((id, index) => [id, index]));
    const floorIndex = new Map(floors.map((value, index) => [value, index]));

    const zones: SvgGraphZone[] = [];
    const nodesByZone = new Map<string, GraphNode[]>();

    for (const node of graph.nodes) {
        const zoneKey = `${node.buildingId}:${node.floor}`;
        const bucket = nodesByZone.get(zoneKey) ?? [];
        bucket.push(node);
        nodesByZone.set(zoneKey, bucket);
    }

    for (const [zoneKey] of nodesByZone) {
        const [buildingText, floorText] = zoneKey.split(':');
        const buildingId = Number(buildingText);
        const floor = Number(floorText);
        const col = buildingIndex.get(buildingId) ?? 0;
        const row = floorIndex.get(floor) ?? 0;

        const x = marginX + col * (zoneWidth + gapX);
        const y = marginY + row * (zoneHeight + gapY);
        const corridorY = y + zoneHeight / 2;

        zones.push({
            key: zoneKey,
            label: `Корпус ${buildingId}, этаж ${floor}`,
            x,
            y,
            width: zoneWidth,
            height: zoneHeight,
            corridorY,
        });
    }

    zones.sort((a, b) => a.y - b.y || a.x - b.x);

    const zoneByKey = new Map(zones.map(zone => [zone.key, zone]));
    const positionedNodes: SvgGraphNode[] = [];

    for (const [zoneKey, nodes] of nodesByZone) {
        const zone = zoneByKey.get(zoneKey);
        if (!zone) continue;

        const sortedNodes = [...nodes].sort((a, b) => a.roomName.localeCompare(b.roomName, 'ru', { sensitivity: 'base' }));
        const stepX = zone.width / (sortedNodes.length + 1);

        sortedNodes.forEach((node, index) => {
            const x = zone.x + stepX * (index + 1);
            const y = zone.corridorY + (index % 2 === 0 ? -26 : 26);

            positionedNodes.push({
                roomId: node.roomId,
                roomName: node.roomName,
                buildingId: node.buildingId,
                floor: node.floor,
                corridorY: zone.corridorY,
                x,
                y,
                isIsolated: node.neighbors.length === 0,
            });
        });
    }

    const nodeById = new Map(positionedNodes.map(node => [node.roomId, node]));
    const usedConnectionIds = new Set<number>();
    const edges: SvgGraphEdge[] = [];

    for (const node of graph.nodes) {
        for (const neighbor of node.neighbors) {
            if (usedConnectionIds.has(neighbor.connectionId)) continue;

            const fromNode = nodeById.get(node.roomId);
            const toNode = nodeById.get(neighbor.targetRoomId);
            if (!fromNode || !toNode) continue;

            usedConnectionIds.add(neighbor.connectionId);

            const centerX = (fromNode.x + toNode.x) / 2;
            const centerY = (fromNode.corridorY + toNode.corridorY) / 2;
            const pathD = [
                `M ${fromNode.x} ${fromNode.y}`,
                `L ${fromNode.x} ${fromNode.corridorY}`,
                `L ${centerX} ${fromNode.corridorY}`,
                `L ${centerX} ${toNode.corridorY}`,
                `L ${toNode.x} ${toNode.corridorY}`,
                `L ${toNode.x} ${toNode.y}`,
            ].join(' ');

            edges.push({
                key: String(neighbor.connectionId),
                fromRoomId: fromNode.roomId,
                toRoomId: toNode.roomId,
                pathD,
                labelX: centerX,
                labelY: centerY - 6,
                distance: neighbor.distance,
                type: neighbor.type,
            });
        }
    }

    return {
        width,
        height,
        zones,
        nodes: positionedNodes,
        edges,
    };
}

const svgNodeRadius = 18;
const shortRoomLabel = (name: string) => (name.length > 10 ? `${name.slice(0, 9)}...` : name);

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
    const [pathData, setPathData] = useState<GetPathResponse | null>(null);

    const [roomModalOpen, setRoomModalOpen] = useState(false);
    const [connectionModalOpen, setConnectionModalOpen] = useState(false);
    const [editingRoom, setEditingRoom] = useState<MapRoom | null>(null);
    const [editingConnection, setEditingConnection] = useState<MapConnection | null>(null);

    const [roomForm, setRoomForm] = useState<RoomFormState>(emptyRoomForm);
    const [connectionForm, setConnectionForm] = useState<ConnectionFormState>(emptyConnectionForm);

    const roomsById = useMemo(() => new Map(rooms.map(item => [item.id, item])), [rooms]);
    const buildingsById = useMemo(() => new Map(buildings.map(item => [item.id, item])), [buildings]);
    const roomGraph = useMemo(() => buildRoomGraph(rooms, connections), [rooms, connections]);
    const svgGraphLayout = useMemo(() => buildSvgGraphLayout(roomGraph), [roomGraph]);

    const pathRoomOptions = useMemo(() => {
        return [...rooms].sort((a, b) => a.name.localeCompare(b.name, 'ru', { sensitivity: 'base' }));
    }, [rooms]);

    const activeFloorRoutePoints = useMemo(() => {
        return buildFloorRoutePoints(pathData?.path ?? [], floor2RouteGraph);
    }, [pathData]);

    const activeFloorRoutePolyline = useMemo(() => {
        return activeFloorRoutePoints.map(point => `${point.x},${point.y}`).join(' ');
    }, [activeFloorRoutePoints]);

    const missingFloorPointIds = useMemo(() => {
        return findMissingFloorPoints(pathData?.path ?? []);
    }, [pathData]);

    const formatRoomOptionLabel = (room: MapRoom) => {
        const description = room.description.trim();
        return description ? `${room.name} - ${description}` : room.name;
    };

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

        setPathData(null);
        setPathResult('');

        void runAction(async () => {
            const result = await findMapPath(pathStart.trim(), pathEnd.trim());
            setPathData(result);
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
                                <option key={room.id} value={room.name}>
                                    {formatRoomOptionLabel(room)}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label>
                        End room
                        <select value={pathEnd} onChange={event => setPathEnd(event.target.value)}>
                            <option value="">Выберите комнату</option>
                            {pathRoomOptions.map(room => (
                                <option key={room.id} value={room.name}>
                                    {formatRoomOptionLabel(room)}
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
                <h2>Граф комнат и связей</h2>
                <p className="admin-map-status">
                    Комнат: {roomGraph.nodes.length}, валидных связей: {roomGraph.validConnectionCount}, изолированных комнат: {roomGraph.isolatedRoomIds.length}
                </p>
                {!!roomGraph.invalidConnectionIds.length && (
                    <p className="admin-map-hint">
                        Пропущено связей с неизвестными комнатами: {roomGraph.invalidConnectionIds.join(', ')}
                    </p>
                )}

                <div className="admin-map-svg-wrap">
                    {svgGraphLayout.nodes.length ? (
                        <svg
                            className="admin-map-svg"
                            viewBox={`0 0 ${svgGraphLayout.width} ${svgGraphLayout.height}`}
                            role="img"
                            aria-label="Визуализация графа комнат и связей"
                        >
                            <g>
                                {svgGraphLayout.zones.map(zone => (
                                    <g key={zone.key}>
                                        <rect
                                            x={zone.x}
                                            y={zone.y}
                                            width={zone.width}
                                            height={zone.height}
                                            rx={12}
                                            className="admin-map-svg-zone"
                                        />
                                        <line x1={zone.x + 16} y1={zone.corridorY} x2={zone.x + zone.width - 16} y2={zone.corridorY} className="admin-map-svg-corridor" />
                                        <text x={zone.x + 10} y={zone.y + 16} className="admin-map-svg-zone-label">{zone.label}</text>
                                    </g>
                                ))}
                            </g>

                            <g>
                                {svgGraphLayout.edges.map(edge => {
                                    const isSpecialType = edge.type !== 'corridor';

                                    return (
                                        <g key={edge.key}>
                                            <path d={edge.pathD} className={isSpecialType ? 'admin-map-svg-edge admin-map-svg-edge--special' : 'admin-map-svg-edge'} />
                                            <text x={edge.labelX} y={edge.labelY} className="admin-map-svg-edge-label">
                                                {edge.distance}
                                            </text>
                                        </g>
                                    );
                                })}
                            </g>

                            <g>
                                {svgGraphLayout.nodes.map(node => (
                                    <g key={node.roomId}>
                                        <circle
                                            cx={node.x}
                                            cy={node.y}
                                            r={svgNodeRadius}
                                            className={node.isIsolated ? 'admin-map-svg-node admin-map-svg-node--isolated' : 'admin-map-svg-node'}
                                        />
                                        <text x={node.x} y={node.y + 4} className="admin-map-svg-node-label">
                                            {shortRoomLabel(node.roomName)}
                                        </text>
                                        <title>{`${node.roomName} (#${node.roomId}), корпус ${node.buildingId}, этаж ${node.floor}`}</title>
                                    </g>
                                ))}
                            </g>
                        </svg>
                    ) : (
                        <p className="admin-map-status">Нет данных для SVG-графа</p>
                    )}
                </div>

                <div className="admin-map-graph-list">
                    {roomGraph.nodes.map(node => (
                        <article key={node.roomId} className="admin-map-graph-node">
                            <h3>
                                {node.roomName} (#{node.roomId})
                            </h3>
                            <p className="admin-map-hint">
                                {buildingsById.get(node.buildingId)?.name ?? `Корпус #${node.buildingId}`}, этаж {node.floor}
                            </p>
                            {node.neighbors.length > 0 ? (
                                <ul>
                                    {node.neighbors.map(neighbor => (
                                        <li key={`${neighbor.connectionId}-${neighbor.targetRoomId}`}>
                                            {neighbor.targetRoomName} (dist: {neighbor.distance}, type: {neighbor.type})
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="admin-map-hint">Нет связей</p>
                            )}
                        </article>
                    ))}
                    {!roomGraph.nodes.length && !busy && <p className="admin-map-status">Данные для графа отсутствуют</p>}
                </div>
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
                            {pathRoomOptions.map(room => (
                                <option key={room.id} value={room.name}>{formatRoomOptionLabel(room)}</option>
                            ))}
                        </select>
                    </label>
                    <label>
                        Куда
                        <select value={connectionForm.room_to} onChange={event => setConnectionForm({ ...connectionForm, room_to: event.target.value })}>
                            <option value="">Выберите комнату</option>
                            {pathRoomOptions.map(room => (
                                <option key={room.id} value={room.name}>{formatRoomOptionLabel(room)}</option>
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

            <section className="admin-map-card">
                <h2>Тест: план 2 этажа</h2>
                <p className="admin-map-hint">
                    SVG берется из `src/assets/TechUpMap.svg` через `src/data/building/floor2Test.ts`. Обновите {`viewBox`} и координаты точек там же.
                </p>
                {!!missingFloorPointIds.length && (
                    <p className="admin-map-hint">
                        Не найдены точки для маршрута: {missingFloorPointIds.join(', ')}
                    </p>
                )}
                <div className="admin-map-floor-wrap">
                    <svg
                        className="admin-map-floor-svg"
                        viewBox={floor2PlanTest.viewBox}
                        role="img"
                        aria-label="Тестовый план 2 этажа"
                    >
                        <image
                            href={floor2PlanTest.svgUrl}
                            x={floor2ViewBox.minX}
                            y={floor2ViewBox.minY}
                            width={floor2ViewBox.width}
                            height={floor2ViewBox.height}
                            preserveAspectRatio="xMidYMid meet"
                        />
                        <g className="admin-map-floor-routes">
                            {floor2Routes.map(route => (
                                <line
                                    key={route.id}
                                    x1={route.from.x}
                                    y1={route.from.y}
                                    x2={route.to.x}
                                    y2={route.to.y}
                                    className="admin-map-floor-route"
                                    stroke={route.color ?? undefined}
                                />
                            ))}
                        </g>
                        <g className="admin-map-floor-active-route">
                            {!!activeFloorRoutePolyline && (
                                <polyline
                                    points={activeFloorRoutePolyline}
                                    className="admin-map-floor-route admin-map-floor-route--active"
                                />
                            )}
                            {activeFloorRoutePoints.map((point, index) => (
                                <circle
                                    key={`${point.id}-${index}`}
                                    cx={point.x}
                                    cy={point.y}
                                    r={2.4}
                                    className="admin-map-floor-route-point"
                                />
                            ))}
                        </g>
                        <g className="admin-map-floor-points">
                            {floor2PlanTest.points.map(point => (
                                <g key={point.id}>
                                    <circle cx={point.x} cy={point.y} r={1.5} className="admin-map-floor-point" />
                                    <text x={point.x} y={point.y - 3} className="admin-map-floor-point-label">
                                        {point.label}
                                    </text>
                                </g>
                            ))}
                        </g>
                    </svg>
                </div>
            </section>
        </div>
    );
}
