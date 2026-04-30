import svgGroups from '../assets/graph.js';
import connections from '../assets/connections.js';

type SvgElement = {
    tag: string;
    id?: string;
    attrs?: Record<string, string>;
};

type SvgGroup = {
    elements?: SvgElement[];
    groups?: SvgGroup[];
};

type MapPoint = {
    x: number;
    y: number;
};

type MapConnection = {
    from: string;
    to: string;
    type?: string;
};

type MapEdge = {
    id: string;
    fromId: string;
    toId: string;
    type: string;
    from: MapPoint;
    to: MapPoint;
};

type MapGraph = {
    points: Map<string, MapPoint>;
    edges: MapEdge[];
    adjacency: Map<string, string[]>;
};

const MAP_VIEWBOX = {
    minX: 0,
    minY: 0,
    width: 154.05,
    height: 174.49,
};

const toNumber = (value?: string): number | null => {
    if (!value) return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
};

const flattenElements = (groups: SvgGroup[]): SvgElement[] => {
    const result: SvgElement[] = [];

    const visit = (group: SvgGroup) => {
        if (group.elements?.length) {
            result.push(...group.elements);
        }
        if (group.groups?.length) {
            group.groups.forEach(visit);
        }
    };

    groups.forEach(visit);

    return result;
};

const elementToPoint = (element: SvgElement): MapPoint | null => {
    if (element.tag === 'circle') {
        const cx = toNumber(element.attrs?.cx);
        const cy = toNumber(element.attrs?.cy);
        if (cx === null || cy === null) return null;
        return { x: cx, y: cy };
    }

    if (element.tag === 'line') {
        const x1 = toNumber(element.attrs?.x1);
        const y1 = toNumber(element.attrs?.y1);
        const x2 = toNumber(element.attrs?.x2);
        const y2 = toNumber(element.attrs?.y2);
        if (x1 === null || y1 === null || x2 === null || y2 === null) return null;
        return { x: (x1 + x2) / 2, y: (y1 + y2) / 2 };
    }

    return null;
};

const buildPointMap = (): Map<string, MapPoint> => {
    const points = new Map<string, MapPoint>();
    const elements = flattenElements(svgGroups as SvgGroup[]);

    for (const element of elements) {
        if (!element.id) continue;
        const point = elementToPoint(element);
        if (!point) continue;
        points.set(element.id, point);
    }

    return points;
};

const buildEdges = (points: Map<string, MapPoint>): { edges: MapEdge[]; adjacency: Map<string, string[]> } => {
    const edges: MapEdge[] = [];
    const adjacency = new Map<string, string[]>();

    const pushNeighbor = (fromId: string, toId: string) => {
        const neighbors = adjacency.get(fromId) ?? [];
        neighbors.push(toId);
        adjacency.set(fromId, neighbors);
    };

    for (const connection of connections as MapConnection[]) {
        const from = points.get(connection.from);
        const to = points.get(connection.to);
        if (!from || !to) continue;

        const type = connection.type ?? 'corridor';
        const id = `${connection.from}--${connection.to}`;

        edges.push({
            id,
            fromId: connection.from,
            toId: connection.to,
            type,
            from,
            to,
        });

        pushNeighbor(connection.from, connection.to);
        pushNeighbor(connection.to, connection.from);
    }

    return { edges, adjacency };
};

const buildMapGraph = (): MapGraph => {
    const points = buildPointMap();
    const { edges, adjacency } = buildEdges(points);
    return { points, edges, adjacency };
};

const findShortestPath = (adjacency: Map<string, string[]>, startId: string, endId: string): string[] | null => {
    if (!adjacency.has(startId) || !adjacency.has(endId)) return null;
    if (startId === endId) return [startId];

    const queue: string[] = [startId];
    const visited = new Set<string>([startId]);
    const previous = new Map<string, string | null>([[startId, null]]);

    while (queue.length) {
        const current = queue.shift();
        if (!current) continue;
        if (current === endId) break;

        for (const neighbor of adjacency.get(current) ?? []) {
            if (visited.has(neighbor)) continue;
            visited.add(neighbor);
            previous.set(neighbor, current);
            queue.push(neighbor);
        }
    }

    if (!previous.has(endId)) return null;

    const path: string[] = [];
    let cursor: string | null = endId;
    while (cursor) {
        path.push(cursor);
        cursor = previous.get(cursor) ?? null;
    }

    return path.reverse();
};

const isColinear = (first: MapPoint, middle: MapPoint, last: MapPoint, epsilon = 0.01): boolean => {
    const cross = (middle.x - first.x) * (last.y - first.y) - (middle.y - first.y) * (last.x - first.x);
    return Math.abs(cross) <= epsilon;
};

const simplifyPolylinePoints = (path: MapPoint[]): MapPoint[] => {
    if (path.length <= 2) return path;
    const simplified: MapPoint[] = [path[0]];

    for (let index = 1; index < path.length - 1; index += 1) {
        const previous = simplified[simplified.length - 1];
        const current = path[index];
        const next = path[index + 1];
        if (!current || !next) continue;
        if (previous && isColinear(previous, current, next)) continue;
        simplified.push(current);
    }

    simplified.push(path[path.length - 1]);
    return simplified;
};

const buildPolylinePoints = (pathIds: string[], points: Map<string, MapPoint>): string => {
    const pathPoints = pathIds
        .map(id => points.get(id))
        .filter((point): point is MapPoint => Boolean(point));

    const simplified = simplifyPolylinePoints(pathPoints);

    return simplified.map(point => `${point.x},${point.y}`).join(' ');
};

export type { MapEdge, MapGraph, MapPoint };
export { MAP_VIEWBOX, buildMapGraph, buildPolylinePoints, findShortestPath };

