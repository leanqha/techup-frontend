import { useMemo, useRef, useState, useLayoutEffect } from 'react';
import { ReactSVGPanZoom, TOOL_AUTO, POSITION_NONE, INITIAL_VALUE } from 'react-svg-pan-zoom';
import TechUpMapUrl from '../assets/TechUpMap.svg';
import { buildMapGraph, buildPolylinePoints, findShortestPath, MAP_VIEWBOX } from '../utils/mapRoutes';
import './AdminMapPage.css';

const formatPointId = (value: string) => value.trim();

const MIN_SCALE = 0.1;
const MAX_SCALE = 4;
const WHEEL_ZOOM_STEP = 1.03;

type ViewerSize = {
    width: number;
    height: number;
};

type PanZoomViewerHandle = {
    zoomOnViewerCenter: (scaleFactor: number) => void;
    fitToViewer: () => void;
    reset: () => void;
    getValue?: () => typeof INITIAL_VALUE;
};

const useElementSize = (ref: React.RefObject<HTMLElement | null>): ViewerSize => {
    const [size, setSize] = useState<ViewerSize>({ width: 0, height: 0 });

    useLayoutEffect(() => {
        const element = ref.current;
        if (!element) return undefined;

        const updateSize = () => {
            const rect = element.getBoundingClientRect();
            setSize({ width: Math.round(rect.width), height: Math.round(rect.height) });
        };

        updateSize();

        if (typeof ResizeObserver === 'undefined') {
            window.addEventListener('resize', updateSize);
            return () => window.removeEventListener('resize', updateSize);
        }

        const observer = new ResizeObserver(entries => {
            for (const entry of entries) {
                setSize({
                    width: Math.round(entry.contentRect.width),
                    height: Math.round(entry.contentRect.height),
                });
            }
        });

        observer.observe(element);
        return () => observer.disconnect();
    }, [ref]);

    return size;
};

export function AdminMapPage() {
    const mapGraph = useMemo(() => buildMapGraph(), []);
    const pointIds = useMemo(() => [...mapGraph.points.keys()].sort(), [mapGraph]);

    const [startId, setStartId] = useState('');
    const [endId, setEndId] = useState('');
    const [viewerValue, setViewerValue] = useState(INITIAL_VALUE);
    const [mapReady, setMapReady] = useState(false);
    const mapFrameRef = useRef<HTMLDivElement | null>(null);
    const viewerRef = useRef<PanZoomViewerHandle | null>(null);
    const viewerSize = useElementSize(mapFrameRef);
    const hasViewerSize = viewerSize.width > 0 && viewerSize.height > 0;

    useLayoutEffect(() => {
        if (!hasViewerSize || !viewerRef.current || !mapReady) return;
        const frame = requestAnimationFrame(() => {
            viewerRef.current?.reset();
            viewerRef.current?.fitToViewer();
            const nextValue = viewerRef.current?.getValue?.();
            if (nextValue != null) {
                setViewerValue(nextValue);
            }
        });
        return () => cancelAnimationFrame(frame);
    }, [hasViewerSize, mapReady, viewerSize.height, viewerSize.width]);

    const pathIds = useMemo(() => {
        if (!startId || !endId) return [];
        return findShortestPath(mapGraph.adjacency, startId, endId) ?? [];
    }, [endId, mapGraph, startId]);

    const activeRoutePoints = useMemo(() => buildPolylinePoints(pathIds, mapGraph.points), [mapGraph, pathIds]);

    return (
        <section className="admin-map-page">
            <div className="map-frame" ref={mapFrameRef}>
                <div className="map-controls map-controls-overlay">
                    <input
                        className="map-input"
                        list="map-point-ids"
                        value={startId}
                        onChange={event => setStartId(formatPointId(event.target.value))}
                        placeholder="Откуда"
                        aria-label="Откуда"
                    />
                    <input
                        className="map-input"
                        list="map-point-ids"
                        value={endId}
                        onChange={event => setEndId(formatPointId(event.target.value))}
                        placeholder="Куда"
                        aria-label="Куда"
                    />
                    <datalist id="map-point-ids">
                        {pointIds.map(id => (
                            <option key={id} value={id} />
                        ))}
                    </datalist>
                </div>

                {hasViewerSize && (
                    <ReactSVGPanZoom
                        ref={viewerRef}
                        width={viewerSize.width}
                        height={viewerSize.height}
                        value={viewerValue}
                        onChangeValue={setViewerValue}
                        tool={TOOL_AUTO}
                        detectWheel
                        detectPinchGesture
                        preventPanOutside
                        autoPan={false}
                        scaleFactorMin={MIN_SCALE}
                        scaleFactorMax={MAX_SCALE}
                        scaleFactorOnWheel={WHEEL_ZOOM_STEP}
                        background="transparent"
                        SVGBackground="#ffffff"
                        className="map-svg"
                        toolbarProps={{ position: POSITION_NONE }}
                        miniatureProps={{ position: POSITION_NONE }}
                    >
                        <svg
                            viewBox={`${MAP_VIEWBOX.minX} ${MAP_VIEWBOX.minY} ${MAP_VIEWBOX.width} ${MAP_VIEWBOX.height}`}
                            width={MAP_VIEWBOX.width}
                            height={MAP_VIEWBOX.height}
                            preserveAspectRatio="xMidYMid meet"
                            role="img"
                            aria-label="SVG карта корпуса"
                        >
                            <defs>
                                <marker
                                    id="route-arrow"
                                    viewBox="0 0 6 6"
                                    refX="6"
                                    refY="3"
                                    markerWidth="4"
                                    markerHeight="4"
                                    orient="auto"
                                    markerUnits="userSpaceOnUse"
                                >
                                    <path className="map-route-arrow" d="M0 0 L6 3 L0 6 Z" />
                                </marker>
                            </defs>
                            <image
                                href={TechUpMapUrl}
                                x={MAP_VIEWBOX.minX}
                                y={MAP_VIEWBOX.minY}
                                width={MAP_VIEWBOX.width}
                                height={MAP_VIEWBOX.height}
                                onLoad={() => setMapReady(true)}
                            />
                            <g className="map-routes">
                                {activeRoutePoints && <polyline className="map-route" points={activeRoutePoints} markerEnd="url(#route-arrow)" />}
                            </g>
                        </svg>
                    </ReactSVGPanZoom>
                )}
            </div>
        </section>
    );
}
