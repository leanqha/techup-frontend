import { useMemo, useState } from 'react';
import TechUpMapUrl from '../assets/TechUpMap.svg';
import { buildMapGraph, buildPolylinePoints, findShortestPath, MAP_VIEWBOX } from '../utils/mapRoutes';
import './AdminMapPage.css';

const formatPointId = (value: string) => value.trim();

export function AdminMapPage() {
    const mapGraph = useMemo(() => buildMapGraph(), []);
    const pointIds = useMemo(() => [...mapGraph.points.keys()].sort(), [mapGraph]);

    const defaultStartId = pointIds[0] ?? '';
    const defaultEndId = pointIds[pointIds.length - 1] ?? '';

    const [startId, setStartId] = useState(defaultStartId);
    const [endId, setEndId] = useState(defaultEndId);

    const pathIds = useMemo(() => {
        if (!startId || !endId) return [];
        return findShortestPath(mapGraph.adjacency, startId, endId) ?? [];
    }, [endId, mapGraph, startId]);

    const activeRoutePoints = useMemo(() => buildPolylinePoints(pathIds, mapGraph.points), [mapGraph, pathIds]);

    return (
        <section className="admin-map-page">
            <header className="map-header">
                <h1>Карта корпуса</h1>
                <p>Маршруты строятся на фронтенде по данным графа и соединений.</p>
            </header>

            <div className="map-controls">
                <label className="map-field">
                    <span>Старт</span>
                    <input
                        className="map-input"
                        list="map-point-ids"
                        value={startId}
                        onChange={event => setStartId(formatPointId(event.target.value))}
                        placeholder="node-1-2-0"
                    />
                </label>
                <label className="map-field">
                    <span>Финиш</span>
                    <input
                        className="map-input"
                        list="map-point-ids"
                        value={endId}
                        onChange={event => setEndId(formatPointId(event.target.value))}
                        placeholder="node-1-2-35"
                    />
                </label>
                <datalist id="map-point-ids">
                    {pointIds.map(id => (
                        <option key={id} value={id} />
                    ))}
                </datalist>
            </div>

            <div className="map-frame">
                <svg
                    className="map-svg"
                    viewBox={`${MAP_VIEWBOX.minX} ${MAP_VIEWBOX.minY} ${MAP_VIEWBOX.width} ${MAP_VIEWBOX.height}`}
                    preserveAspectRatio="xMidYMid meet"
                    role="img"
                    aria-label="SVG карта корпуса"
                >
                    <image href={TechUpMapUrl} x={MAP_VIEWBOX.minX} y={MAP_VIEWBOX.minY} width={MAP_VIEWBOX.width} height={MAP_VIEWBOX.height} />
                    <g className="map-routes">
                        {activeRoutePoints && <polyline className="map-route" points={activeRoutePoints} />}
                    </g>
                </svg>
            </div>
        </section>
    );
}
