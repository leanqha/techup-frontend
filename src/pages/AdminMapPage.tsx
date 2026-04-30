import { useMemo, useRef, useState, useCallback } from 'react';
import TechUpMapUrl from '../assets/TechUpMap.svg';
import { buildMapGraph, buildPolylinePoints, findShortestPath, MAP_VIEWBOX } from '../utils/mapRoutes';
import './AdminMapPage.css';

const formatPointId = (value: string) => value.trim();

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

type ViewBoxState = {
    x: number;
    y: number;
    width: number;
    height: number;
};

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const ZOOM_STEP = 1.2;

const createDefaultViewBox = (): ViewBoxState => ({
    x: MAP_VIEWBOX.minX,
    y: MAP_VIEWBOX.minY,
    width: MAP_VIEWBOX.width,
    height: MAP_VIEWBOX.height,
});

export function AdminMapPage() {
    const mapGraph = useMemo(() => buildMapGraph(), []);
    const pointIds = useMemo(() => [...mapGraph.points.keys()].sort(), [mapGraph]);

    const defaultStartId = pointIds[0] ?? '';
    const defaultEndId = pointIds[pointIds.length - 1] ?? '';

    const [startId, setStartId] = useState(defaultStartId);
    const [endId, setEndId] = useState(defaultEndId);
    const [viewBox, setViewBox] = useState<ViewBoxState>(() => createDefaultViewBox());
    const svgRef = useRef<SVGSVGElement | null>(null);

    const clampViewBox = useCallback((nextViewBox: ViewBoxState): ViewBoxState => {
        const minX = MAP_VIEWBOX.minX;
        const minY = MAP_VIEWBOX.minY;
        const maxX = MAP_VIEWBOX.minX + MAP_VIEWBOX.width - nextViewBox.width;
        const maxY = MAP_VIEWBOX.minY + MAP_VIEWBOX.height - nextViewBox.height;

        return {
            x: clamp(nextViewBox.x, minX, maxX),
            y: clamp(nextViewBox.y, minY, maxY),
            width: nextViewBox.width,
            height: nextViewBox.height,
        };
    }, []);

    const getViewBoxCenter = useCallback((currentViewBox: ViewBoxState) => ({
        x: currentViewBox.x + currentViewBox.width / 2,
        y: currentViewBox.y + currentViewBox.height / 2,
    }), []);

    const zoomTo = useCallback((nextScale: number, anchor: { x: number; y: number }) => {
        const clampedScale = clamp(nextScale, MIN_SCALE, MAX_SCALE);
        const nextWidth = MAP_VIEWBOX.width / clampedScale;
        const nextHeight = MAP_VIEWBOX.height / clampedScale;
        const ratioX = (anchor.x - viewBox.x) / viewBox.width;
        const ratioY = (anchor.y - viewBox.y) / viewBox.height;

        const nextX = anchor.x - ratioX * nextWidth;
        const nextY = anchor.y - ratioY * nextHeight;

        setViewBox(clampViewBox({
            x: nextX,
            y: nextY,
            width: nextWidth,
            height: nextHeight,
        }));
    }, [clampViewBox, viewBox]);

    const getAnchorFromEvent = useCallback((event: React.WheelEvent<SVGSVGElement>) => {
        if (!svgRef.current) return null;
        const rect = svgRef.current.getBoundingClientRect();
        const ratioX = clamp((event.clientX - rect.left) / rect.width, 0, 1);
        const ratioY = clamp((event.clientY - rect.top) / rect.height, 0, 1);

        return {
            x: viewBox.x + viewBox.width * ratioX,
            y: viewBox.y + viewBox.height * ratioY,
        };
    }, [viewBox]);

    const handleWheel = useCallback((event: React.WheelEvent<SVGSVGElement>) => {
        event.preventDefault();
        const currentScale = MAP_VIEWBOX.width / viewBox.width;
        const nextScale = event.deltaY > 0 ? currentScale / ZOOM_STEP : currentScale * ZOOM_STEP;
        const anchor = getAnchorFromEvent(event) ?? getViewBoxCenter(viewBox);
        zoomTo(nextScale, anchor);
    }, [getAnchorFromEvent, getViewBoxCenter, viewBox, zoomTo]);

    const handleZoomIn = useCallback(() => {
        const currentScale = MAP_VIEWBOX.width / viewBox.width;
        zoomTo(currentScale * ZOOM_STEP, getViewBoxCenter(viewBox));
    }, [getViewBoxCenter, viewBox, zoomTo]);

    const handleZoomOut = useCallback(() => {
        const currentScale = MAP_VIEWBOX.width / viewBox.width;
        zoomTo(currentScale / ZOOM_STEP, getViewBoxCenter(viewBox));
    }, [getViewBoxCenter, viewBox, zoomTo]);

    const handleZoomReset = useCallback(() => {
        setViewBox(createDefaultViewBox());
    }, []);

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
                <div className="map-zoom">
                    <span>Масштаб</span>
                    <div className="map-zoom-buttons">
                        <button className="map-zoom-button" type="button" onClick={handleZoomOut} aria-label="Уменьшить">
                            -
                        </button>
                        <button className="map-zoom-button" type="button" onClick={handleZoomIn} aria-label="Увеличить">
                            +
                        </button>
                        <button className="map-zoom-button" type="button" onClick={handleZoomReset} aria-label="Сбросить масштаб">
                            1:1
                        </button>
                    </div>
                </div>
                <datalist id="map-point-ids">
                    {pointIds.map(id => (
                        <option key={id} value={id} />
                    ))}
                </datalist>
            </div>

            <div className="map-frame">
                <svg
                    className="map-svg"
                    ref={svgRef}
                    viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
                    preserveAspectRatio="xMidYMid meet"
                    role="img"
                    aria-label="SVG карта корпуса"
                    onWheel={handleWheel}
                >
                    <defs>
                        <marker
                            id="route-arrow"
                            viewBox="0 0 10 8"
                            refX="9"
                            refY="4"
                            markerWidth="6"
                            markerHeight="6"
                            orient="auto"
                            markerUnits="strokeWidth"
                        >
                            <path className="map-route-arrow" d="M0 0 L10 4 L0 8 Z" />
                        </marker>
                    </defs>
                    <image href={TechUpMapUrl} x={MAP_VIEWBOX.minX} y={MAP_VIEWBOX.minY} width={MAP_VIEWBOX.width} height={MAP_VIEWBOX.height} />
                    <g className="map-routes">
                        {activeRoutePoints && <polyline className="map-route" points={activeRoutePoints} markerEnd="url(#route-arrow)" />}
                    </g>
                </svg>
            </div>
        </section>
    );
}
